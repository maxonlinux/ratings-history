import { MessageEmitter } from "../types";
import chrome from "../utils/chrome";

const getFitchRatingsHistory = async (emit: MessageEmitter) => {
  emit.message("Getting Fitch Ratings history files...");

  const browser = await chrome.get();
  const page = await browser.newPage();

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

  const url = `https://www.fitchratings.com/ratings-history-disclosure`;

  await page.goto(url, {
    waitUntil: "load",
    timeout: 0,
  });

  emit.message("Page loaded");
  emit.message("Getting download URL...");

  const selector = "#btn-1";

  await page.waitForSelector(selector, {
    timeout: 0,
    visible: true,
  });

  const downloadUrl = await page.$eval(
    selector,
    (el) => (el as HTMLAnchorElement).href
  );

  if (!downloadUrl) {
    throw new Error("No link found on page!");
  }

  await browser.close();

  return { urls: [downloadUrl] };
};

export default getFitchRatingsHistory;
