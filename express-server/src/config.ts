import path from "path";
import dotenv from "dotenv";

dotenv.config();

const rootDirPath = process.cwd();

if (!process.env.OUT_DIR_PATH) {
  throw new Error("No out directory path in .env");
}

if (!process.env.SECRET) {
  throw new Error("No secret in .env");
}

if (!process.env.AGENCY_FUNCTION_URL) {
  throw new Error("No agency function URL in .env");
}

if (
  !process.env.MAIL_USER ||
  !process.env.MAIL_PASS ||
  !process.env.MAIL_RECIPIENT
) {
  console.warn(
    "No mail credentials in .env! You will not be able to receive task reports"
  );
}

const config = {
  rootDirPath,
  outDirPath: process.env.OUT_DIR_PATH,
  tempDirPath: path.resolve(rootDirPath, "temp"),
  secret: process.env.SECRET,
  agencyFunctionUrl: process.env.AGENCY_FUNCTION_URL,
  adminCredentials: {
    login: process.env.ADMIN_PASSWORD,
    password: process.env.ADMIN_PASSWORD,
  },
  mailCredentials: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    recipient: process.env.MAIL_RECIPIENT,
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
