import { Events } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback = (data: any) => void;

class EventEmitter {
  private events: Record<Events, EventCallback[]> = {} as Record<
    Events,
    EventCallback[]
  >;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public dispatch(event: Events, data: any): void {
    const callbacks = this.events[event];
    if (!callbacks) return;
    callbacks.forEach((callback) => callback(data));
  }

  public subscribe(event: Events, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  public unsubscribe(event: Events, callback: EventCallback): void {
    const callbacks = this.events[event];
    if (!callbacks) return;
    this.events[event] = callbacks.filter((cb) => cb !== callback);
  }
}

const emitter = new EventEmitter();

export { emitter };
