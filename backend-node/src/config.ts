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
  secret: process.env.SECRET,
  allowedOrigins: [process.env.ORIGIN],
  adminCredentials: {
    login: process.env.ADMIN_PASSWORD,
    password: process.env.ADMIN_PASSWORD,
  },
  agenciesMap: [
    "fitch-ratings",
    "egan-jones",
    "demotech-ratings",
    "japan-credit-ratings",
    "kroll-bond-ratings",
    "morning-star",
    "moodys-ratings",
  ],
};

export default config;
