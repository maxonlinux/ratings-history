import fs from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import { FileMetaData } from "../types";
import os from "os";
import si from "systeminformation";

const exists = async (path: string) => {
  try {
    await fs.access(path);
    return true;
  } catch (error) {
    const err = error as any;
    if (err.code === "ENOENT") {
      return false;
    } else {
      throw err;
    }
  }
};

const emptyFolder = async (folderPath: string) => {
  try {
    const files = await fs.readdir(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);

      await fs.rm(filePath, { recursive: true, force: true });
    }

    console.log(`The folder ${folderPath} has been emptied successfully.`);
  } catch (error) {
    throw new Error(`Error emptying folder ${folderPath}: ${error}`);
  }
};

const countLinesInFile = async (filePath: string): Promise<number> => {
  let lineCount = 0;
  const readStream = createReadStream(filePath, { encoding: "utf-8" });

  for await (const chunk of readStream) {
    let index = -1;
    while ((index = chunk.indexOf("\n", index + 1)) !== -1) {
      lineCount++;
    }
  }

  return lineCount;
};

const extractMetadataFromFile = async (
  filePath: string
): Promise<FileMetaData> => {
  const stats = await fs.stat(filePath);
  const lineCount = await countLinesInFile(filePath);
  const fileName = path.basename(filePath);

  const metadata = {
    name: fileName,
    date: stats.birthtime.toISOString(),
    lines: lineCount,
    size: stats.size,
  };

  return metadata;
};

export { exists, emptyFolder, extractMetadataFromFile };
