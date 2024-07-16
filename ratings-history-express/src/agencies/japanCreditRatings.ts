import { Page } from "puppeteer";
import XmlParser from "../services/parser";
import {
  closeBrowser,
  downloadAndExtract,
  flattenFolder,
  initializeBrowser,
} from "../utils";
import fs from "fs/promises";
import { emit } from ".";

const parser = new XmlParser();

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
  let dirPath: string;

  return new Promise(async (resolve, reject) => {
    abortController.signal.addEventListener(
      "abort",
      async () => {
        emit.message("Aborting...");

        if (dirPath) {
          await fs.rm(dirPath, { recursive: true, force: true });
        }

        reject("Operation aborted");
      },
      { once: true }
    );

    emit.message("Getting JCR history files...");

    const { browser, page } = await initializeBrowser();

    emit.message("Headless browser initialized");

    await loadPage(page);

    emit.message("Page loaded");
    emit.message("Getting download URL...");

    const downloadUrl = await getUrl(page);

    emit.message("Success: " + downloadUrl);

    await closeBrowser(browser);

    emit.message("Browser closed");

    if (!downloadUrl) {
      emit.error("No link found on page!");
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

    emit.message("Downloading and extraction completed!");
    emit.message("Parsing data and creating CSV files...");

    await flattenFolder(dirPath);
    await parser.processXmlFiles(dirPath);

    emit.message(
      "JCR history files successfully processed. Deleting folder with XML files..."
    );

    await fs.rm(dirPath, { recursive: true, force: true });

    emit.message("JCR XML files successfully deleted!");

    resolve("Success");
  });
};

export { getJapanCreditRatingsHistory };
