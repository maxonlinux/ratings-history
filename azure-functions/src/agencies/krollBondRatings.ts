import { Page, Browser, Target, TimeoutError } from "puppeteer-core";
import chrome from "../utils/chrome";

const timeout = 5_000;

const credentials = ["tepapem371@bacaki.com", "5Df9t@r8X#vEHna"];

const getKrollBondRatingsHistory = async (emit: {
  message: (msg: string) => void;
}) => {
  const acceptCookies = (page: Page) => {
    const controller: {
      resolve: (value?: void | PromiseLike<void>) => void;
      reject: (reason?: never) => void;
    } = {
      resolve: () => {},
      reject: () => {},
    };

    const promise = new Promise<void>((resolve) => {
      const acceptButtonSelector = "#onetrust-accept-btn-handler";

      (async () => {
        try {
          await page.waitForSelector(acceptButtonSelector, {
            visible: true,
            timeout: 0,
          });

          await page.click(acceptButtonSelector);

          emit.message("Cookies accepted");

          resolve();
        } catch (_) {
          void 0;
        }
      })();
    });

    return { promise, ...controller };
  };

  const getDownloadUrl = async (
    page: Page,
    browser: Browser,
    linkSelector: string
  ): Promise<string> => {
    const downloadPageUrl =
      "https://www.kbra.com/regulatory/disclosures/form-nrsro";
    const downloadButtonSelector =
      "body > div.min-h-screen > div > div > main > div > div > div > div > div > div > div.m-2 > form > button";
    const targetDownloadUrl = "https://dotcom-api.kbra.com";

    await page.goto(downloadPageUrl, {
      waitUntil: "load",
      timeout,
    });

    emit.message("Navigated to download page");

    const newPagePromise = new Promise<Target>((resolve) => {
      browser.once("targetcreated", (target) => {
        resolve(target);
      });
    });

    await page.waitForSelector(linkSelector, {
      visible: true,
      timeout: 0,
    });

    await page.click(linkSelector);
    emit.message("Download link clicked");

    // Wait for the new tab to open and switch to it
    const newPageTarget = await newPagePromise;
    const newPage = await newPageTarget.page();

    if (!newPage) {
      throw new Error("Failed to open page with download button");
    }

    emit.message("New tab with download button opened");

    // Enable request interception
    await newPage.setRequestInterception(true);

    const downloadUrlPromise = new Promise<string>((resolve) => {
      newPage.on("request", (request) => {
        if (request.isInterceptResolutionHandled()) {
          return;
        }

        const type = request.resourceType();
        const restrictedTypes = ["image", "stylesheet", "font", "media"];

        if (restrictedTypes.includes(type)) {
          request.abort();
          return;
        }

        const url = request.url();

        if (url.startsWith(targetDownloadUrl)) {
          request.abort();

          newPage.close();
          resolve(url);
          return;
        }

        request.continue();
      });
    });

    await newPage.waitForSelector(downloadButtonSelector, {
      visible: true,
      timeout,
    });

    await newPage.click(downloadButtonSelector);
    emit.message("Download button clicked");

    // Wait for the download request to be captured
    const downloadUrl = await downloadUrlPromise;

    return downloadUrl;
  };

  const browse = (page: Page) => {
    const controller: {
      resolve: (value?: void | PromiseLike<void>) => void;
      reject: (reason?: never) => void;
    } = {
      resolve: () => {},
      reject: () => {},
    };

    const promise = new Promise<void>((resolve, reject) => {
      const startBrowsing = async () => {
        try {
          const url = `https://www.kbra.com/`;

          await page.goto(url, {
            waitUntil: "load",
            timeout,
          });

          const loginButtonSelector = '[data-testid="login-button"]';

          await page.waitForSelector(loginButtonSelector, {
            visible: true,
            timeout,
          });

          emit.message("Going to login page...");

          await Promise.all([
            page.click(loginButtonSelector),
            page.waitForNavigation({
              waitUntil: "load",
              timeout,
            }),
          ]);

          emit.message("Login page loaded");

          const loginInputSelector = "#username";
          const passwordInputSelector = "#password";

          await page.waitForSelector(loginInputSelector, {
            visible: true,
            timeout,
          });

          await page.waitForSelector(passwordInputSelector, {
            visible: true,
            timeout,
          });

          await page.type(loginInputSelector, credentials[0]);
          await page.type(passwordInputSelector, credentials[1]);

          const submitButtonSelector = "#login-button";

          await page.waitForSelector(submitButtonSelector, {
            visible: true,
            timeout,
          });

          await Promise.all([
            page.click(submitButtonSelector),
            page.waitForNavigation({
              waitUntil: "load",
              timeout,
            }),
          ]);

          emit.message("Login successful!");

          resolve();
        } catch (error) {
          if (error instanceof TimeoutError) {
            emit.message("Timeout. Restarting...");
            startBrowsing();
            return;
          }

          reject(error);
        }
      };

      startBrowsing();
    });

    return { promise, ...controller };
  };

  const downloadLinkSelectors = [
    "body > div.min-h-screen > div > div > main > div > div > div.flex.basis-full.flex-col.overflow-x-hidden > div > div > ul:nth-child(7) > li:nth-child(1) > p > a",
    "body > div.min-h-screen > div > div > main > div > div > div.flex.basis-full.flex-col.overflow-x-hidden > div > div > ul:nth-child(7) > li:nth-child(2) > p > a",
  ];

  emit.message("Getting KBRA history files...");

  const browser = await chrome.get();
  const page = await browser.newPage();

  const browsePromise = browse(page);
  const acceptCookiesPromise = acceptCookies(page);

  const downloadUrls: string[] = [];

  try {
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

    await Promise.race([browsePromise.promise, acceptCookiesPromise.promise]);

    for (const downloadLinkSelector of downloadLinkSelectors) {
      downloadUrls.push(
        await getDownloadUrl(page, browser, downloadLinkSelector)
      );
    }

    return { urls: downloadUrls };
  } finally {
    browsePromise.resolve();
    acceptCookiesPromise.resolve();
    await browser.close();
  }
};

export default getKrollBondRatingsHistory;
