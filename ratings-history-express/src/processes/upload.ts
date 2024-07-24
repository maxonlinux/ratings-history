// import fs from "fs/promises";
// import Parser from "../services/parser";
// import { Message, Events } from "../types";
// import { emitter } from "../services";

// const controller = new AbortController();
// const parser = new Parser();

// const send = (message: any) => {
//   if (process.send) {
//     process.send(message);
//   }
// };

// const start = async (filePath: string) => {
//   emitter.on(Events.UPLOAD_MESSAGE, (data: Message) => {
//     try {
//       send({ event: Events.UPLOAD_MESSAGE, data });
//     } catch (error) {
//       console.error(error);
//     }
//   });

//   let dirPath: string;

//   controller.signal.addEventListener(
//     "abort",
//     async () => {
//       if (dirPath) {
//         await fs.rm(dirPath, { recursive: true, force: true });
//       }

//       process.exit(0);
//     },
//     { once: true }
//   );

//   emitter.emit(Events.UPLOAD_MESSAGE, {
//     message: "Process initiated",
//     type: "message",
//   });

//   await parser.processZipArchive(filePath);

//   emitter.emit(Events.UPLOAD_MESSAGE, {
//     message: "Done!",
//     type: "exit",
//   });

//   process.exit(0);
// };

// const abort = () => {
//   emitter.emit(Events.UPLOAD_MESSAGE, {
//     message: "Aborted by user",
//     type: "exit",
//   });

//   controller.abort();
// };

// process.on("uncaughtException", (err) => {
//   emitter.emit(Events.UPLOAD_MESSAGE, {
//     message: err,
//     type: "error",
//   });

//   process.exit(1);
// });

// process.on("message", async (message: any) => {
//   const { event, data } = message;

//   switch (event) {
//     case "file":
//       await start(data);
//       break;
//     case "abort":
//       abort();
//       break;
//     default:
//       break;
//   }
// });
