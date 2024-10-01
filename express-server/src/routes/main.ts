import { Router, Request, Response } from "express";
import { filer } from "../services";
import { compareMetadata } from "../utils/general";
import config from "../config";

const router = Router();

router.get(["/", "/index.html"], async (_req: Request, res: Response) => {
  try {
    const metadata = await filer.get();
    const sortedMetadata = metadata.sort(compareMetadata);
    const publicDirUrl = config.publicDirUrl;

    res.render("index", {
      files: sortedMetadata,
      publicDirUrl,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
