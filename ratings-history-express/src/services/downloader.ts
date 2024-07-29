import path from "path";
import { createWriteStream } from "fs";
import puppeteer, { Browser } from "puppeteer";
import axios from "axios";
import fs from "fs/promises";
import { CustomHeaders, Events, Message, Task } from "../types";
import config from "../config";
import { emitter, tasker } from ".";
import { agenciesFunctionsMap, createEmitter } from "../agencies";
import Parser from "./parser";

interface Agency {
  messages: Message[];
}

class Downloader {
  private agencies: Map<string, Agency>;

  private browser: Browser | undefined;

  constructor() {
    this.agencies = new Map();

    this.initAgencies();
  }

  private initAgencies() {
    Object.keys(agenciesFunctionsMap).forEach((key) => {
      this.agencies.set(key, { messages: [] });
    });
  }

  public async getBrowser() {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    this.browser = await puppeteer.launch({
      headless: false,
      // executablePath: config.chromeExec,
      defaultViewport: {
        width: 1280 + Math.floor(Math.random() * 100),
        height: 800 + Math.floor(Math.random() * 100),
        deviceScaleFactor: 1,
      },
      args: [
        "--no-sandbox", // Disable sandboxing (be cautious of security implications)
        "--disable-setuid-sandbox", // Disable setuid sandboxing
        "--disable-dev-shm-usage", // Prevent using /dev/shm for storage
        "--disable-accelerated-2d-canvas", // Disable 2D canvas acceleration
        "--disable-gpu", // Disable GPU acceleration
        "--disable-software-rasterizer", // Disable software rasterizer
        "--disable-features=VizDisplayCompositor,IsolateOrigins,site-per-process", // Disable the Viz Display Compositor and features related to site isolation, which may affect CPU usage.
        "--disable-background-timer-throttling", // Prevent throttling of background timers
        "--disable-backgrounding-occluded-windows", // Prevent background windows from being paused
        "--disable-extensions", // Disable all extensions
        "--disable-default-apps", // Disable default apps
        "--disable-infobars", // Hide info bars (e.g., the “Chrome is being controlled” bar)
        "--no-first-run", // Skip the first run setup
        "--noerrdialogs", // Disable error dialogs
        // "--single-process", // Run browser in a single process BREAKS CONTEXT!!!
        "--remote-debugging-port=0", // Disable remote debugging (reduces overhead)
        "--disable-blink-features=AutomationControlled", // Disable automation control features
        "--no-zygote", // Disables the Zygote process, which handles the creation of new processes
        "--disable-session-crashed-bubble", // Disables the crash recovery bubble
      ],
    });

    return this.browser;
  }

  public async closeBrowser() {
    if (!this.browser) {
      return;
    }

    await this.browser.close();
    this.browser = undefined;
  }

  public static async downloadZip(url: string, customHeaders?: CustomHeaders) {
    const zipFileName = `${performance.now().toString()}.zip`;
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

      const ws = createWriteStream(zipFilePath);
      const stream = response.data.pipe(ws);

      await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
      });

      return zipFilePath;
    } catch (error) {
      throw new Error(
        `Error while dowbloading ZIP: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  public async initiate(agencyName: string): Promise<void> {
    const task: Task = async () => {
      const agency = this.agencies.get(agencyName);
      const messageEmitter = createEmitter(agencyName);

      if (!agency) {
        throw new Error("Agency not found");
      }

      try {
        const { urls, headers } = await agenciesFunctionsMap[agencyName](
          messageEmitter
        );

        // Download files

        messageEmitter.message(
          "Downloading ZIP (It could take a while, please be patient...)"
        );

        const downloadPromises = urls.map(async (url) => {
          const zipFilePath = await Downloader.downloadZip(url, headers);
          return zipFilePath;
        });

        const downloadedFilesPaths = await Promise.all(downloadPromises);

        messageEmitter.message("Downloading completed!");

        // Process files

        const parser = new Parser();

        for (const [i, filePath] of downloadedFilesPaths.entries()) {
          messageEmitter.message(
            `Parsing data and creating CSV files (It could take a while, please be patient...) (${
              i + 1
            }/${downloadedFilesPaths.length})`
          );

          await parser.processZipArchive(filePath);

          messageEmitter.message(
            "XBRL files successfully processed. Deleting ZIP..."
          );

          await fs.rm(filePath);
        }

        messageEmitter.done("Completed!");
      } catch (error) {
        if (error instanceof Error) {
          messageEmitter.error(
            error instanceof Error ? error.message : String(error)
          );
        }
      } finally {
        this.cleanup(agencyName);
      }
    };

    emitter.emit(Events.AGENCIES_UPDATE, {
      agencyName,
      message: "Queued...",
      type: "message",
    });

    tasker.addTask(agencyName, task);
  }

  public abort(agencyName: string) {
    tasker.cancelTask(agencyName);
    emitter.emit(Events.AGENCIES_UPDATE, {
      agencyName,
      message: "Cancelled by user",
      type: "exit",
    });
  }

  private cleanup(agencyName: string) {
    const agency = this.agencies.get(agencyName);

    if (!agency) {
      throw new Error("Agency not found");
    }

    this.agencies.set(agencyName, { messages: [] });
  }

  public appendStatus(agencyName: string, data: Message) {
    const agency = this.agencies.get(agencyName);

    if (!agency) {
      throw new Error(`No agency with name ${agencyName}`);
    }

    this.agencies.set(agencyName, { messages: [data, ...agency.messages] });
  }

  public getAgency(agencyName: string) {
    const agency = this.agencies.get(agencyName);

    if (!agency) {
      throw new Error(`No agency with name ${agencyName}`);
    }

    return agency;
  }

  public getAgencies() {
    return Object.fromEntries(this.agencies);
  }
}

export default Downloader;
