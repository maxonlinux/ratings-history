import { Page } from "puppeteer";
import { config } from "../config";
import { MessageEmitter } from "../types";
import { downloader } from "../services";

const credentials = config.credentials["ambest-ratings"];

const getAmbestRatingsHistory = async (emit: MessageEmitter) => {
  const loadLoginPage = async (page: Page) => {
    const loginPageUrl =
      "https://member.ambest.com/MemberCenter/sMC/Cust_existing.aspx";

    await page.goto(loginPageUrl, {
      waitUntil: "load",
      timeout: 0,
    });

    emit.message("Login page loaded");
  };

  const enterCredentials = async (page: Page) => {
    const loginInputSelector = "#txtEmail";
    const passwordInputSelector = "#CurPwd";

    if (!credentials[0] || !credentials[1]) {
      throw new Error("No credentials for Moody's Ratings!");
    }

    await page.waitForSelector(loginInputSelector, {
      visible: true,
      timeout: 0,
    });

    await page.type(loginInputSelector, credentials[0]);

    await page.waitForSelector(passwordInputSelector, {
      visible: true,
      timeout: 0,
    });

    await page.type(passwordInputSelector, credentials[1]);
    emit.message("Credentials entered");
  };

  const submitCredentials = async (page: Page) => {
    const submitButtonSelector = "#btnContinue";

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

    emit.message("Login to Ambest successful!");
  };

  const browser = await downloader.getBrowser();
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  await loadLoginPage(page);
  await enterCredentials(page);
  await submitCredentials(page);

  return { urls: [] };
};

export { getAmbestRatingsHistory };
