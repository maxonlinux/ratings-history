import { Router } from "express";
import apiRouter from "./api";
import adminRouter from "./admin";
import mainRouter from "./main";

const router = Router();

router.use("/", mainRouter);
router.use("/admin", adminRouter);
router.use("/api", apiRouter);

export default router;
