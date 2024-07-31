import WebSocket, { WebSocketServer } from "ws";
import { Server } from "http";
import { downloader, monitor, uploader } from ".";
import { Events } from "../types";
import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import config from "../config";
import internal from "stream";

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

          if (data === Events.AGENCIES_UPDATE) {
            console.log(`Client subscribed to ${Events.AGENCIES_UPDATE}`);
            const agencies = downloader.getAgencies();

            this.send(ws, {
              event: Events.AGENCIES_UPDATE,
              data: agencies,
            });
          }

          if (data === Events.UPLOAD_UPDATE) {
            console.log(`Client subscribed to ${Events.UPLOAD_UPDATE}`);
            const messages = uploader.getMessages();

            this.send(ws, {
              event: Events.UPLOAD_UPDATE,
              data: messages,
            });
          }

          if (data === Events.AGENCIES_UPDATE) {
            console.log(`Client subscribed to ${Events.SYSTEM_INFO}`);
            const info = monitor.getSysInfo();

            this.send(ws, {
              event: Events.SYSTEM_INFO,
              data: info,
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
        this.cleanupSubscriptions(ws);
        this.clients.delete(ws);
      });

      ws.on("error", (error) => {
        console.error(`WebSocket error: ${error}`);
      });
    });
  }

  private cleanupSubscriptions(ws: WebSocket) {
    const subscriptions = this.clients.get(ws);
    if (subscriptions) {
      for (const event of subscriptions) {
        const subscriptions = this.clients.get(ws);

        subscriptions?.forEach((event) => {
          this.broadcast({
            event: "unsubscribe",
            data: event,
          });
        });
        console.log(`Client unsubscribed from ${event} (disconnected)`);
      }
    }
  }

  private getCookieValue(cookieHeader: string, cookieName: string) {
    const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
    for (const cookie of cookies) {
      const [name, value] = cookie.split("=");
      if (name === cookieName) {
        return value;
      }
    }
    return null;
  }

  private parseMessage = (message: Buffer) => {
    try {
      const messageString = message.toString();

      if (!messageString) {
        return null;
      }

      const parsedMessage = JSON.parse(messageString);

      return parsedMessage;
    } catch (_error) {
      return null;
    }
  };

  public start(server: Server) {
    const destroy = (socket: internal.Duplex) => {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.end();
      socket.destroy();
    };

    server.on("upgrade", (req, socket, head) => {
      const cookies = req.headers.cookie;

      if (!cookies) {
        destroy(socket);
        return;
      }

      const token = this.getCookieValue(cookies, "authToken");

      if (!token) {
        destroy(socket);
        return;
      }

      try {
        jwt.verify(token, config.secret) as JwtPayload;
      } catch (error) {
        const err = error as JsonWebTokenError;
        if (err.name === "TokenExpiredError") {
          destroy(socket);
          return;
        }

        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.end();
        socket.destroy();
      }

      this.wss.handleUpgrade(req, socket, head, (ws) => {
        this.wss.emit("connection", ws, req);
      });
    });
  }

  public send(client: WebSocket, message: { event: string; data: unknown }) {
    const { event, data } = message;

    if (!event || !data) {
      return;
    }

    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event, data }));
    }
  }

  public broadcast(message: { event: string; data: unknown }) {
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
