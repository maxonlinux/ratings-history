import { Request, Response, Router } from "express";
import { upload } from "../middlewares/upload";
import { uploader } from "../services";
import path from "path";

const router = Router();

router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const filePath = path.resolve(req.file.path);

    try {
      await uploader.initiate(filePath);

      res.status(200).json({ message: "Initiated upload and processing" });
    } catch (error) {
      const err = error as any;
      res.status(500).json({ error: err.message ?? err });
    } finally {
    }
  }
);

router.post("/abort", async (req: Request, res: Response) => {
  try {
    await uploader.abort();

    res.status(200).json({ message: "Aborted" });
  } catch (error) {
    const err = error as any;
    res.status(500).json({ error: err.message ?? err });
  } finally {
  }
});

export default router;
