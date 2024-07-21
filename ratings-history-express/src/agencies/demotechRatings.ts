import Parser from "../services/parser";
import fs from "fs/promises";
import { downloader } from "../services";
import { MessageEmitter } from "../types";

const parser = new Parser();

const getDemotechRatingsHistory = async (emit: MessageEmitter) => {
  emit.message("Getting Demotech history files...");

  emit.message("Downloading ZIP (It could take a while, please be patient...)");

  const zipFilePath = await downloader.downloadZip(
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
  emit.done("Completed!");
};

export { getDemotechRatingsHistory };
