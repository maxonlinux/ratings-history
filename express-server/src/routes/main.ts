import { Router, Request, Response } from "express";
import { filer } from "../services";
import { compareMetadata } from "../utils/general";

const router = Router();

router.get(["/", "/index.html"], async (_req: Request, res: Response) => {
  try {
    const metadata = await filer.get();
    const sortedMetadata = metadata.sort(compareMetadata);

    res.render("index", {
      files: sortedMetadata,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
