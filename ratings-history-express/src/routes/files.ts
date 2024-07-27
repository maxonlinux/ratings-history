import { Request, Response, Router } from "express";
import { filer } from "../services";
import { FileMetadata } from "../types";

const router = Router();

function compareMetadata(a: FileMetadata, b: FileMetadata) {
  const dateA = a.name.split(" ")[0];
  const dateB = b.name.split(" ")[0];

  // Compare dates first (latest date first)
  if (dateA > dateB) return -1;
  if (dateA < dateB) return 1;

  return a.name.localeCompare(b.name);
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const metadata = await filer.get();
    const sortedMetadata = metadata.sort(compareMetadata);

    res.json({ message: sortedMetadata });
  } catch (error) {
    res.status(500).json({ error: `Error retrieving file data: ${error}` });
  }
});

router.get("/:filename", async (req: Request, res: Response) => {
  const { filename } = req.params;

  try {
    const metadata = await filer.get(filename);

    if (!metadata) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    res.json({ message: metadata });
  } catch (error) {
    res.status(500).json({ error: `Error retrieving file data: ${error}` });
  }
});

router.put("/:filename", async (req: Request, res: Response) => {
  const { filename } = req.params;
  const { newName } = req.body;

  try {
    const renamedFile = await filer.rename(filename, newName);

    if (!renamedFile) {
      res.status(404).send("File not found");
      return;
    }

    res.json({
      message: `File ${filename} renamed to ${newName} successfully`,
    });
  } catch (error) {
    res.status(500).json({ error: `Error renaming file: ${error}` });
  }
});

router.delete("/:filename", async (req: Request, res: Response) => {
  const { filename } = req.params;

  try {
    const deletedFile = await filer.delete(filename);

    if (!deletedFile) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    res.json({ message: `File ${filename} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: `Error deleting file: ${error}` });
  }
});

export default router;
