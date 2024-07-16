import WebSocket, { WebSocketServer } from "ws";
import { Server } from "http";
import { downloader, uploader } from ".";
import { AgencyEvent, UploadEvent } from "../types";

class Socket {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, Set<string>>;

  constructor(path: string) {
    this.wss = new WebSocketServer({ noServer: true, path });
    this.clients = new Map();

    this.wss.on("connection", (ws: WebSocket) => {
      this.clients.set(ws, new Set());

      ws.on("message", (message: Buffer) => {
        const { action, data } = this.parseMessage(message);

        if (!action || !data) {
          return;
        }

        if (action === "subscribe") {
          const subscriptions = this.clients.get(ws);
          subscriptions?.add(data);

          if (data === AgencyEvent.UPDATE) {
            console.log(`Client subscribed to ${AgencyEvent.UPDATE}`);
            const agencies = downloader.getAgencies();

            this.broadcast({
              event: AgencyEvent.UPDATE,
              data: agencies,
            });
          }

          if (data === UploadEvent.UPDATE) {
            console.log(`Client subscribed to ${UploadEvent.UPDATE}`);
            const messages = uploader.getMessages();

            this.broadcast({
              event: UploadEvent.UPDATE,
              data: messages,
            });
          }
        }

        if (action === "unsubscribe") {
          const subscriptions = this.clients.get(ws);
          subscriptions?.delete(data);

          console.log(`Client unsubscribed from ${data}`);
        }
      });

      ws.on("close", () => {
        this.clients.delete(ws);
      });

      ws.on("error", (error: any) => {
        console.error(`WebSocket error: ${error}`);
      });
    });
  }

  private parseMessage = (message: Buffer) => {
    try {
      const messageString = message.toString();

      if (!messageString) {
        return null;
      }

      const parsedMessage = JSON.parse(messageString);

      return parsedMessage;
    } catch (error) {
      return null;
    }
  };

  public start(server: Server) {
    server.on("upgrade", (req, socket, head) => {
      this.wss.handleUpgrade(req, socket, head, (ws) => {
        this.wss.emit("connection", ws, req);
      });
    });
  }

  public send(client: WebSocket, message: { event: string; data: any }) {
    const { event, data } = message;

    if (!event || !data) {
      return;
    }

    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event, data }));
    }
  }

  public broadcast(message: { event: string; data: any }) {
    const { event, data } = message;

    if (!event || !data) {
      return;
    }

    for (const [client, subscriptions] of this.clients.entries()) {
      if (subscriptions.has(event) && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event, data }));
      }
    }
  }

  public close() {
    this.wss.close(() => {
      console.log("WebSocket server closed");
    });
  }
}

export default Socket;
