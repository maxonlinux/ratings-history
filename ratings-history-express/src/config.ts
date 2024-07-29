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

if (!process.env.SECRET) {
  throw new Error("No secret in .env");
}

if (!process.env.ORIGIN) {
  throw new Error("No origin (admin panel domain) in .env");
}

const config = {
  rootDirPath,
  outDirPath: process.env.OUT_DIR_PATH,
  tempDirPath: path.resolve(rootDirPath, process.env.TEMP_DIR_NAME),
  chromeExec: "browsers/Thorium.app/Contents/MacOS/Thorium",
  // debug: process.env.DEBUG === "true" ? true : false,
  secret: process.env.SECRET,
  allowedOrigins: [process.env.ORIGIN],
  adminCredentials: {
    login: process.env.ADMIN_PASSWORD,
    password: process.env.ADMIN_PASSWORD,
  },
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

export default config;
