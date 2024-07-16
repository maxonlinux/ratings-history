import path from "path";

const rootDirPath = process.cwd();

const config = {
  rootDirPath: process.cwd(),
  outDirPath: path.join(rootDirPath, process.env.OUT_DIR || "out"),
  tempDirPath: path.join(rootDirPath, process.env.TEMP_DIR || "temp"),
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
