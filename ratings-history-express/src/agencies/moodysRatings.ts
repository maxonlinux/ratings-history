import { Browser, Page, Target } from "puppeteer";
import fs from "fs/promises";
import Parser from "../services/parser";
import { emit } from ".";
import { config } from "../config";
import { downloader } from "../services";

const parser = new Parser();
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

const getDownloadUrlAndCookie = async (page: Page, browser: Browser) => {
  const selector =
    "body > app-root > main > app-sec-rule17g > app-intro-content > div.content.mt-6.mb-6 > div > div.text > p:nth-child(9) > a";

  const newPagePromise = new Promise<Target>((resolve) =>
    browser.once("targetcreated", resolve)
  );

  await page.waitForSelector(selector, {
    timeout: 0,
    visible: true,
  });

  await page.click(selector);
  emit.message("Download button clicked");

  const newPageTarget = await newPagePromise;
  const newPage = await newPageTarget.page();

  if (!newPage) {
    emit.error("Failed to open tab with download");
    return;
  }

  emit.message("New tab with download page opened");

  const downloadUrlAndCookiePromise = new Promise<string>((resolve) => {
    const targetDownloadUrl = "https://www.moodys.com/uploadpage/Compliance/";

    newPage.on("request", (request) => {
      if (request.url().startsWith(targetDownloadUrl)) {
        // Abort the request to prevent the browser from downloading the file
        request.abort();
        page.close();
        resolve(
          JSON.stringify({
            downloadUrl: request.url(),
            cookie: request.headers()["cookie"],
          })
        );
      } else {
        request.continue();
      }
    });
  });

  await newPage.setRequestInterception(true);

  const resolved = await downloadUrlAndCookiePromise;

  const { downloadUrl, cookie } = JSON.parse(resolved);

  return { downloadUrl, cookie };
};

const getMoodysRatings = (abortController: AbortController) => {
  let zipFilePath: string;

  return new Promise(async (resolve, reject) => {
    abortController.signal.addEventListener(
      "abort",
      async () => {
        try {
          emit.message("Aborting...");

          await browser.close();

          if (zipFilePath) {
            await fs.rm(zipFilePath);
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

    const { page, browser } = await downloader.initializeBrowser();

    // Login
    await loadLoginPage(page);
    emit.message("Login page loaded");
    await enterCredentials(page);
    emit.message("Credentials entered");
    await submitCredentials(page);
    emit.message("Login to Moody's successful!");
    await goToDownloadPage(page);
    emit.message("Download page loaded");

    const downloadUrlAndCookie = await getDownloadUrlAndCookie(page, browser);

    if (!downloadUrlAndCookie) {
      emit.error("Failed to get download URL and/or cookie");
      return;
    }

    const { downloadUrl, cookie } = downloadUrlAndCookie;

    emit.message("Success: " + downloadUrl);

    // Close browser
    await downloader.closeBrowser(browser);
    emit.message("Browser closed");

    // Download files
    emit.message(
      "Downloading ZIP (It could take a while, please be patient...)"
    );

    zipFilePath = await downloader.downloadZip(downloadUrl, { cookie });

    if (!zipFilePath) {
      emit.error("Failed to download ZIP");
      return;
    }

    emit.message("Downloading completed!");

    // Process files
    emit.message("Parsing data and creating CSV files...");

    await parser.processZipArchive(zipFilePath);

    emit.message(
      "Moody's history files successfully processed. Deleting ZIP..."
    );

    // Remove XML files from temp dir
    await fs.rm(zipFilePath, { recursive: true, force: true });

    emit.message("ZIP successfully deleted!");

    resolve("Success");
  });
};

export { getMoodysRatings };
