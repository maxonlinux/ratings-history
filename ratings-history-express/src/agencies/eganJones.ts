import Parser from "../services/parser";
import fs from "fs/promises";
import { emit } from ".";
import { downloader } from "../services";

const parser = new Parser();

const getEganJonesHistory = (abortController: AbortController) => {
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

    emit.message("Getting Egan Jones history files...");

    emit.message(
      "Downloading ZIP (It could take a while, please be patient...)"
    );

    zipFilePath = await downloader.downloadZip(
      "https://17g7-xbrl.egan-jones.com/download-xbrl"
    );

    if (!zipFilePath) {
      emit.error("Failed to download ZIP");
      return;
    }

    emit.message("Parsing data and creating CSV files...");

    await parser.processZipArchive(zipFilePath);

    emit.message(
      "Ethan Jones history files successfully processed. Deleting ZIP..."
    );

    await fs.rm(zipFilePath);

    emit.message("ZIP successfully deleted!");

    resolve("Success");
  });
};

export { getEganJonesHistory };
