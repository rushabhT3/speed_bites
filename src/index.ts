import express from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
const prisma = new PrismaClient();
app.use(express.json());

app.post("/identify", async (req, res) => {
  // TODO: Implement identify logic
});

app.listen(3000, () => console.log(`Server running on port ${PORT}`));
