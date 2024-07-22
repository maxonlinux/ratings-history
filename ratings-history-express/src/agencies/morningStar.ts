import { Page } from "puppeteer";
import Parser from "../services/parser";
import fs from "fs/promises";
import { config } from "../config";
import { downloader } from "../services";
import { MessageEmitter } from "../types";

const parser = new Parser();
const credentials = config.credentials["morning-star"];

const getMorningStarHistory = async (emit: MessageEmitter) => {
  emit.message("Getting Morning Star history files...");

  const loadPage = async (page: Page) => {
    const url = `https://dbrs.morningstar.com/contact`;

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 0,
    });

    emit.message("Page loaded");
  };

  const goToLoginPage = async (page: Page) => {
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
  };

  const enterCredentials = async (page: Page) => {
    const loginInputSelector = "#usernameField";
    const passwordInputSelector = "#passwordField";

    if (!credentials[0] || !credentials[1]) {
      throw new Error("No credentials for Morning Star!");
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

    emit.message("Credentials entered");
  };

  const submitCredentials = async (page: Page) => {
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
  };

  const goToDownloadPage = async (page: Page) => {
    const downloadPageUrl = "https://dbrs.morningstar.com/about/historyAgree";

    await page.goto(downloadPageUrl, {
      waitUntil: "networkidle2",
      timeout: 0,
    });

    emit.message("Download page loaded");
  };

  const agreeWithTerms = async (page: Page) => {
    const agreeCheckboxSelector = "#acceptance-check-box";

    await page.waitForSelector(agreeCheckboxSelector, {
      timeout: 0,
      visible: true,
    });

    await page.click(agreeCheckboxSelector);

    emit.message("Agreed with terms");
  };

  const getDownloadUrl = async (page: Page) => {
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
  };

  const waitForCaptcha = (page: Page) => {
    const controller: {
      resolve: (value?: void | PromiseLike<void>) => void;
      reject: (reason?: any) => void;
    } = {
      resolve: () => {},
      reject: () => {},
    };

    const promise = new Promise<void>(async (resolve, reject) => {
      controller.resolve = resolve;
      controller.reject = reject;

      const captchaSelector = "#ngrecaptcha-0";

      try {
        await page.waitForSelector(captchaSelector, {
          timeout: 0,
        });

        reject(
          "Captcha detected! Please use the manual upload method or retry in a few minutes"
        );
      } catch (error) {
        reject(error);
      }
    });

    return { promise, ...controller };
  };

  const agreeWithPrivacyNotice = (page: Page) => {
    const controller: {
      resolve: (value?: void | PromiseLike<void>) => void;
      reject: (reason?: any) => void;
    } = {
      resolve: () => {},
      reject: () => {},
    };

    const promise = new Promise<void>(async (resolve, reject) => {
      controller.resolve = resolve;
      controller.reject = reject;

      const okButtonSelector =
        "#mat-dialog-0 > app-gdpr-message > div > div.login-right > button";

      try {
        await page.waitForSelector(okButtonSelector, {
          visible: true,
          timeout: 0,
        });

        await page.click(okButtonSelector);

        emit.message("Agreed with Privacy Notice");
      } catch (error) {
        reject(error);
      }
    });

    return { promise, ...controller };
  };

  const browse = (page: Page) => {
    const controller: {
      resolve: (value?: void | PromiseLike<void>) => void;
      reject: (reason?: any) => void;
    } = {
      resolve: () => {},
      reject: () => {},
    };

    const promise = new Promise<void>(async (resolve, reject) => {
      controller.resolve = resolve;
      controller.reject = reject;

      try {
        await loadPage(page);
        await goToLoginPage(page);
        await enterCredentials(page);
        await submitCredentials(page);
        await goToDownloadPage(page);
        await agreeWithTerms(page);
        await getDownloadUrl(page);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    return { promise, ...controller };
  };

  const browser = await downloader.getBrowser();
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  const browsePromise = browse(page);
  const captchaPromise = waitForCaptcha(page);
  const privacyNoticePromise = agreeWithPrivacyNotice(page);

  try {
    await page.setRequestInterception(true);

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

    await Promise.race([
      browsePromise.promise,
      captchaPromise.promise,
      privacyNoticePromise.promise,
    ]);

    browsePromise.resolve();
    captchaPromise.resolve();
    privacyNoticePromise.resolve();

    await context.close();

    const downloadUrl = await downloadUrlPromise;

    if (!downloadUrl) {
      emit.error("Failed to get download URL");
      return;
    }

    emit.message(
      "Downloading ZIP (It could take a while, please be patient...)"
    );

    const zipFilePath = await downloader.downloadZip(downloadUrl);

    if (!zipFilePath) {
      emit.error("Failed to download ZIP");
      return;
    }

    emit.message("Downloading completed!");

    // Process files
    emit.message("Parsing data and creating CSV files...");
    await parser.processZipArchive(zipFilePath);

    emit.message(
      "Morning Star history files successfully processed. Deleting ZIP..."
    );

    await fs.rm(zipFilePath);

    emit.message("ZIP successfully deleted!");

    emit.done("Completed!");
  } catch (error) {
    const err = error as any;
    emit.error(err.message ?? err);
  } finally {
    browsePromise.resolve();
    captchaPromise.resolve();
    privacyNoticePromise.resolve();

    await context.close();
  }
};

export { getMorningStarHistory };
