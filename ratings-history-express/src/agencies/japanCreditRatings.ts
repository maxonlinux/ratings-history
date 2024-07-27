import { Page } from "puppeteer";
import { downloader } from "../services";
import { MessageEmitter } from "../types";

const getJapanCreditRatingsHistory = async (emit: MessageEmitter) => {
  emit.message("Getting JCR history files...");

  const loadPage = async (page: Page) => {
    const url = `https://www.jcr.co.jp/en/service/company/regu/nrsro/`;

    await page.goto(url, {
      waitUntil: "load",
      timeout: 0,
    });

    emit.message("Page loaded");
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

    emit.message(`Success: ${  downloadUrl}`);

    return downloadUrl;
  };

  const browser = await downloader.getBrowser();
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  await page.setRequestInterception(true);

  page.on("request", (request) => {
    if (request.isInterceptResolutionHandled()) {
      return;
    }

    const type = request.resourceType();
    const restrictedTypes = ["image", "stylesheet", "font", "media"];

    if (restrictedTypes.includes(type)) {
      request.abort();
      return;
    }

    request.continue();
  });

  await loadPage(page);

  emit.message("Getting download URL...");

  const downloadUrl = await getUrl(page);

  await context.close();

  if (!downloadUrl) {
    throw new Error("No link found on page!");
  }

  return { urls: [downloadUrl] };
};

export default getJapanCreditRatingsHistory;
