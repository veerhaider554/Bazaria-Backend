require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

// PORT setting for Cloud Deployment
const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

const startServer = async () => {
    try {
        /*
         * Database must be ready before
         * accepting API traffic.
         */
        await connectDB();

        // 0.0.0.0 is mandatory for cloud host binding
        const server = app.listen(PORT, "0.0.0.0", () => {
            console.log(`Bazaria API running on port ${PORT}`);
        });

        /*
        |--------------------------------------------------------------------------
        | Graceful Shutdown
        |--------------------------------------------------------------------------
        */

        const shutdown = async (signal) => {
            console.log(`${signal} received. Shutting down...`);

            server.close(async () => {
                console.log("HTTP server closed.");

                try {
                    const mongoose = require("mongoose");
                    await mongoose.connection.close();
                    console.log("MongoDB connection closed.");
                    process.exit(0);
                } catch (error) {
                    console.error("Shutdown error:", error.message);
                    process.exit(1);
                }
            });
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));

    } catch (error) {
        console.error("Bazaria startup failed:", error.message);
        process.exit(1);
    }
};

// Global Error Handlers to prevent crashes
process.on("unhandledRejection", (reason, promise) => {
    console.log("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
    console.log("Uncaught Exception:", err);
});

startServer();
