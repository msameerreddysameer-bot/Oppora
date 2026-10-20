import express from "express";
import cors from "cors";
import cookieParser from "cookie-Parser";
import mongoose from "mongoose";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// ==========================================
// Database Health Check Endpoint
// ==========================================
app.get("/health/db", async (req, res) => {
  try {
    // Check whether Mongoose is connected
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return res.status(503).json({
        status: "error",
        database: "disconnected",
      });
    }

    // Send a lightweight ping to MongoDB
    await mongoose.connection.db.admin().ping();

    return res.status(200).json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    // Log details on the server, not in the public response
    console.error("Database health check failed:", error?.message);

    return res.status(503).json({
      status: "error",
      database: "unavailable",
    });
  }
});

import authRouter from "./auth/auth.routes.ts";
import userRouter from "./user/user.routes.ts";
import opportunityRouter from "./opportunity/opportunity.routes.ts";
import savedOpportunitiesRouter from "./saved Opportunity/saved opportunity routes.ts";
import applicationRouter from "./application/application routes.ts";

import { errorHandler } from "./utils/error.middleware.ts";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/opportunity", opportunityRouter);
app.use("/api/v1/saved-opportunities", savedOpportunitiesRouter);
app.use("/api/v1/application", applicationRouter);

// Global error handling middleware (must be after all routes)
app.use(errorHandler);

export default app;
