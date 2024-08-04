import express, { Router, Request, Response } from "express";
import path from "path";

const router = Router();

const adminPanelPath = "../../../admin-panel/dist";

router.use(express.static(path.join(__dirname, adminPanelPath)));

router.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, adminPanelPath, "index.html"));
});

export default router;
