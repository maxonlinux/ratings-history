import { Page } from "puppeteer";
import Parser from "../services/parser";
import fs from "fs/promises";
import { emit } from ".";
import { downloader } from "../services";

const parser = new Parser();

const loadPage = async (page: Page) => {
  const url = `https://www.jcr.co.jp/en/service/company/regu/nrsro/`;

  await page.goto(url, {
    waitUntil: "load",
    timeout: 0,
  });
};

const getUrl = async (page: Page) => {
  const selector =
    "#content > div > div.mainColumn > section > div > table:nth-child(5) > tbody > tr:nth-child(1) > td > a";

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

const getJapanCreditRatingsHistory = (abortController: AbortController) => {
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

    emit.message("Getting JCR history files...");

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
      "Downloading ZIP with XML files (It could take a while, please be patient...)"
    );

    zipFilePath = await downloader.downloadZip(downloadUrl);

    if (!zipFilePath) {
      emit.error("Failed to download ZIP");
      return;
    }

    emit.message("Downloading completed!");
    emit.message("Parsing data and creating CSV files...");

    await parser.processZipArchive(zipFilePath);

    emit.message("JCR history files successfully processed. Deleting ZIP...");

    await fs.rm(zipFilePath);

    emit.message("ZIP successfully deleted!");

    resolve("Success");
  });
};

export { getJapanCreditRatingsHistory };
