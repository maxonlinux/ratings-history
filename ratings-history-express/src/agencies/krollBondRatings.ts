import { Browser, Page, Target } from "puppeteer";
import { closeBrowser, downloadAndExtract, initializeBrowser } from "../utils";
import fs from "fs/promises";
import XmlParser from "../services/parser";
import { emit } from ".";
import { config } from "../config";

const parser = new XmlParser();

const credentials = config.credentials["kroll-bond-ratings"];

const loadPage = async (page: Page) => {
  const url = `https://www.kbra.com/`;

  await page.goto(url, {
    waitUntil: "load",
    timeout: 0,
  });
};

const goToLoginPage = async (page: Page) => {
  const loginButtonSelector = '[data-testid="login-button"]';

  await page.waitForSelector(loginButtonSelector, {
    visible: true,
    timeout: 0,
  });

  await page.click(loginButtonSelector);
  emit.message("Login button clicked");

  await page.waitForNavigation({
    waitUntil: "load",
    timeout: 0,
  });
};

const enterCredentials = async (page: Page) => {
  const loginInputSelector = "#username";
  const passwordInputSelector = "#password";

  if (!credentials[0] || !credentials[1]) {
    throw new Error("No credentials for Kroll Bond!");
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
};

const submitCredentials = async (page: Page) => {
  const submitButtonSelector = "#login-button";

  await page.waitForSelector(submitButtonSelector, {
    visible: true,
    timeout: 0,
  });

  await page.click(submitButtonSelector);

  await page.waitForNavigation({
    waitUntil: "load",
    timeout: 0,
  });

  emit.message("Login successfull!");
};

const getDownloadUrl = async (
  page: Page,
  browser: Browser,
  linkSelector: string
): Promise<string | undefined> => {
  const downloadPageUrl =
    "https://www.kbra.com/regulatory/disclosures/form-nrsro";

  const downloadButtonSelector =
    "body > div.min-h-screen > div > main > div > div > div > div > div > div > div.m-2 > form > button";

  const targetDownloadUrl = "https://dotcom-api.kbra.com";

  await page.goto(downloadPageUrl, {
    waitUntil: "networkidle2",
    timeout: 0,
  });

  emit.message("Navigated to download page");

  const newPagePromise = new Promise<Target>((resolve) =>
    browser.once("targetcreated", resolve)
  );

  await page.click(linkSelector);
  emit.message("Link clicked");

  // Wait for the new tab to open and switch to it
  const newPageTarget = await newPagePromise;
  const newPage = await newPageTarget.page();

  if (!newPage) {
    emit.error("Failed to open page with download button");
    return;
  }

  emit.message("New tab with download button opened");

  // Enable request interception
  await newPage.setRequestInterception(true);

  const downloadUrlPromise = new Promise<string>((resolve) => {
    newPage.on("request", (request) => {
      if (request.url().startsWith(targetDownloadUrl)) {
        // Abort the request to prevent the browser from downloading the file
        request.abort();
        newPage.close();
        resolve(request.url());
      } else {
        request.continue();
      }
    });
  });

  await newPage.waitForSelector(downloadButtonSelector, {
    visible: true,
    timeout: 0,
  });

  await newPage.click(downloadButtonSelector);
  emit.message("Download button clicked");

  // Wait for the download request to be captured
  const downloadUrl = await downloadUrlPromise;

  return downloadUrl;
};

const getKrollBondRatingsHistory = (abortController: AbortController) => {
  return new Promise(async (resolve, reject) => {
    const downloadedFilesPaths: string[] = [];

    abortController.signal.addEventListener(
      "abort",
      async () => {
        try {
          emit.message("Aborting...");

          await browser.close();

          for (const path of downloadedFilesPaths) {
            await fs.rm(path, {
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

    emit.message("Getting KBRA history files...");

    const issueLevelRatingsPageLinkSelector =
      "body > div.min-h-screen > div > div > main > div > div > div.flex.basis-full.flex-col.overflow-x-hidden > div > div > ul:nth-child(7) > li:nth-child(1) > p > a";
    const issuerLevelRatingsPageLinkSelector =
      "body > div.min-h-screen > div > div > main > div > div > div.flex.basis-full.flex-col.overflow-x-hidden > div > div > ul:nth-child(7) > li:nth-child(2) > p > a";

    const { page, browser } = await initializeBrowser();
    emit.message("Headless browser initialized");

    // Login
    await loadPage(page);
    emit.message("Page loaded");
    await goToLoginPage(page);
    emit.message("Redirected to login page");
    await enterCredentials(page);
    emit.message("Credentials entered");
    await submitCredentials(page);
    emit.message("Credentials submitted");

    // Getting download links
    const downloadUrls: string[] = [];

    const issueUrl = await getDownloadUrl(
      page,
      browser,
      issueLevelRatingsPageLinkSelector
    );

    if (issueUrl) {
      downloadUrls.push(issueUrl);
    }

    const issuerUrl = await getDownloadUrl(
      page,
      browser,
      issuerLevelRatingsPageLinkSelector
    );

    if (issuerUrl) {
      downloadUrls.push(issuerUrl);
    }

    if (!downloadUrls.length) {
      emit.error("Failed to get download URLs");
      return;
    }

    emit.message(`Found ${downloadUrls.length} URLs`);

    // Download files
    emit.message(
      "Downloading and extracting XML files (It could take a while, please be patient...)"
    );

    for (const url of downloadUrls) {
      const filePath = await downloadAndExtract(url);
      downloadedFilesPaths.push(filePath);
    }

    emit.message("Downloading and extraction completed!");

    // Close browser
    await closeBrowser(browser);
    emit.message("Browser closed");

    // Process files
    emit.message("Parsing data and creating CSV files...");

    for (const path of downloadedFilesPaths) {
      await parser.processXmlFiles(path);
    }

    emit.message(
      "KBRA history files successfully processed. Deleting folder with XML files..."
    );

    // Remove XML files from temp dir
    for (const path of downloadedFilesPaths) {
      await fs.rm(path, { recursive: true, force: true });
    }

    emit.message("KBRA XML files successfully deleted!");

    resolve("Success");
  });
};

export { getKrollBondRatingsHistory };
