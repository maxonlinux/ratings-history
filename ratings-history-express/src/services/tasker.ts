import { Task } from "../types";

class Tasker {
  private readonly concurrencyLimit: number;
  private taskQueue: Map<string, Task> = new Map();
  private runningTasks: Set<string> = new Set();

  constructor(concurrencyLimit: number) {
    this.concurrencyLimit = concurrencyLimit;
  }

  public addTask(id: string, task: Task) {
    this.taskQueue.delete(id);

    this.taskQueue.set(id, async () => {
      await task();
    });

    this.runningTasks.delete(id);

    if (this.runningTasks.size < this.concurrencyLimit) {
      this.processQueue();
    }
  }

  private async handleTask(id: string, task: Task) {
    try {
      await task();
    } finally {
      this.runningTasks.delete(id);
      this.processQueue();
    }
  }

  private async processQueue() {
    while (
      this.taskQueue.size &&
      this.runningTasks.size < this.concurrencyLimit
    ) {
      const [id, task] = this.taskQueue.entries().next().value;

      this.taskQueue.delete(id);
      this.runningTasks.add(id);

      this.handleTask(id, task);
    }
  }

  public cancelTask(id: string) {
    const taskExists = this.taskQueue.delete(id);

    if (!taskExists) {
      throw new Error("No queued task with this id");
    }
  }
}

export default Tasker;
