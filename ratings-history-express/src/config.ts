import path from "path";

const rootDirPath = process.cwd();

const config = {
  rootDirPath: process.cwd(),
  outDirPath: path.join(rootDirPath, process.env.OUT_DIR || "out"),
  tempDirPath: path.join(rootDirPath, process.env.TEMP_DIR || "temp"),
};

export { config };
