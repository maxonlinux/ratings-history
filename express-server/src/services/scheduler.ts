import { downloader } from ".";
import schedule from "node-schedule";

class Scheduler {
  private readonly scheduleRule: string;
  private readonly tasks: string[];
  private readonly retries: number;

  constructor(tasks: string[], scheduleRule: string, retries: number) {
    this.tasks = tasks;
    this.scheduleRule = scheduleRule;
    this.retries = retries;

    this.initialize();
  }

  public initialize() {
    console.log(
      `Tasks scheduled with rule ${this.scheduleRule} and retries ${this.retries}`
    );

    schedule.scheduleJob(this.scheduleRule, async () => {
      console.log("Running scheduled tasks...");

      this.tasks.map((agencyName) => {
        try {
          downloader.initiate(agencyName, { retries: this.retries });
        } catch (error) {
          if (error instanceof Error) {
            console.error(error.message);
            return;
          }

          console.error("Scheduler error:", error);
        }
      });
    });
  }
}

export default Scheduler;
