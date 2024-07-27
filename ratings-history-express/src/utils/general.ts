import fs from "fs/promises";
import path from "path";

const exists = async (pathToCheck: string) => {
  try {
    await fs.access(pathToCheck);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
};

const emptyFolder = async (folderPath: string) => {
  try {
    const files = await fs.readdir(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);

      await fs.rm(filePath, { recursive: true, force: true });
    }

    console.log(`The folder ${folderPath} has been emptied successfully.`);
  } catch (error) {
    throw new Error(`Error emptying folder ${folderPath}: ${error}`);
  }
};

export { exists, emptyFolder };
