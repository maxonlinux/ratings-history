import fs from "fs/promises";
import { config } from "../config";
import { FileMetadata } from "../types";
import path from "path";
import { createReadStream } from "fs";
import readline from "readline";

class Filer {
  constructor() {}

  private async countLines(filePath: string) {
    let lineCount = 0;

    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const _ of rl) {
      lineCount++;
    }

    return lineCount;
  }

  private async generateMetadata(filePath: string) {
    const stats = await fs.stat(filePath);
    const lineCount = await this.countLines(filePath);
    const fileName = path.basename(filePath);

    const metadata = {
      name: fileName,
      date: stats.birthtime.toISOString(),
      lines: lineCount,
      size: stats.size,
    };

    return metadata;
  }

  async get(fileName: string) {
    const metadataFile = await fs.readFile(config.metadataFilePath, "utf8");
    const storedMetadata = JSON.parse(metadataFile) as FileMetadata[];

    const file = storedMetadata.find((metadata) => metadata.name === fileName);

    return file;
  }

  async getAll() {
    const metadataFile = await fs.readFile(config.metadataFilePath, "utf8");
    const storedMetadata = JSON.parse(metadataFile) as FileMetadata[];

    return storedMetadata;
  }

  async rename(fileName: string, newFileName: string) {
    const filePath = path.join(config.outDirPath, fileName);
    const newFilePath = path.join(config.outDirPath, newFileName);

    const metadataFile = await fs.readFile(config.metadataFilePath, "utf8");
    const storedMetadata = JSON.parse(metadataFile) as FileMetadata[];

    const updatedMetadata = storedMetadata.map((metadata) =>
      metadata.name === fileName ? { ...metadata, name: newFileName } : metadata
    );

    await fs.writeFile(
      config.metadataFilePath,
      JSON.stringify(updatedMetadata, null, 2)
    );

    await fs.rename(filePath, newFilePath);

    return filePath;
  }

  async delete(fileName: string) {
    const filePath = path.resolve(config.outDirPath, fileName);

    const metadataFile = await fs.readFile(config.metadataFilePath, "utf8");
    const storedMetadata = JSON.parse(metadataFile) as FileMetadata[];

    const updatedMetadata = storedMetadata.filter(
      (metadata) => metadata.name !== fileName
    );

    await fs.writeFile(
      config.metadataFilePath,
      JSON.stringify(updatedMetadata, null, 2)
    );

    await fs.unlink(filePath);

    return filePath;
  }

  async update() {
    const metadataFile = await fs.readFile(config.metadataFilePath, "utf8");
    const storedMetadata = JSON.parse(metadataFile) as FileMetadata[];

    const files = await fs.readdir(config.outDirPath);
    const filesMap = new Map<string, string>();

    for (const file of files) {
      if (!file.toLowerCase().endsWith(".csv")) {
        continue;
      }

      const stat = await fs.stat(path.resolve(config.outDirPath, file));
      filesMap.set(file, stat.birthtime.toISOString());
    }

    const updatedMetadata: FileMetadata[] = [];

    for (const meta of storedMetadata) {
      const date = filesMap.get(meta.name);

      if (date === meta.date) {
        updatedMetadata.push(meta);
      }

      filesMap.delete(meta.name);
    }

    for (const [file] of filesMap) {
      const filePath = path.resolve(config.outDirPath, file);
      const newMetadata = await this.generateMetadata(filePath);
      updatedMetadata.push(newMetadata);
    }

    await fs.writeFile(
      config.metadataFilePath,
      JSON.stringify(updatedMetadata, null, 2)
    );

    return updatedMetadata;
  }
}

export default Filer;
