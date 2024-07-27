import { Page } from "puppeteer";
import { downloader } from "../services";
import { MessageEmitter } from "../types";

const getFitchRatingsHistory = async (emit: MessageEmitter) => {
  emit.message("Getting Fitch Ratings history files...");

  const loadPage = async (page: Page) => {
    const url = `https://www.fitchratings.com/ratings-history-disclosure`;

    await page.goto(url, {
      waitUntil: "load",
      timeout: 0,
    });
  };

  const getUrl = async (page: Page) => {
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

  emit.message("Page loaded");
  emit.message("Getting download URL...");

  const downloadUrl = await getUrl(page);

  await context.close();

  return { urls: [downloadUrl] };
};

export default getFitchRatingsHistory;
