import path from "path";
import dotenv from "dotenv";

dotenv.config();

const rootDirPath = process.cwd();

if (!process.env.OUT_DIR) {
  throw new Error("No out directory name in .env");
}

if (!process.env.TEMP_DIR) {
  throw new Error("No temp directory name in .env");
}

const config = {
  rootDirPath: process.cwd(),
  outDirPath: path.join(rootDirPath, process.env.OUT_DIR),
  tempDirPath: path.join(rootDirPath, process.env.TEMP_DIR),
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
