import XmlParser from "../services/parser";
import { downloadAndExtract } from "../utils";
import fs from "fs/promises";
import { emit } from ".";

const parser = new XmlParser();

const getDemotechRatingsHistory = (abortController: AbortController) => {
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

    emit.message("Getting Demotech history files...");

    emit.message(
      "Downloading and extracting XML files (It could take a while, please be patient...)"
    );

    dirPath = await downloadAndExtract("https://www.demotech.com/17g-7.php");

    emit.message("Downloading and extraction completed!");

    if (!dirPath) {
      emit.error("Failed to download or extract history files");
      return;
    }

    emit.message("Parsing data and creating CSV files...");

    await parser.processXmlFiles(dirPath);

    emit.message(
      "Demotech history files successfully processed. Deleting folder with XML files..."
    );

    await fs.rm(dirPath, { recursive: true, force: true });

    emit.message("Demotech XML files successfully deleted!");

    resolve("Success");
  });
};

export { getDemotechRatingsHistory };
