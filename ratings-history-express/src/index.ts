import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { exists } from "./utils/general";
import config from "./config";
import router from "./routes";
import { socket } from "./services";

dotenv.config();
const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/public", express.static(config.outDirPath));
app.use("/api/v1/", router);

const initializeDirectories = async () => {
  const outDirExists = await exists(config.outDirPath);

  if (!outDirExists) {
    console.log("Output directory does not exist. Creating...");
    await fs.mkdir(config.outDirPath, { recursive: true });
  }

  console.log("Deleting all previous temporary files if present...");

  const tempDirExists = await exists(config.tempDirPath);

  if (tempDirExists) {
    await fs.rm(config.tempDirPath, { recursive: true, force: true });
  }

  await fs.mkdir(path.resolve(config.tempDirPath, "csv"), { recursive: true });

  console.log("Temporary files deleted!");
};

const main = async () => {
  try {
    await initializeDirectories();

    const server = app.listen(port, async () => {
      console.log("Server running at port:", port);
    });

    server.on("error", (error) => {
      throw new Error(error.message);
    });

    socket.start(server);
  } catch (error) {
    console.error(error);
  }
};

main();
