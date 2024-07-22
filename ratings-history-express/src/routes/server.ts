import { Request, Response, Router } from "express";

const router = Router();

router.post("/restart", async (req: Request, res: Response) => {
  try {
    console.log("SERVER RESTART!");
    res.json({ message: "Restarting server..." });
    process.kill(process.pid, "SIGUSR2");
  } catch (error) {
    res.status(500).json({ error: `Error restarting server: ${error}` });
  }
});

export default router;
