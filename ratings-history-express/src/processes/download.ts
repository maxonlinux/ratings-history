import { agenciesFunctionsMap } from "../agencies";
import { emitter } from "../services";
import { Events, Message } from "../types";

const controller = new AbortController(); // Doesn't work so far, so simple process.exit() is used. Will be implemented soon.

const send = (message: { event: string; data: Message }) => {
  if (process.send) {
    process.send(message);
  }
};

const start = async (agencyName: string) => {
  emitter.on(Events.AGENCY_MESSAGE, (data: Message) => {
    try {
      send({
        event: Events.AGENCY_MESSAGE,
        data: { ...data, agencyName },
      });
    } catch (error) {
      console.error(error);
    }
  });

  const agencyFunction = agenciesFunctionsMap[agencyName];
  await agencyFunction(controller, emitter);

  emitter.emit(Events.AGENCY_MESSAGE, {
    message: "Done!",
    type: "exit",
  });

  process.exit(0);
};

const abort = () => {
  // controller.abort()
  emitter.emit(Events.AGENCY_MESSAGE, {
    message: "Aborted by user",
    type: "exit",
  });

  process.exit(0);
};

process.on("uncaughtException", (err) => {
  emitter.emit(Events.AGENCY_MESSAGE, {
    message: err.message ?? err,
    type: "error",
  });

  process.exit(1);
});

process.on("message", async (message: any) => {
  const { event, data } = message;

  switch (event) {
    case "agency":
      await start(data);
      break;
    case "abort":
      abort();
      break;
    default:
      break;
  }
});
