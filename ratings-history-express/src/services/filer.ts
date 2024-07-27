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
  private mutex: Mutex;
  private metadata: { [key: string]: BaseMetadata };

  constructor() {
    this.metadata = {};
    this.mutex = new Mutex();
    this.initialize();
  }

  private async initialize() {
    const files = await fs.readdir(config.outDirPath);

    for (const file of files) {
      const meta = await generateMetadata(
        path.resolve(config.outDirPath, file)
      );

      this.metadata[file] = meta;
    }

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
      const basename = path.basename(event.path);

      this.mutex.runExclusive(async () => {
        console.log(
          event.type.charAt(0).toUpperCase() + event.type.slice(1) + "d",
          basename
        );

        switch (event.type) {
          case "create":
            const metadata = await generateMetadata(event.path);
            this.metadata[basename] = metadata;
            break;

          case "update":
            this.metadata[basename] = await generateMetadata(event.path);
            break;

          case "delete":
            delete this.metadata[basename];
            break;

          default:
            break;
        }
      });
    }
  }

  async get(): Promise<FileMetadata[]>;
  async get(fileName: string): Promise<FileMetadata | undefined>;
  async get(fileName?: string) {
    if (!fileName) {
      return Object.entries(this.metadata).map(([name, meta]) => ({
        name,
        ...meta,
      }));
    }

    const meta = this.metadata[fileName];

    return meta ? { name: fileName, ...meta } : undefined;
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
