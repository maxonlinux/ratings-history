import { Request, Response, Router } from "express";
import path from "path";
import upload from "../middlewares/upload";
import { uploader } from "../services";

const router = Router();

router.post(
  "/upload",
  upload.array("files"),
  async (req: Request, res: Response) => {
    const filesArray = req.files as Express.Multer.File[];

    if (!filesArray.length) {
      res.status(400).send("No file uploaded");
      return;
    }

    try {
      const fliePromises = filesArray.map(async (file) => {
        const filePath = path.resolve(file.path);
        await uploader.initiate(filePath);
      });

      await Promise.all(fliePromises);

      res.status(200).json({ message: "Initiated upload and processing" });
    } catch (error) {
      res
        .status(500)
        .json({ error: error instanceof Error ? error.message : error });
    }
  }
);

router.post("/abort", async (_req: Request, res: Response) => {
  try {
    uploader.abort();

    res.status(200).json({ message: "Aborted" });
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : error });
  }
});

export default router;
