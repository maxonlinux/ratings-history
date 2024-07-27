import { Router } from "express";
import files from "./files";
import agencies from "./agencies";
import manual from "./manual";
import server from "./server";

const router = Router();

router.use("/files", files);
router.use("/agencies", agencies);
router.use("/manual", manual);
router.use("/server", server);

export default router;
