import path from "path";
import dotenv from "dotenv";

dotenv.config();

const rootDirPath = process.cwd();

if (!process.env.SECRET) {
  throw new Error("No secret in .env");
}

if (!process.env.ORIGIN) {
  throw new Error("No origin (admin panel domain) in .env");
}

if (!process.env.AGENCY_FUNCTION_URL) {
  throw new Error("No agency function URL in .env");
}

if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
  console.warn(
    "No mail credentials in .env! You will not be able to receive task reports"
  );
}

const config = {
  rootDirPath,
  outDirPath: path.resolve(rootDirPath, "public"),
  tempDirPath: path.resolve(rootDirPath, "temp"),
  secret: process.env.SECRET,
  agencyFunctionUrl: process.env.AGENCY_FUNCTION_URL,
  allowedOrigins: [process.env.ORIGIN],
  adminCredentials: {
    login: process.env.ADMIN_PASSWORD,
    password: process.env.ADMIN_PASSWORD,
  },
  mailCredentials: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
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
