import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import vhost from "vhost";
import { exists } from "./utils/general";
import config from "./config";
import { adminRouter, apiRouter, mainRouter } from "./routes";
import { socket } from "./services";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
const apiApp = express();
const adminApp = express();

const port = process.env.PORT;

const options = {
  origin: config.allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

adminApp.use(adminRouter);

apiApp.use(cors(options));
apiApp.use(express.json());
apiApp.use(cookieParser());
apiApp.use(express.urlencoded({ extended: true }));
apiApp.use(apiRouter);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(vhost("admin.*", adminApp));
app.use(vhost("api.*", apiApp));
app.use(mainRouter);

app.use((_req, res) => {
  res.status(404).render("404");
});

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
