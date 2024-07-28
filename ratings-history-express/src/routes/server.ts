import { Request, Response, Router } from "express";
import { downloader } from "../services";

const router = Router();

router.post("/restart", async (_req: Request, res: Response) => {
  try {
    downloader.closeBrowser();
    console.log("SERVER RESTART!");
    res.json({ message: "Restarting server..." });
    process.kill(process.pid, "SIGUSR2");
  } catch (error) {
    res.status(500).json({ error: `Error restarting server: ${error}` });
  }
});

export default router;
