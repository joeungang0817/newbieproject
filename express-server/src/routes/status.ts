import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ isOnline: true });
});

export default router;