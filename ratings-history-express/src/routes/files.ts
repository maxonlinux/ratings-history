import { Request, Response, Router } from "express";
import fs from "fs/promises";
import path from "path";
import { FileMetaData } from "../types";
import { extractMetadataFromFile } from "../utils";
import { config } from "../config";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const getMetadata = async (files: string[]) => {
    const metadata: FileMetaData[] = [];

    for (const file of files) {
      const extension = path.extname(file).toLowerCase();

      if (extension !== ".csv") {
        continue;
      }

      const filePath = path.join(config.outDirPath, file);
      const data = await extractMetadataFromFile(filePath);

      metadata.push(data);
    }

    return metadata;
  };

  try {
    const files = await fs.readdir(config.outDirPath);
    const metadata = await getMetadata(files);

    res.json({ message: metadata });
  } catch (error) {
    res.status(500).json({ error: `Error retrieving file data: ${error}` });
  }
});

router.get("/:filename", async (req: Request, res: Response) => {
  const { filename } = req.params;
  const filePath = path.join(config.outDirPath, filename);

  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return res.status(404).json({ error: "File not found" });
    }

    const metadata = await extractMetadataFromFile(filePath);

    res.json({ message: metadata });
  } catch (error) {
    res.status(500).json({ error: `Error retrieving file data: ${error}` });
  }
});

router.put("/:filename", async (req: Request, res: Response) => {
  const { filename } = req.params;
  const { newName } = req.body;
  const filePath = path.join(config.outDirPath, filename);
  const newFilePath = path.join(config.outDirPath, newName);

  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return res.status(404).send("File not found");
    }

    await fs.rename(filePath, newFilePath);

    res.json({
      message: `File ${filename} renamed to ${newName} successfully`,
    });
  } catch (error) {
    res.status(500).json({ error: `Error renaming file: ${error}` });
  }
});

router.delete("/:filename", async (req: Request, res: Response) => {
  const { filename } = req.params;
  const filePath = path.join(config.outDirPath, filename);

  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return res.status(404).json({ error: "File not found" });
    }

    await fs.unlink(filePath);

    res.json({ message: `File ${filename} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: `Error deleting file: ${error}` });
  }
});

export default router;
