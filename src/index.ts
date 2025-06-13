import express from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { IdentifyRequestBody, IdentifyResponse } from "./types";
import routes from "./routes";

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/", routes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
