import { tasker } from ".";
import { agenciesFunctionsMap, createEmitter } from "../agencies";
import { AgenciesMap, Task } from "../types";
import Downloader from "./downloader";
import Parser from "./parser";
import fs from "fs/promises";
import schedule from "node-schedule";

class Scheduler {
  private tasks: AgenciesMap;
  private readonly maxRetries: number;
  private readonly scheduleRule: string;

  constructor(tasks: AgenciesMap, scheduleRule: string, maxRetries: number) {
    this.tasks = tasks;
    this.maxRetries = maxRetries;
    this.scheduleRule = scheduleRule;
    this.initialize();
  }

  async retryTask(task: Task, retries: number): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await task();
        return;
      } catch (error) {
        if (attempt === retries) {
          console.error(`Task failed after ${retries} attempts: ${error}`);
          throw error;
        } else {
          console.log(
            `Task failed, retrying (${attempt}/${retries}): ${error}`
          );
        }
      }
    }
  }

  private async runTaskWithRetry(task: Task) {
    await this.retryTask(task, this.maxRetries);
  }

  private initialize() {
    console.log(
      `Tasks scheduled with rule ${this.scheduleRule} and retries ${this.maxRetries}`
    );

    schedule.scheduleJob(this.scheduleRule, () => {
      console.log("Running scheduled tasks...");

      Object.keys(this.tasks).forEach((agencyName) => {
        const task: Task = async () => {
          const messageEmitter = createEmitter(agencyName);

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

            messageEmitter.message("Downloading and extraction completed!");

            // Process files

            const parser = new Parser();

            messageEmitter.message(
              "Parsing data and creating CSV files (It could take a while, please be patient...)"
            );

            const parsePromises = downloadedFilesPaths.map(async (filePath) => {
              await parser.processZipArchive(filePath);

              messageEmitter.message(
                "XBRL files successfully processed. Deleting ZIP..."
              );

              await fs.rm(filePath);
            });

            await Promise.all(parsePromises);

            messageEmitter.done("Completed!");
          } catch (error) {
            if (error instanceof Error) {
              messageEmitter.error(
                error instanceof Error ? error.message : String(error)
              );
            }
          }
        };

        tasker.addTask(agencyName, async () => {
          await this.runTaskWithRetry(task);
        });
      });
    });
  }
}

export default Scheduler;
