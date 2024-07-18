import { Page } from "puppeteer";
import fs from "fs/promises";
import Parser from "../services/parser";
import { emit } from ".";
import { downloader } from "../services";

const parser = new Parser();

const loadPage = async (page: Page) => {
  try {
    const url = `https://www.fitchratings.com/ratings-history-disclosure`;

    await page.goto(url, {
      waitUntil: "load",
      timeout: 0,
    });
    return true;
  } catch (error) {
    return false;
  }
};

const getUrl = async (page: Page) => {
  try {
    const selector = "#btn-1";

    await page.waitForSelector(selector, {
      timeout: 0,
      visible: true,
    });

    const downloadUrl = await page.$eval(
      selector,
      (el) => (el as HTMLAnchorElement).href
    );

    return downloadUrl;
  } catch (error) {
    return undefined;
  }
};

const getFitchRatingsHistory = (abortController: AbortController) => {
  let zipFilePath: string;

  return new Promise(async (resolve, reject) => {
    abortController.signal.addEventListener(
      "abort",
      async () => {
        emit.message("Aborting...");

        if (zipFilePath) {
          await fs.rm(zipFilePath);
        }

        reject("Operation aborted");
      },
      { once: true }
    );

    emit.message("Getting Fitch Ratings history files...");

    const { browser, page } = await downloader.initializeBrowser();

    emit.message("Headless browser initialized");

    await loadPage(page);

    emit.message("Page loaded");
    emit.message("Getting download URL...");

    const downloadUrl = await getUrl(page);

    emit.message("Success: " + downloadUrl);

    await downloader.closeBrowser(browser);

    emit.message("Browser closed");

    if (!downloadUrl) {
      emit.error("No link found on page!");
      return;
    }

    emit.message(
      "Downloading ZIP (It could take a while, please be patient...)"
    );

    zipFilePath = await downloader.downloadZip(downloadUrl);

    if (!zipFilePath) {
      emit.error("Failed to download ZIP");
      return;
    }

    emit.message("Downloading completed!");
    emit.message("Parsing data and creating CSV files...");

    await parser.processZipArchive(zipFilePath);

    emit.message(
      "Fitch Ratings history files successfully processed. Deleting ZIP..."
    );

    await fs.rm(zipFilePath, { recursive: true, force: true });

    emit.message("Fitch Ratings XML files successfully deleted!");

    resolve("Success");
  });
};

export { getFitchRatingsHistory };
