import { agenciesFunctionsMap } from "../agencies";
import { emitter } from ".";
import { fork } from "child_process";
import path from "path";
import { AgencyEvent, Message } from "../types";

class Downloader {
  private processes: Map<string, any>;
  private agencies: Map<string, { messages: Message[] }>;

  constructor() {
    this.processes = new Map();
    this.agencies = new Map();

    for (const key in agenciesFunctionsMap) {
      this.agencies.set(key, { messages: [] });
    }
  }

  public async initiate(agencyName: string): Promise<void> {
    const agency = agenciesFunctionsMap.hasOwnProperty(agencyName);

    if (!agency) {
      throw new Error("Agency not found");
    }

    const existingProcess = this.processes.get(agencyName);

    if (existingProcess) {
      throw new Error("Download already in progress");
    }

    const childPath = path.join(__dirname, "../processes", "download");

    const child = fork(childPath);

    console.log(`Process for ${agencyName} forked`);

    this.processes.set(agencyName, child);

    child.send({ event: "agency", data: agencyName });

    child.on("message", (msg: any) => {
      console.log(msg);
      const { event, message } = msg;
      if (event === AgencyEvent.MESSAGE) {
        emitter.emit(AgencyEvent.UPDATE, agencyName, message);
      }
    });

    child.on("complete", () => {
      emitter.emit(AgencyEvent.UPDATE, agencyName, {
        type: "exit",
        message: "Done!",
      });
    });

    child.on("error", (err: any) => {
      console.error(err);

      emitter.emit(AgencyEvent.UPDATE, agencyName, {
        type: "error",
        message: err.message ?? err,
      });
    });

    child.on("exit", (code, signal) => {
      this.cleanup(agencyName);

      console.log(
        `Child process exited with code ${code} and signal ${signal}`
      );
    });
  }

  private cleanup(agencyName: string) {
    const child = this.processes.get(agencyName);

    if (!child) {
      return;
    }

    this.processes.delete(agencyName);
    this.agencies.set(agencyName, { messages: [] });
  }

  public async abort(agencyName: string): Promise<void> {
    const agency = agenciesFunctionsMap[agencyName];

    if (!agency) {
      throw new Error("Agency not found");
    }
    const process = this.processes.get(agencyName);

    if (!process) {
      throw new Error("No ongoing operation to abort");
    }

    process.send({ event: "abort" });
  }

  public appendStatus(agencyName: string, message: Message) {
    const agency = this.agencies.get(agencyName);

    if (!agency) {
      throw new Error("No agency with name " + agencyName);
    }

    this.agencies.set(agencyName, { messages: [message, ...agency.messages] });
  }

  public getAgency(agencyName?: string) {
    if (!agencyName) {
      return this.agencies;
    }

    const agency = this.agencies.get(agencyName);

    if (!agency) {
      throw new Error("No agency with name " + agencyName);
    }

    return agency;
  }

  public getAgencies() {
    return Object.fromEntries(this.agencies);
  }
}

export default Downloader;
