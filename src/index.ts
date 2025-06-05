import express from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { IdentifyRequestBody, IdentifyResponse } from "./types";

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.post("/identify", (async (req, res) => {
  const { email, phoneNumber } = req.body as IdentifyRequestBody;

  if (!email && !phoneNumber) {
    return res.status(400).json({
      error: "At least one of email or phoneNumber is required",
    });
  }

  // TODO: Implement identity reconciliation logic
  const response: IdentifyResponse = {
    contact: {
      primaryContactId: 1,
      emails: [],
      phoneNumbers: [],
      secondaryContactIds: [],
    },
  };

  res.status(200).json(response);
}) as express.RequestHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
