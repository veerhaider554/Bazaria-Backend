require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

// کلاؤڈ پورٹ کو درست طریقے سے حاصل کرنا
const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| START SERVER FIRST (To pass Abasthan port check)
|--------------------------------------------------------------------------
*/

// 1. سرور کو پہلے ہوسٹ 0.0.0.0 پر شروع کریں
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bazaria API is running on port ${PORT}`);
    
    // 2. سرور چلنے کے بعد ڈیٹا بیس کنیکٹ کریں
    connectDB()
        .then(() => console.log("Database connected successfully!"))
        .catch((err) => console.error("Database connection failed:", err.message));
});

/*
|--------------------------------------------------------------------------
| Graceful Shutdown & Error Handlers
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

// Global error handling to stop crashes
process.on("unhandledRejection", (reason, promise) => {
    console.log("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
    console.log("Uncaught Exception:", err);
});
