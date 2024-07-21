import { ChildProcess, fork } from "child_process";
import { emitter } from ".";
import { Events, TaskerEvents } from "../types";

interface Task {
  event: TaskerEvents;
  childProcessPath: string;
  data: string;
  resolve: () => void;
  reject: (error: Error) => void;
}

// For future use
class Takser {
  private queuedProcesses: Task[];
  private activeProcesses: Set<ChildProcess>;
  private concurrencyLimit: number;

  constructor(concurrencyLimit: number = 5) {
    this.queuedProcesses = [];
    this.activeProcesses = new Set();
    this.concurrencyLimit = concurrencyLimit;
  }

  // public addTask(
  //   event: TaskerEvents,
  //   childProcessPath: string,
  //   data: string
  // ): Promise<void> {
  //   return new Promise<void>((resolve, reject) => {
  //     this.queuedProcesses.push({
  //       event,
  //       childProcessPath,
  //       data,
  //       resolve,
  //       reject,
  //     });

  //     if (event === TaskerEvents.AGENCY_TASK) {
  //       emitter.emit(Events.AGENCIES_UPDATE, {
  //         type: "message",
  //         message: "Task queued",
  //         agencyName: data,
  //       });
  //     }

  //     if (event === TaskerEvents.UPLOAD_TASK) {
  //       emitter.emit(Events.UPLOAD_UPDATE, {
  //         type: "message",
  //         message: "Task queued",
  //       });
  //     }

  //     this.processNext();
  //   });
  // }

  // private async processNext() {
  //   if (
  //     !this.queuedProcesses.length ||
  //     this.activeProcesses.size >= this.concurrencyLimit
  //   ) {
  //     return;
  //   }

  //   const { event, childProcessPath, data, resolve, reject } =
  //     this.queuedProcesses.shift()!;

  //   const child = fork(childProcessPath);

  //   this.activeProcesses.add(child);

  //   child.send({ event, data });

  //   child.on("message", (msg: any) => {
  //     const { event, data } = msg;

  //     if (event === Events.AGENCY_MESSAGE) {
  //       emitter.emit(Events.AGENCIES_UPDATE, data);
  //     }

  //     if (event === Events.UPLOAD_MESSAGE) {
  //       emitter.emit(Events.UPLOAD_UPDATE, data);
  //     }
  //   });

  //   child.on("complete", () => {
  //     if (event === TaskerEvents.AGENCY_TASK) {
  //       emitter.emit(Events.AGENCIES_UPDATE, {
  //         type: "exit",
  //         message: "Done!",
  //         agencyName: data,
  //       });
  //     }

  //     if (event === TaskerEvents.UPLOAD_TASK) {
  //       emitter.emit(Events.UPLOAD_UPDATE, {
  //         type: "exit",
  //         message: "Done!",
  //       });
  //     }
  //   });

  //   child.on("error", (err: any) => {
  //     console.error(err.message ?? err);
  //     this.cleanup(child);

  //     emitter.emit(Events.AGENCIES_UPDATE, {
  //       type: "error",
  //       message: err,
  //       agencyName: data,
  //     });

  //     reject(err.message ?? err);

  //     this.processNext();
  //   });

  //   child.on("exit", async (code, signal) => {
  //     console.log(
  //       `Child process exited with code ${code} and signal ${signal}`
  //     );

  //     await this.cleanup(child);
  //     resolve();

  //     this.processNext();
  //   });
  // }

  private async cleanup(child: ChildProcess) {
    this.activeProcesses.delete(child);
  }

  public async abort(): Promise<void> {
    // child.send({ event: "abort" });
  }
}

export default Takser;
