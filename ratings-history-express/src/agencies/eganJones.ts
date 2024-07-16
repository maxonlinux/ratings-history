import XmlParser from "../services/parser";
import { downloadAndExtract } from "../utils";
import fs from "fs/promises";
import { emit } from ".";

const parser = new XmlParser();

const getEganJonesHistory = (abortController: AbortController) => {
  let dirPath: string;

  return new Promise(async (resolve, reject) => {
    abortController.signal.addEventListener(
      "abort",
      async () => {
        emit.message("Aborting...");

        if (dirPath) {
          await fs.rm(dirPath, { recursive: true, force: true });
        }

        reject("Operation aborted");
      },
      { once: true }
    );

    emit.message("Getting Egan Jones history files...");

    emit.message(
      "Downloading and extracting XML files (It could take a while, please be patient...)"
    );

    dirPath = await downloadAndExtract(
      "https://17g7-xbrl.egan-jones.com/download-xbrl"
    );

    if (!dirPath) {
      emit.error("Failed to download or extract history files");
      return;
    }

    emit.message("Parsing data and creating CSV files...");

    await parser.processXmlFiles(dirPath);

    emit.message(
      "Ethan Jones history files successfully processed. Deleting folder with XML files..."
    );

    await fs.rm(dirPath, { recursive: true, force: true });

    emit.message("Ethan Jones XML files successfully deleted!");

    resolve("Success");
  });
};

export { getEganJonesHistory };
