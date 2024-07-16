import { extractFromFile, flattenFolder } from "../utils";
import fs from "fs/promises";
import XmlParser from "../services/parser";
import { emitter } from "../services";
import { Message, UploadEvent } from "../types";
import path from "path";

const controller = new AbortController();
const parser = new XmlParser();

const send = (message: any) => {
  if (process.send) {
    process.send(message);
  }
};

async function checkDirectoryForXmlFiles(directoryPath: string) {
  try {
    const files = await fs.readdir(directoryPath);
    const xmlFiles = files.filter(
      (file) => path.extname(file).toLowerCase() === ".xml"
    );

    if (!xmlFiles.length) {
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error checking directory for XML files:", err);
  }
}

const start = async (filePath: string) => {
  emitter.on(UploadEvent.MESSAGE, (message: Message) => {
    try {
      send({ event: UploadEvent.MESSAGE, message });
    } catch (error) {
      console.error(error);
    }
  });

  let dirPath: string;

  controller.signal.addEventListener(
    "abort",
    async () => {
      if (dirPath) {
        await fs.rm(dirPath, { recursive: true, force: true });
      }

      process.exit(0);
    },
    { once: true }
  );

  emitter.emit(UploadEvent.MESSAGE, {
    message: "Process initiated",
    type: "message",
  });

  dirPath = await extractFromFile(filePath);
  await flattenFolder(dirPath);

  const hasXmlFiles = await checkDirectoryForXmlFiles(dirPath);

  if (!hasXmlFiles) {
    throw new Error("This archive doesn't contain XML files");
  }

  await parser.processXmlFiles(dirPath);

  emitter.emit(UploadEvent.MESSAGE, {
    message: "Done!",
    type: "exit",
  });

  process.exit(0)
};

const abort = () => {
  emitter.emit(UploadEvent.MESSAGE, {
    message: "Aborted by user",
    type: "exit",
  });

  controller.abort();
};

process.on("uncaughtException", (err) => {
  emitter.emit(UploadEvent.MESSAGE, {
    message: err.message ?? err,
    type: "error",
  });

  process.exit(1);
});

process.on("message", async (message: any) => {
  const { event, data } = message;

  switch (event) {
    case "file":
      await start(data);
      break;
    case "abort":
      abort();
      break;
    default:
      break;
  }
});
