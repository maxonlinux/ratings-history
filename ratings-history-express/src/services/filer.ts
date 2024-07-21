import fs from "fs/promises";
import { config } from "../config";
import { BaseMetadata, FileMetadata } from "../types";
import path from "path";
import { createReadStream } from "fs";
import readline from "readline";
import watcher from "@parcel/watcher";
import { Mutex } from "async-mutex";

const countLines = async (filePath: string) => {
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
};

const generateMetadata = async (filePath: string) => {
  const stat = await fs.stat(filePath);
  const lines = await countLines(filePath);

  const metadata = {
    date: stat.birthtime.toISOString(),
    size: stat.size,
    lines,
  };

  return metadata;
};

class Filer {
  private subscription: watcher.AsyncSubscription | undefined;
  private mutex = new Mutex();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const files = await fs.readdir(config.outDirPath);
    const metadata: FileMetadata[] = [];

    for (const file of files) {
      const meta = await generateMetadata(
        path.resolve(config.outDirPath, file)
      );

      metadata.push({ name: file, ...meta });
    }

    await fs.writeFile(
      config.metadataFilePath,
      JSON.stringify(metadata, null, 2)
    );

    this.subscription = await watcher.subscribe(
      config.outDirPath,
      this.subscribeHandler.bind(this)
    );
  }

  private async subscribeHandler(err: Error | null, events: watcher.Event[]) {
    if (err) {
      console.error("Watcher error:", err.message ?? err);
      return;
    }

    for (const event of events) {
      this.mutex.runExclusive(async () => {
        console.log("File event:", event.type, event.path);

        const metadataFile = await fs.readFile(config.metadataFilePath, "utf8");
        const metadataData = JSON.parse(metadataFile) as {
          [key: string]: BaseMetadata;
        };

        switch (event.type) {
          case "create":
            const metadata = await generateMetadata(event.path);
            metadataData[path.basename(event.path)] = metadata;
            break;

          case "update":
            metadataData[path.basename(event.path)] = await generateMetadata(
              event.path
            );
            break;

          case "delete":
            delete metadataData[path.basename(event.path)];
            break;

          default:
            break;
        }

        await fs.writeFile(
          config.metadataFilePath,
          JSON.stringify(metadataData, null, 2)
        );
      });
    }
  }

  async get(): Promise<FileMetadata[]>;
  async get(fileName: string): Promise<FileMetadata | undefined>;
  async get(fileName?: string) {
    const metadataFile = await fs.readFile(config.metadataFilePath, "utf8");
    const storedMetadata = JSON.parse(metadataFile) as {
      [key: string]: BaseMetadata;
    };

    if (fileName) {
      return storedMetadata[fileName]
        ? { name: fileName, ...storedMetadata[fileName] }
        : undefined;
    }

    return Object.entries(storedMetadata).map(([name, meta]) => ({
      name,
      ...meta,
    }));
  }

  async rename(fileName: string, newFileName: string) {
    const filePath = path.join(config.outDirPath, fileName);
    const newFilePath = path.join(config.outDirPath, newFileName);
    await fs.rename(filePath, newFilePath);

    return filePath;
  }

  async delete(fileName: string) {
    const filePath = path.resolve(config.outDirPath, fileName);
    await fs.unlink(filePath);

    return filePath;
  }

  async unsubscribe() {
    const subscripton = this.subscription;

    if (!subscripton) {
      throw new Error("Subscription is not initialized yet!");
    }

    console.log("Unsubscribed from output directory file events!");
  }
}

export default Filer;
