import { emitter } from ".";
import { Events, Task } from "../types";

class Tasker {
  private readonly concurrencyLimit: number;
  private taskQueue: Map<string, { task: Task; retries: number }> = new Map();
  private runningTasks: Set<string> = new Set();
  private processing = false;

  private report: {
    [key: string]: { attempts: number; error: unknown | null };
  } = {};

  constructor(concurrencyLimit: number) {
    this.concurrencyLimit = concurrencyLimit;
  }

  public addTask(id: string, task: Task, retries: number = 1) {
    const taskExists = this.taskQueue.get(id) || this.runningTasks.has(id);

    if (taskExists) {
      throw new Error("Task with this ID already exists!");
    }

    this.taskQueue.set(id, { task, retries });
    this.processQueue();
  }

  private async handleTask(id: string, task: Task, retries: number) {
    let attempt = 1;

    while (attempt <= retries) {
      try {
        await task();
        this.report[id] = { attempts: attempt, error: null };
        return;
      } catch (error) {
        if (attempt >= retries) {
          console.error(
            `Task ${id} failed after ${retries} attempts: ${
              error instanceof Error ? error.message : error
            }`
          );

          this.report[id] = { attempts: retries, error: error };
        }

        console.log(
          `Retrying task ${id} (attempt ${attempt}): ${
            error instanceof Error ? error.message : error
          }`
        );

        this.report[id] = {
          attempts: attempt,
          error: error instanceof Error ? error.message : error,
        };

        attempt++;
      }
    }
  }

  private async processQueue() {
    if (this.processing || !this.taskQueue.size) {
      return;
    }

    this.processing = true;

    while (
      this.taskQueue.size &&
      this.runningTasks.size < this.concurrencyLimit
    ) {
      const [id, { task, retries }] = this.taskQueue.entries().next().value;

      this.taskQueue.delete(id);
      this.runningTasks.add(id);

      try {
        await this.handleTask(id, task, retries);
      } finally {
        this.runningTasks.delete(id);
        this.shouldEnd();
      }
    }

    this.processing = false;
  }

  private shouldEnd() {
    if (this.taskQueue.size || this.runningTasks.size) {
      return;
    }

    emitter.emit(Events.TASKS_COMPLETE, this.report);

    this.report = {};
  }

  public cancelTask(id: string) {
    const taskExists = this.taskQueue.delete(id);

    if (!taskExists) {
      throw new Error("No queued task with this id");
    }
  }
}

export default Tasker;
