import { Message, Events } from "../types";
import Parser from "../services/parser";
import { emitter, tasker } from ".";
import fs from "fs/promises";

const emit = {
  message: (message: string) => {
    emitter.emit(Events.UPLOAD_UPDATE, {
      message,
      type: "message",
    });
  },
  error: (message: string) => {
    emitter.emit(Events.UPLOAD_UPDATE, {
      message,
      type: "error",
    });
  },
  done: (message: string) => {
    emitter.emit(Events.UPLOAD_UPDATE, {
      message,
      type: "exit",
    });
  },
};

class Uploader {
  messages: Message[];
  zipFilePath: string | null;

  constructor() {
    this.messages = [];
    this.zipFilePath = null;
  }

  public async initiate(filePath: string): Promise<void> {
    const parser = new Parser();

    const task = async () => {
      try {
        emit.message("Process started");
        await parser.processZipArchive(filePath);
        emit.done("Completed!");
      } catch (error) {
        const err = error as any;
        emit.error(err.message ?? err);
      } finally {
        this.cleanup();
      }
    };

    emit.message("Queued...");

    tasker.addTask("upload", task);
  }

  appendMessage(message: Message) {
    this.messages = [message, ...this.messages];
  }

  private async cleanup() {
    this.messages = [];

    if (!this.zipFilePath) {
      return;
    }

    await fs.unlink(this.zipFilePath);
    this.zipFilePath = null;
  }

  public async abort(): Promise<void> {
    tasker.cancelTask("upload");
    emit.done("Cancelled by user");
  }

  public getMessages() {
    return this.messages;
  }
}

export default Uploader;
