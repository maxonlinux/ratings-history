import { agenciesFunctionsMap } from "../agencies";
import { emitter } from ".";
import { fork } from "child_process";
import path from "path";
import { createWriteStream } from "fs";
import { CustomHeaders, Events, Message } from "../types";
import puppeteer, { Browser } from "puppeteer";
import { config } from "../config";
import axios from "axios";

class Downloader {
  private processes: Map<string, any>;
  private agencies: Map<string, { messages: Message[] }>;

  constructor() {
    this.processes = new Map();
    this.agencies = new Map();

    for (const key in agenciesFunctionsMap) {
      this.agencies.set(key, { messages: [] });
    }
  }

  public async initializeBrowser() {
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: {
        width: 1280 + Math.floor(Math.random() * 100),
        height: 800 + Math.floor(Math.random() * 100),
        deviceScaleFactor: 1,
      },
      args: [
        "--disable-features=IsolateOrigins,site-per-process",
        "--incognito",
      ],
    });

    const [page] = await browser.pages();

    //Randomize viewport size
    await page.setViewport({
      width: 1280 + Math.floor(Math.random() * 100),
      height: 800 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
    });

    return { page, browser };
  }

  public async closeBrowser(browser: Browser) {
    await browser.close();
  }

  public async downloadZip(url: string, customHeaders?: CustomHeaders) {
    const zipFileName = performance.now().toString() + ".zip";
    const zipFilePath = path.resolve(config.tempDirPath, zipFileName);

    try {
      const response = await axios.get(url, {
        responseType: "stream",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          ...customHeaders,
        },
      });

      // const contentType = response.headers["content-type"];

      // if (contentType !== "application/zip") {
      //   throw new Error("Downloaded file is not ZIP");
      // }

      const ws = createWriteStream(zipFilePath);
      const stream = response.data.pipe(ws);

      await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
      });

      return zipFilePath;
    } catch (error) {
      const err = String(error);
      throw new Error(err);
    }
  }

  public async initiate(agencyName: string): Promise<void> {
    const agency = agenciesFunctionsMap.hasOwnProperty(agencyName);

    if (!agency) {
      throw new Error("Agency not found");
    }

    const existingProcess = this.processes.get(agencyName);

    if (existingProcess) {
      throw new Error("Download already in progress");
    }

    const childPath = path.join(__dirname, "../processes", "download");

    const child = fork(childPath);

    console.log(`Process for ${agencyName} forked`);

    this.processes.set(agencyName, child);

    child.send({ event: "agency", data: agencyName });

    child.on("message", (msg: any) => {
      const { event, data } = msg;

      if (event !== Events.AGENCY_MESSAGE) {
        return;
      }

      emitter.emit(Events.AGENCIES_UPDATE, data);
    });

    child.on("complete", () => {
      emitter.emit(Events.AGENCIES_UPDATE, {
        type: "exit",
        message: "Done!",
        agencyName,
      });
    });

    child.on("error", (err: any) => {
      console.error(err);

      emitter.emit(Events.AGENCIES_UPDATE, {
        type: "error",
        message: err.message ?? err,
        agencyName,
      });
    });

    child.on("exit", async (code, signal) => {
      this.cleanup(agencyName);

      console.log(
        `Child process for ${agencyName} exited with code ${code} and signal ${signal}`
      );
    });
  }

  private cleanup(agencyName: string) {
    const child = this.processes.get(agencyName);

    if (!child) {
      return;
    }

    this.processes.delete(agencyName);
    this.agencies.set(agencyName, { messages: [] });
  }

  public async abort(agencyName: string): Promise<void> {
    const agency = agenciesFunctionsMap[agencyName];

    if (!agency) {
      throw new Error("Agency not found");
    }
    const process = this.processes.get(agencyName);

    if (!process) {
      throw new Error("No ongoing operation to abort");
    }

    process.send({ event: "abort" });
  }

  public appendStatus(agencyName: string, data: Message) {
    const agency = this.agencies.get(agencyName);

    if (!agency) {
      throw new Error("No agency with name " + agencyName);
    }

    this.agencies.set(agencyName, { messages: [data, ...agency.messages] });
  }

  public getAgency(agencyName?: string) {
    if (!agencyName) {
      return this.agencies;
    }

    const agency = this.agencies.get(agencyName);

    if (!agency) {
      throw new Error("No agency with name " + agencyName);
    }

    return agency;
  }

  public getAgencies() {
    return Object.fromEntries(this.agencies);
  }
}

export default Downloader;
