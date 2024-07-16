import multer from "multer";
import path from "path";
import { config } from "../config";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.tempDirPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${performance.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/zip") {
      cb(null, true);
    } else {
      cb(new Error("Only ZIP files are allowed"));
    }
  },
});

export { upload };
