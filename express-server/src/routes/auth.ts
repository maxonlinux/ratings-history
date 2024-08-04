import { Router } from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import config from "../config";

const router = Router();

router.use(cookieParser());

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === config.adminCredentials.login &&
    password === config.adminCredentials.password
  ) {
    const token = jwt.sign({ username }, config.secret, { expiresIn: "24h" });

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.json({ message: "Login successful" });
  }

  res.status(401).json({ error: "Invalid credentials" });
});

router.post("/logout", (_req, res) => {
  res.clearCookie("authToken");
  res.json({ message: "Logged out" });
});

router.get("/whoami", (_req, res) => {
  res.json({ message: "Authenticated" });
});

export default router;
