import { Page } from "puppeteer";
import {
  closeBrowser,
  downloadAndExtract,
  flattenFolder,
  initializeBrowser,
  sleep,
} from "../utils";
import XmlParser from "../services/parser";
import fs from "fs/promises";
import { emit } from ".";
import { config } from "../config";

const parser = new XmlParser();
const credentials = config.credentials["morning-star"];

const loadPage = async (page: Page) => {
  const url = `https://dbrs.morningstar.com/contact`;

  await page.goto(url, {
    waitUntil: "networkidle0",
    timeout: 0,
  });

  emit.message("Page loaded");
};

const agreeWithPrivacyNotice = async (page: Page) => {
  const okButtonSelector =
    "#mat-dialog-0 > app-gdpr-message > div > div.login-right > button";

  try {
    await page.waitForSelector(okButtonSelector, {
      timeout: 5000,
      visible: true,
    });

    await page.click(okButtonSelector);

    emit.message("Agreed with Privacy Notice");
  } catch (error) {
    const err = error as any;
    if (err.name === "TimeoutError") {
      emit.message("Privacy Notice did not appear. Skipping...");
    }
  }
};

const waitForCaptcha = async (page: Page) => {
  const captchaSelector = "#ngrecaptcha-0 > div > div > iframe";

  try {
    await page.waitForSelector(captchaSelector, {
      visible: true,
      timeout: 5000,
    });

    console.log("dsfdf");

    throw new Error(
      "Captcha detected! Please use the manual upload method or retry in few hours"
    );
  } catch (error) {
    const err = error as any;
    if (err.name !== "TimeoutError") {
      throw new Error(err.message ?? err);
    }
  }
};

const goToLoginPage = async (page: Page) => {
  const loginButtonSelector =
    "body > app-root > app-site-header > div > nav.main-nav > div > ul > li:nth-child(7) > a";

  await page.waitForSelector(loginButtonSelector, {
    timeout: 0,
    visible: true,
  });

  await page.click(loginButtonSelector);

  emit.message("Login button clicked");

  await waitForCaptcha(page);

  await page.waitForNavigation({
    waitUntil: "networkidle2",
    timeout: 0,
  });

  emit.message("Login page loaded");
};

const enterCredentials = async (page: Page) => {
  const loginInputSelector = "#usernameField";
  const passwordInputSelector = "#passwordField";

  if (!credentials[0] || !credentials[1]) {
    throw new Error("No credentials for Morning Star!");
  }

  await page.waitForSelector(loginInputSelector, {
    visible: true,
    timeout: 0,
  });

  await page.waitForSelector(passwordInputSelector, {
    visible: true,
    timeout: 0,
  });

  await page.type(loginInputSelector, credentials[0]);
  await page.type(passwordInputSelector, credentials[1]);

  emit.message("Credentials entered");
};

const submitCredentials = async (page: Page) => {
  const submitButtonSelector = "#btn-login";

  await page.waitForSelector(submitButtonSelector, {
    visible: true,
    timeout: 0,
  });

  await page.click(submitButtonSelector);

  emit.message("Credentials submitted");

  await page.waitForNavigation({
    waitUntil: "load",
    timeout: 0,
  });

  emit.message("Login to Morning Star successful!");
};

const goToDownloadPage = async (page: Page) => {
  const downloadPageUrl = "https://dbrs.morningstar.com/about/historyAgree";

  await page.goto(downloadPageUrl, {
    waitUntil: "networkidle2",
    timeout: 0,
  });

  emit.message("Download page loaded");
};

const agreeWithTerms = async (page: Page) => {
  const agreeCheckboxSelector = "#acceptance-check-box";

  await page.waitForSelector(agreeCheckboxSelector, {
    timeout: 0,
    visible: true,
  });

  await page.click(agreeCheckboxSelector);

  emit.message("Agreed with terms");
};

const getDownloadUrl = async (page: Page) => {
  const downloadButtonSelector =
    "#main-content > app-history-agree > div > section > div > div > div.grid-2of3 > div:nth-child(6) > button";

  await page.waitForSelector(downloadButtonSelector, {
    timeout: 0,
    visible: true,
  });

  await page.click(downloadButtonSelector);

  await page.setRequestInterception(true);

  const downloadUrlPromise = new Promise<string>((resolve) => {
    const targetDownloadUrl = "https://dbrs.morningstar.com/xbrl/";

    page.on("request", (request) => {
      if (request.url().startsWith(targetDownloadUrl)) {
        // Abort the request to prevent the browser from downloading the file
        request.abort();
        page.close();
        resolve(request.url());
      } else {
        request.continue();
      }
    });
  });

  await page.waitForSelector(downloadButtonSelector, {
    visible: true,
    timeout: 0,
  });

  await page.click(downloadButtonSelector);
  emit.message("Download button clicked");

  // Wait for the download request to be captured
  const downloadUrl = await downloadUrlPromise;

  return downloadUrl;
};

const getMorningStarHistory = (abortController: AbortController) => {
  let dirPath: string;

  return new Promise(async (resolve, reject) => {
    abortController.signal.addEventListener(
      "abort",
      async () => {
        emit.message("Aborting...");

        await browser.close();

        if (dirPath) {
          await fs.rm(dirPath, { recursive: true, force: true });
        }

        reject("Operation aborted");
      },
      { once: true }
    );

    emit.message("Getting Morning Star history files...");

    const { browser, page } = await initializeBrowser();
    emit.message("Headless browser initialized");

    await loadPage(page);
    await agreeWithPrivacyNotice(page);
    await goToLoginPage(page);
    await enterCredentials(page);
    await submitCredentials(page);
    await goToDownloadPage(page);
    await agreeWithTerms(page);

    const downloadUrl = await getDownloadUrl(page);

    if (!downloadUrl) {
      emit.error("Failed to get download URL");
      return;
    }

    emit.message(
      "Downloading and extracting XML files (It could take a while, please be patient...)"
    );

    dirPath = await downloadAndExtract(downloadUrl);

    if (!dirPath) {
      emit.error("Failed to download or extract history files");
      return;
    }

    emit.message("Downloading completed!");

    // Close browser
    await closeBrowser(browser);
    emit.message("Browser closed");

    // Flatten folder
    await flattenFolder(dirPath);

    // Process files
    emit.message("Parsing data and creating CSV files...");
    await parser.processXmlFiles(dirPath);

    emit.message(
      "Morning Star history files successfully processed. Deleting folder with XML files..."
    );

    // Remove XML files from temp dir
    await fs.rm(dirPath, { recursive: true, force: true });

    emit.message("Morning Star XML files successfully deleted!");

    resolve("Success");
  });
};

export { getMorningStarHistory };
