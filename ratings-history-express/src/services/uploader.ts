import { ChildProcess, fork } from "child_process";
import { Message, Events } from "../types";
import { emitter } from ".";
import fs from "fs/promises";
import path from "path";

class Uploader {
  process: ChildProcess | null;
  messages: Message[];
  zipFilePath: string | null;

  constructor() {
    this.process = null;
    this.messages = [];
    this.zipFilePath = null;
  }

  public async initiate(filePath: string): Promise<void> {
    if (this.process) {
      throw new Error(
        "One operation is already in progress. You cannot start more than one upload concurrently"
      );
    }

    const childPath = path.join(__dirname, "../processes", "upload");

    const child = fork(childPath);

    this.process = child;

    child.send({ event: "file", data: filePath });

    child.on("message", (msg: any) => {
      console.log(msg);
      const { event, data } = msg;
      if (event !== Events.UPLOAD_MESSAGE) {
        return;
      }

      emitter.emit(event, data);
    });

    child.on("complete", () => {
      emitter.emit(Events.UPLOAD_UPDATE, {
        type: "exit",
        message: "Done!",
      });
    });

    child.on("error", (err: any) => {
      console.error(err);

      emitter.emit(Events.UPLOAD_UPDATE, {
        type: "error",
        message: err.message ?? err,
      });
    });

    child.on("exit", async (code, signal) => {
      await this.cleanup();

      console.log(
        `Child process for manual upload exited with code ${code} and signal ${signal}`
      );
    });
  }

  appendMessage(message: Message) {
    this.messages = [message, ...this.messages];
  }

  private async cleanup() {
    if (!this.process) {
      return;
    }

    this.process = null;
    this.messages = [];

    if (!this.zipFilePath) {
      return;
    }

    await fs.unlink(this.zipFilePath);
    this.zipFilePath = null;
  }

  public async abort(): Promise<void> {
    if (!this.process) {
      throw new Error("No ongoing operation to abort");
    }

    this.process.send({ event: "abort" });
  }

  public getMessages() {
    return this.messages;
  }
}

export default Uploader;
