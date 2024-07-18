import { config } from "../config";
import { Events } from "../types";
import { emitter } from "./emitter";

class WebSocketService {
  private url: string;
  private ws: null | WebSocket;
  private listeners: Map<string, Function[]>;
  private messageQueue: Array<{ action: string; data: any }>;
  private subscribedEvents: Set<string>;

  constructor(url: string) {
    this.url = url;
    this.ws = null;
    this.listeners = new Map();
    this.messageQueue = [];
    this.subscribedEvents = new Set();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      emitter.dispatch(Events.SOCKET_OPEN, null);
      // Process queued messages
      this.messageQueue.forEach((msg) => {
        this.ws?.send(JSON.stringify(msg));
      });
      this.messageQueue = [];

      // Re-subscribe to all events
      this.subscribedEvents.forEach((event) => {
        const message = { action: "subscribe", data: event };
        this.ws?.send(JSON.stringify(message));
      });
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log(message);
      const listeners = this.listeners.get(message.event);
      if (listeners) {
        listeners.forEach((callback) => callback(message.data));
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error", error);
    };

    this.ws.onclose = (event: { code: number; reason: string }) => {
      console.log(`WebSocket disconnected: ${event.code} - ${event.reason}`);
      if (event.code !== 1000) {
        // 1000 is the normal closure code
        console.log("Attempting to reconnect...");
        setTimeout(() => {
          this.connect();
        }, 3000);
      }
    };
  }

  disconnect() {
    this.ws?.close(1000, "Client initiated close"); // 1000 indicates normal closure
  }

  subscribe(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.subscribedEvents.add(event);

    this.listeners.get(event)?.push(callback);
    const message = { action: "subscribe", data: event };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  unsubscribe(event: string) {
    const message = { action: "unsubscribe", data: event };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }

    this.subscribedEvents.delete(event);
  }
}

const socket = new WebSocketService(config.wsUrl);
export default socket;
