import Parser from "../services/parser";
import fs from "fs/promises";
import { emit } from ".";
import { downloader } from "../services";

const parser = new Parser();

const getDemotechRatingsHistory = (abortController: AbortController) => {
  let zipFilePath: string;

  return new Promise(async (resolve, reject) => {
    abortController.signal.addEventListener(
      "abort",
      async () => {
        emit.message("Aborting...");

        if (zipFilePath) {
          await fs.rm(zipFilePath);
        }

        reject("Operation aborted");
      },
      { once: true }
    );

    emit.message("Getting Demotech history files...");

    emit.message(
      "Downloading ZIP (It could take a while, please be patient...)"
    );

    zipFilePath = await downloader.downloadZip(
      "https://www.demotech.com/17g-7.php"
    );

    emit.message("Downloading completed!");

    if (!zipFilePath) {
      emit.error("Failed to download ZIP");
      return;
    }

    emit.message("Parsing data and creating CSV files...");

    await parser.processZipArchive(zipFilePath);

    emit.message(
      "Demotech history files successfully processed. Deleting ZIP..."
    );

    await fs.rm(zipFilePath);

    emit.message("ZIP successfully deleted!");

    resolve("Success");
  });
};

export { getDemotechRatingsHistory };
