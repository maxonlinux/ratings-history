import express from "express";
import dotenv from "dotenv";
import { emptyFolder, exists } from "./utils";
import { config } from "./config";
import router from "./routes";
import { socket } from "./services";
import cors from "cors";

dotenv.config();
const app = express();
const port = process.env.PORT;

const main = async () => {
  console.log("Deleting all previous temporary files if present...");

  try {
    const tempDirExists = await exists(config.tempDirPath);

    if (!tempDirExists) {
      return;
    }

    await emptyFolder(config.tempDirPath);
  } catch (error) {
    console.error(error);
  }
};
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/public", express.static(config.outDirPath));
app.use("/api/v1/", router);

const server = app
  .listen(port, async () => {
    console.log("Server running at port: ", port);
    main();
  })
  .on("error", (error) => {
    throw new Error(error.message);
  });

socket.start(server);
