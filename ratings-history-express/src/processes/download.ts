import { agenciesFunctionsMap } from "../agencies";
import { AgencyEvent, Message } from "../types";
import { emitter } from "../services";

const controller = new AbortController(); // Doesn't work so far, so simple process.exit() is used. Will be implemented soon.

const send = (message: any) => {
  if (process.send) {
    process.send(message);
  }
};

const start = async (agencyName: string) => {
  emitter.on(AgencyEvent.MESSAGE, (message: Message) => {
    try {
      send({ event: AgencyEvent.MESSAGE, agencyName, message });
    } catch (error) {
      console.error(error);
    }
  });

  const agencyFunction = agenciesFunctionsMap[agencyName];
  await agencyFunction(controller, emitter);

  emitter.emit(AgencyEvent.MESSAGE, {
    message: "Done!",
    type: "exit",
  });

  process.exit(0);
};

const abort = () => {
  // controller.abort()
  emitter.emit(AgencyEvent.MESSAGE, {
    message: "Aborted by user",
    type: "exit",
  });

  process.exit(0);
};

process.on("uncaughtException", (err) => {
  emitter.emit(AgencyEvent.MESSAGE, {
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
