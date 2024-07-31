import EventEmitter from "events";
import Socket from "./socket";
import Downloader from "./downloader";
import Uploader from "./uploader";
import { Events, Message } from "../types";
import Takser from "./tasker";
import Monitor from "./monitor";
import Filer from "./filer";
import Scheduler from "./scheduler";
import config from "../config";
import nodemailer from "nodemailer";

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

emitter.on(
  Events.TASKS_COMPLETE,
  async (report: {
    [key: string]: { attempts: number; error: unknown | null };
  }) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "maxonlinuxxx@gmail.com",
        pass: "rzripjyuiocdrmwy",
      },
    });

    const reportArray = Object.entries(report).map(
      ([id, { attempts, error }]) => ({
        id,
        attempts,
        error,
      })
    );

    const failedTasks = reportArray.filter((task) => task.error);

    const htmlContent = `
      <h3>Tasks Report</h3>
      <p>Tasks attempted: ${reportArray.length}</p>
      <p>Successful tasks: ${reportArray.length - failedTasks.length}</p>
      <p>Failed tasks: ${failedTasks.length}</p>
      <h4>Details:</h4>
      <ul>
        ${reportArray
          .map(
            (task) =>
              `<li>${task.id} - Attempts: ${task.attempts} - ${
                task.error ? "Error: " + task.error : "Success"
              }</li>`
          )
          .join("")}
      </ul>
    `;

    const mailOptions = {
      from: "maxonlinuxxx@gmail.com",
      to: "maxonlinux@gmail.com",
      subject: "RatighsHistory.info | Tasks Report",
      html: htmlContent,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Report email sent successfully.");
    } catch (error) {
      console.error("Failed to send report email:", error);
    }
  }
);

const scheduleRule = "0 0 1,15 * *"; // every 1st and 15th day of the month
// const scheduleRule = "*/10 * * * *"; // every 10 min

new Scheduler(config.agenciesMap, scheduleRule, 3);

export { downloader, uploader, socket, emitter, tasker, monitor, filer };
