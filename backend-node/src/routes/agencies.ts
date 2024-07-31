import { Request, Response, Router } from "express";
import { downloader } from "../services";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const agencies = downloader.getAgencies();

    res.status(200).json({ message: agencies });
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : error });
  }
});

router.post("/download/:agencyName", async (req: Request, res: Response) => {
  const { agencyName } = req.params;

  try {
    downloader.initiate(agencyName);

    res.status(200).json({ message: `Download initiated for ${agencyName}` });
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : error });
  }
});

router.post("/abort/:agencyName", async (req: Request, res: Response) => {
  const { agencyName } = req.params;

  try {
    downloader.abort(agencyName);

    res.status(200).json({ message: `Aborted ${agencyName}` });
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : error });
  }
});

export default router;
