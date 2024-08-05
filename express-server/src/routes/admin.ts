import express, { Router, Request, Response } from "express";
import path from "path";

const router = Router();

const adminPanelPath = path.resolve(__dirname, "../../dist-admin");

router.use(express.static(adminPanelPath));

router.get(["/", "/index.html"], (_req: Request, res: Response) => {
  res.sendFile(path.join(adminPanelPath, "index.html"));
});

export default router;
