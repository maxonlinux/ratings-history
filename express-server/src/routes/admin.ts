import express, { Router } from "express";
import path from "path";

const router = Router();

const adminPanelPath = path.resolve(__dirname, "../../dist-admin");

router.use("/", express.static(adminPanelPath));

export default router;
