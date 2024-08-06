import { exec } from "child_process";
import { Request, Response, Router } from "express";
import config from "../config";

const router = Router();

router.post("/restart", async (_req: Request, res: Response) => {
  try {
    if (config.isAzure) {
      res.status(400).json({
        error: `App is deployed to Azure Web App. Please restart through the Azure panel`,
      });

      return;
    }

    console.log("SERVER RESTART!");
    res.json({ message: "Restarting server..." });
    exec("npm run restart");
  } catch (error) {
    res.status(500).json({ error: `Error restarting server: ${error}` });
  }
});

export default router;
