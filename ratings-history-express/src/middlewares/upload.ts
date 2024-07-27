import multer from "multer";
import path from "path";
import config from "../config";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.tempDirPath);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${performance.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/zip") {
      cb(null, true);
    } else {
      cb(new Error("Only ZIP files are allowed"));
    }
  },
});

export default upload;
