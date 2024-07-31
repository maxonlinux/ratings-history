import { Browser, Page, Target } from "puppeteer-core";
import chrome from "../utils/chrome";
import { AgencyFunctionData } from "../types";

const credentials = ["tepapem371@bacaki.com", "fdU-EF3!Lr8YRA$"];
const timeout = 5_000;

const getMoodysRatingsHistory = async (emit: {
  message: (msg: string) => void;
}) => {
  emit.message("Getting Moody's history files...");

  const getDownloadUrlAndCookie = async (page: Page, browser: Browser) => {
    const downloadPageUrl = "https://ratings.moodys.com/sec-17g-7b";

    const downloadButtonSelector =
      "body > app-root > main > app-sec-rule17g > app-intro-content > div.content.mt-6.mb-6 > div > div.text > p:nth-child(9) > a";

    await page.goto(downloadPageUrl, {
      waitUntil: "load",
      timeout: 0,
    });

    emit.message("Download page loaded");

    const newPagePromise = new Promise<Target>((resolve) => {
      browser.once("targetcreated", (target) => {
        resolve(target);
      });
    });

    await page.waitForSelector(downloadButtonSelector, {
      timeout: 0,
      visible: true,
    });

    await page.click(downloadButtonSelector);
    emit.message("Download button clicked");

    const newPageTarget = await newPagePromise;
    const newPage = await newPageTarget.page();

    if (!newPage) {
      throw new Error("Failed to open tab with download");
    }

    emit.message("New tab with download page opened");

    await newPage.setRequestInterception(true);

    const downloadUrlAndCookiePromise = new Promise<AgencyFunctionData>(
      (resolve, reject) => {
        const targetDownloadUrl =
          "https://www.moodys.com/uploadpage/Compliance/";

        newPage.on("request", (request) => {
          if (request.isInterceptResolutionHandled()) {
            return;
          }

          try {
            const url = request.url();
            const headers = request.headers();

            if (url.startsWith(targetDownloadUrl)) {
              request.abort();
              newPage.close();

              resolve({
                urls: [url],
                headers: { cookie: headers.cookie },
              });

              return;
            }

            request.continue();
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    const result = await downloadUrlAndCookiePromise;

    return result;
  };

  const browser = await chrome.get();
  const page = await browser.newPage();

  try {
    const loginPageUrl = "https://ratings.moodys.com/login";

    await page.goto(loginPageUrl, {
      waitUntil: "load",
      timeout: 0,
    });

    emit.message("Login page loaded");

    const loginInputSelector = "#idp-discovery-username";
    const nextButtonSelector = "#idp-discovery-submit";
    const passwordInputSelector = "#okta-signin-password";

    await page.waitForSelector(loginInputSelector, {
      visible: true,
      timeout: 0,
    });

    await page.type(loginInputSelector, credentials[0]);

    await page.waitForSelector(nextButtonSelector, {
      visible: true,
      timeout: 0,
    });

    emit.message("Login entered");

    await page.click(nextButtonSelector);
    emit.message("Next button clicked");

    await page.waitForSelector(passwordInputSelector, {
      visible: true,
      timeout: 0,
    });

    await page.type(passwordInputSelector, credentials[1]);
    emit.message("Password entered");

    const submitButtonSelector = "#okta-signin-submit";

    await page.waitForSelector(submitButtonSelector, {
      visible: true,
      timeout: 0,
    });

    await page.click(submitButtonSelector);

    emit.message("Credentials submitted");

    await page.waitForNavigation({
      waitUntil: "networkidle2",
      timeout: 0,
    });

    emit.message("Login to Moody's successful!");

    const downloadUrlAndCookie = await getDownloadUrlAndCookie(page, browser);

    return downloadUrlAndCookie;
  } finally {
    await browser.close();
  }
};

export default getMoodysRatingsHistory;
