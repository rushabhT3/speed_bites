import { Router } from "express";
import { IdentifyController } from "../controllers/IdentifyController";

const router = Router();
const indentifyController = new IdentifyController();

router.post("/identity", (req, res) => {
  indentifyController.identify(req, res);
});

router.get("/try", (req, res) => {
  res.send("working 💯!");
});

export default router;
