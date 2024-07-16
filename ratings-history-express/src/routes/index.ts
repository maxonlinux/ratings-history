import { Router } from "express";
import files from "../routes/files";
import agencies from "../routes/agencies";
import manual from "../routes/manual";

const router = Router();

router.use("/files", files);
router.use("/agencies", agencies);
router.use("/manual", manual);

export default router;
