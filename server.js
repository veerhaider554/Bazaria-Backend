require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = Number(process.env.PORT) || 5000;


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


        const server = app.listen(PORT, () => {
            console.log(
                `Bazaria API running on port ${PORT}`
            );
        });


        /*
        |--------------------------------------------------------------------------
        | Graceful Shutdown
        |--------------------------------------------------------------------------
        */

        const shutdown = async (signal) => {
            console.log(
                `${signal} received. Shutting down...`
            );


            server.close(async () => {
                console.log(
                    "HTTP server closed."
                );


                try {
                    const mongoose = require("mongoose");

                    await mongoose.connection.close();

                    console.log(
                        "MongoDB connection closed."
                    );

                    process.exit(0);

                } catch (error) {
                    console.error(
                        "Shutdown error:",
                        error.message
                    );

                    process.exit(1);
                }
            });
        };


        process.on(
            "SIGINT",
            () => shutdown("SIGINT")
        );

        process.on(
            "SIGTERM",
            () => shutdown("SIGTERM")
        );

    } catch (error) {
        console.error(
            "Bazaria startup failed:",
            error.message
        );

        process.exit(1);
    }
};


startServer();