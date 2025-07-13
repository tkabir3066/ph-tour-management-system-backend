/* eslint-disable no-console */
import mongoose from "mongoose";
import { Server } from "http";
import app from "./app";
import { envVars } from "./app/config/env";

let server: Server;

const startServer = async () => {
  try {
    await mongoose.connect(envVars.DB_URL);

    console.log("Connected to database successfully");

    server = app.listen(envVars.PORT, () => {
      console.log(`App is running on port: ${envVars.PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();

/*
 *Unhandled rejection error
 *Uncaught exception error
 *Signal termination or sigterm error
 */

process.on("SIGTERM", () => {
  console.log("SIGTERM Signal received...server shutting down..");
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }

  process.exit(1);
});
process.on("SIGINT", () => {
  console.log("SIGINT Signal received...server shutting down..");
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }

  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.log("Unhandled rejection detected...server shutting down..", err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }

  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.log("Uncaught exception detected...server shutting down..", err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }

  process.exit(1);
});

// --- Unhandled rejection error ---//
// Promise.reject(new Error("I forgot to catch this promise"));
// --- Uncaught exception error ---//
// throw new Error("I forgot to handle to this local error");
