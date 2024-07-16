import { Page } from "puppeteer";
import { closeBrowser, downloadAndExtract, initializeBrowser } from "../utils";
import fs from "fs/promises";
import XmlParser from "../services/parser";
import { emit } from ".";
import { config } from "../config";

const parser = new XmlParser();
const credentials = config.credentials["moodys-ratings"];

const loadLoginPage = async (page: Page) => {
  const loginPageUrl = "https://ratings.moodys.com/login";

  await page.goto(loginPageUrl, {
    waitUntil: "load",
    timeout: 0,
  });
};

const enterCredentials = async (page: Page) => {
  const loginInputSelector = "#idp-discovery-username";
  const nextButtonSelector = "#idp-discovery-submit";
  const passwordInputSelector = "#okta-signin-password";

  if (!credentials[0] || !credentials[1]) {
    throw new Error("No credentials for Moody's Ratings!");
  }

  await page.waitForSelector(loginInputSelector, {
    visible: true,
    timeout: 0,
  });

  await page.type(loginInputSelector, credentials[0]);

  await page.waitForSelector(nextButtonSelector, {
    visible: true,
    timeout: 0,
  });

  console.log("Login entered");

  await page.click(nextButtonSelector);
  console.log("Next button clicked");

  await page.waitForSelector(passwordInputSelector, {
    visible: true,
    timeout: 0,
  });

  await page.type(passwordInputSelector, credentials[1]);
  console.log("Password entered");
};

const submitCredentials = async (page: Page) => {
  const submitButtonSelector = "#okta-signin-submit";

  await page.waitForSelector(submitButtonSelector, {
    visible: true,
    timeout: 0,
  });

  await page.click(submitButtonSelector);
  console.log("Credentials submitted");

  await page.waitForNavigation({
    waitUntil: "networkidle2",
    timeout: 0,
  });
};

const goToDownloadPage = async (page: Page) => {
  const downloadPageUrl = "https://ratings.moodys.com/sec-17g-7b";

  await page.goto(downloadPageUrl, {
    waitUntil: "load",
    timeout: 0,
  });

  await page.waitForNavigation({
    waitUntil: "networkidle2",
    timeout: 0,
  });
};

const getUrl = async (page: Page) => {
  const selector =
    "body > app-root > main > app-sec-rule17g > app-intro-content > div.content.mt-6.mb-6 > div > div.text > p:nth-child(9) > a";

  await page.waitForSelector(selector, {
    timeout: 0,
    visible: true,
  });

  const downloadUrl = await page.$eval(
    selector,
    (el) => (el as HTMLAnchorElement).href
  );

  return downloadUrl;
};

const getMoodysRatings = (abortController: AbortController) => {
  let dirPath: string;

  return new Promise(async (resolve, reject) => {
    abortController.signal.addEventListener(
      "abort",
      async () => {
        try {
          emit.message("Aborting...");

          await browser.close();

          if (dirPath) {
            await fs.rm(dirPath, {
              recursive: true,
              force: true,
            });
          }

          reject("Operation aborted");
        } catch (error) {
          const err = error as any;
          emit.error(err.message ? err.message : err);
        }
      },
      { once: true }
    );

    emit.message("Getting Moody's history files...");

    const { page, browser } = await initializeBrowser();

    // Login
    await loadLoginPage(page);
    emit.message("Login page loaded");
    await enterCredentials(page);
    emit.message("Credentials entered");
    await submitCredentials(page);
    emit.message("Login to Moody's successful!");
    await goToDownloadPage(page);
    emit.message("Download page loaded");

    const downloadUrl = await getUrl(page);

    if (!downloadUrl) {
      emit.error("Failed to download or extract history files");
      return;
    }

    emit.message("Success: " + downloadUrl);

    // Download files
    emit.message(
      "Downloading and extracting XML files (It could take a while, please be patient...)"
    );

    dirPath = await downloadAndExtract(downloadUrl);

    if (!dirPath) {
      emit.error("Failed to download or extract history files");
      return;
    }

    emit.message("Downloading and extraction completed!");

    // Close browser
    await closeBrowser(browser);
    emit.message("Browser closed");

    // Process files
    emit.message("Parsing data and creating CSV files...");
    await parser.processXmlFiles(dirPath);

    emit.message(
      "Moody's history files successfully processed. Deleting folder with XML files..."
    );

    // Remove XML files from temp dir
    await fs.rm(dirPath, { recursive: true, force: true });

    emit.message("Moody's XML files successfully deleted!");

    resolve("Success");
  });
};

export { getMoodysRatings };
