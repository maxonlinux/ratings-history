import { Page } from "puppeteer";

import { getBrowser } from "../utils/getBrowser";
import { MessageEmitter } from "../types";
const credentials = ["salane@citmo.net", "A4y66PE$augqYjJ"];

const getMorningStarHistory = async (emit: MessageEmitter) => {
  emit.message("Getting Morning Star history files...");

  const waitForCaptcha = (page: Page) => {
    const controller: {
      resolve: (value?: void | PromiseLike<void>) => void;
      reject: (reason?: never) => void;
    } = {
      resolve: () => {},
      reject: () => {},
    };

    const promise = new Promise<void>((resolve, reject) => {
      controller.resolve = resolve;
      controller.reject = reject;

      const captchaSelector = "#ngrecaptcha-0";

      (async () => {
        try {
          await page.waitForSelector(captchaSelector, {
            timeout: 0,
          });

          reject(
            new Error(
              "Captcha detected! Please use the manual upload method or retry in a few minutes"
            )
          );
        } catch (_error) {
          // reject(error);
        }
      })();
    });

    return { promise, ...controller };
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
      controller.resolve = resolve;
      controller.reject = reject;
      (async () => {
        try {
          const url = `https://dbrs.morningstar.com/contact`;

          await page.goto(url, {
            waitUntil: "networkidle0",
            timeout: 0,
          });

          emit.message("Page loaded");

          const loginButtonSelector =
            "body > app-root > app-site-header > div > nav.main-nav > div > ul > li:nth-child(7) > a";

          await page.waitForSelector(loginButtonSelector, {
            timeout: 0,
            visible: true,
          });

          await page.click(loginButtonSelector);

          emit.message("Login button clicked");

          await page.waitForNavigation({
            waitUntil: "networkidle2",
            timeout: 0,
          });

          emit.message("Login page loaded");

          const loginInputSelector = "#usernameField";
          const passwordInputSelector = "#passwordField";

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

          emit.message("Credentials entered");

          const submitButtonSelector = "#btn-login";

          await page.waitForSelector(submitButtonSelector, {
            visible: true,
            timeout: 0,
          });

          await page.click(submitButtonSelector);

          emit.message("Credentials submitted");

          await page.waitForNavigation({
            waitUntil: "load",
            timeout: 0,
          });

          emit.message("Login to Morning Star successful!");

          const downloadPageUrl =
            "https://dbrs.morningstar.com/about/historyAgree";

          await page.goto(downloadPageUrl, {
            waitUntil: "networkidle2",
            timeout: 0,
          });

          emit.message("Download page loaded");

          const agreeCheckboxSelector = "#acceptance-check-box";

          await page.waitForSelector(agreeCheckboxSelector, {
            timeout: 0,
            visible: true,
          });

          await page.click(agreeCheckboxSelector);

          emit.message("Agreed with terms");

          const downloadButtonSelector =
            "#main-content > app-history-agree > div > section > div > div > div.grid-2of3 > div:nth-child(6) > button";

          await page.waitForSelector(downloadButtonSelector, {
            timeout: 0,
            visible: true,
          });

          await page.click(downloadButtonSelector);

          await page.waitForSelector(downloadButtonSelector, {
            visible: true,
            timeout: 0,
          });

          await page.click(downloadButtonSelector);

          emit.message("Download button clicked");
          resolve();
        } catch (error) {
          reject(error);
        }
      })();
    });

    return { promise, ...controller };
  };

  const browser = await getBrowser();
  const page = await browser.newPage();

  const browsePromise = browse(page);
  const captchaPromise = waitForCaptcha(page);

  const downloadUrlPromise = new Promise<string>((resolve, reject) => {
    try {
      const targetDownloadUrl = "https://dbrs.morningstar.com/xbrl/";

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

        const url = request.url();

        if (url.startsWith(targetDownloadUrl)) {
          request.abort();
          page.close();
          resolve(url);
          return;
        }

        request.continue();
      });
    } catch (error) {
      reject(error);
    }
  });

  try {
    await page.setRequestInterception(true);

    await Promise.race([browsePromise.promise, captchaPromise.promise]);

    const downloadUrl = await downloadUrlPromise;
    return { urls: [downloadUrl] };
  } finally {
    browsePromise.resolve();
    captchaPromise.resolve();

    await browser.close();
  }
};

export default getMorningStarHistory;
