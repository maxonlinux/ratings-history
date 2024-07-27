/* eslint-disable import/no-cycle */
import EventEmitter from "events";
import Socket from "./socket";
import Downloader from "./downloader";
import Uploader from "./uploader";
import { Events, Message } from "../types";
import Takser from "./tasker";
import Monitor from "./monitor";
import Filer from "./filer";

const emitter = new EventEmitter();
const downloader = new Downloader();
const uploader = new Uploader();
const socket = new Socket("/ws");
const tasker = new Takser(1);
const monitor = new Monitor();
const filer = new Filer();

emitter.on(Events.UPLOAD_UPDATE, async (data: Message) => {
  console.log("Update from uploader: ", data);
  try {
    uploader.appendMessage(data);
    const messages = uploader.getMessages();

    socket.broadcast({
      event: Events.UPLOAD_UPDATE,
      data: messages,
    });
  } catch (error) {
    console.error(error);
  }
});

emitter.on(Events.AGENCIES_UPDATE, async (data: Message) => {
  console.log("Update from downloader: ", data);
  const { message, type, agencyName } = data;

  try {
    downloader.appendStatus(agencyName, { message, type });
    const agencies = downloader.getAgencies();

    socket.broadcast({
      event: Events.AGENCIES_UPDATE,
      data: agencies,
    });
  } catch (error) {
    console.error(error);
  }
});

export { downloader, uploader, socket, emitter, tasker, monitor, filer };
