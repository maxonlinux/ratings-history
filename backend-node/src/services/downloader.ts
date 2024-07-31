import path from "path";
import { createWriteStream } from "fs";
import axios from "axios";
import fs from "fs/promises";
import { CustomHeaders, Events, Message, Task } from "../types";
import config from "../config";
import { emitter, tasker } from ".";
import Parser from "./parser";

const createEmitter = (agencyName: string) => ({
  message: (message: string) => {
    emitter.emit(Events.AGENCIES_UPDATE, {
      agencyName,
      message,
      type: "message",
    });
  },
  error: (message: string) => {
    emitter.emit(Events.AGENCIES_UPDATE, {
      agencyName,
      message,
      type: "error",
    });
  },
  done: (message: string) => {
    emitter.emit(Events.AGENCIES_UPDATE, {
      agencyName,
      message,
      type: "exit",
    });
  },
});

interface Agency {
  messages: Message[];
}

class Downloader {
  private agencies: Map<string, Agency>;

  constructor() {
    this.agencies = new Map();

    this.initAgencies();
  }

  private initAgencies() {
    config.agenciesMap.forEach((key) => {
      this.agencies.set(key, { messages: [] });
    });
  }

  public async downloadZip(url: string, customHeaders?: CustomHeaders) {
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

  public initiate(agencyName: string, options?: { retries: number }) {
    if (!config.agenciesMap.includes(agencyName)) {
      throw new Error("No agency with this name");
    }

    const task: Task = async () => {
      const agency = this.agencies.get(agencyName);
      const messageEmitter = createEmitter(agencyName);

      if (!agency) {
        throw new Error("Agency not found");
      }

      messageEmitter.message("Getting download URL(s)...");

      try {
        const response = await axios.post(
          "http://localhost:7071/api/agencyFunction?name=" + agencyName
        );

        if (response.data.error) {
          throw new Error(response.data.error);
        }

        if (!response.data.urls) {
          throw new Error("No URLs in data returned by function!");
        }

        for (const url of response.data.urls) {
          if (typeof url !== "string") {
            throw new Error("URLs are not strings!");
          }
        }

        const { urls, headers } = response.data;

        // Download files

        messageEmitter.message(
          "Downloading ZIP (It could take a while, please be patient...)"
        );

        const downloadPromises = urls.map(async (url: string) => {
          const zipFilePath = await this.downloadZip(url, headers);
          return zipFilePath;
        });

        const downloadedFilesPaths = await Promise.all(downloadPromises);

        messageEmitter.message("Downloading completed!");

        // Process files

        const parser = new Parser();

        for (const [i, filePath] of downloadedFilesPaths.entries()) {
          const count =
            downloadedFilesPaths.length > 1
              ? ` (${i + 1}/${downloadedFilesPaths.length})`
              : "";

          messageEmitter.message(
            `Parsing data and creating CSV files (It could take a while, please be patient...)${count}`
          );

          await parser.processZipArchive(filePath);

          messageEmitter.message(
            "XBRL files successfully processed. Deleting ZIP..."
          );

          await fs.rm(filePath);
        }

        messageEmitter.done("Completed!");
      } catch (error) {
        messageEmitter.error(
          error instanceof Error ? error.message : String(error)
        );

        throw error;
      } finally {
        this.cleanup(agencyName);
      }
    };
    tasker.addTask(agencyName, task, options?.retries);

    emitter.emit(Events.AGENCIES_UPDATE, {
      agencyName,
      message: "Queued...",
      type: "message",
    });
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
