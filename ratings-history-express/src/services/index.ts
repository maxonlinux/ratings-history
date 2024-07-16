import Socket from "./socket";
import Downloader from "./downloader";
import Uploader from "./uploader";
import EventEmitter from "events";
import { AgencyEvent, UploadEvent } from "../types";

const downloader = new Downloader();
const uploader = new Uploader();
const socket = new Socket("/ws");
const emitter = new EventEmitter();

emitter.on(AgencyEvent.UPDATE, (agencyName, message) => {
  try {
    downloader.appendStatus(agencyName, message);
    const agencies = downloader.getAgencies();

    socket.broadcast({
      event: AgencyEvent.UPDATE,
      data: agencies,
    });
  } catch (error) {
    console.error(error);
  }
});

emitter.on(UploadEvent.UPDATE, (message) => {
  try {
    uploader.appendMessage(message);
    const messages = uploader.getMessages();

    socket.broadcast({
      event: UploadEvent.UPDATE,
      data: messages,
    });
  } catch (error) {
    console.error(error);
  }
});

export { downloader, uploader, socket, emitter };
