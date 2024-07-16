import { Request, Response, Router } from "express";
import { downloader } from "../services";
import { agenciesFunctionsMap } from "../agencies";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const agencies = Object.keys(agenciesFunctionsMap);

    res.status(200).json({ message: agencies });
  } catch (error) {
    const err = error as any;
    res.status(500).json({ error: err.message ? err.message : err });
  }
});

router.post("/download/:agencyName", async (req: Request, res: Response) => {
  const { agencyName } = req.params;

  try {
    await downloader.initiate(agencyName);

    res.status(200).json({ message: "Download initiated for " + agencyName });
  } catch (error) {
    const err = error as any;
    res.status(500).json({ error: err.message ? err.message : err });
  }
});

router.post("/abort/:agencyName", async (req: Request, res: Response) => {
  const { agencyName } = req.params;

  try {
    await downloader.abort(agencyName);

    res.status(200).json({ message: "Aborted " + agencyName });
  } catch (error) {
    const err = error as any;
    res.status(500).json({ error: err.message ? err.message : err });
  }
});

export default router;
