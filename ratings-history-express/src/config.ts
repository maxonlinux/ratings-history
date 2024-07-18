import path from "path";
import dotenv from "dotenv";

dotenv.config();

const rootDirPath = process.cwd();

if (!process.env.OUT_DIR_PATH) {
  throw new Error("No out directory path in .env");
}

if (!process.env.TEMP_DIR_NAME) {
  throw new Error("No temp directory name in .env");
}

const config = {
  rootDirPath: process.cwd(),
  outDirPath: process.env.OUT_DIR_PATH,
  tempDirPath: path.resolve(rootDirPath, process.env.TEMP_DIR_NAME),
  metadataFilePath: path.resolve(rootDirPath, "metadata.json"),
  credentials: {
    "kroll-bond-ratings": [
      process.env.KROLL_BOND_LOGIN,
      process.env.KROLL_BOND_PASS,
    ],
    "morning-star": [
      process.env.MORNING_STAR_LOGIN,
      process.env.MORNING_STAR_PASS,
    ],
    "moodys-ratings": [process.env.MOODYS_LOGIN, process.env.MOODYS_PASS],
    "ambest-ratings": [process.env.AMBEST_LOGIN, process.env.AMBEST_PASS],
  },
};

export { config };
