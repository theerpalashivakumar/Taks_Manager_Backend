// // // const app = require("../src/app");
// // // module.exports = app;
// // const mongoose = require("mongoose");
// // const app = require("../src/app");

// // let cached = global._mongoose;
// // if (!cached) cached = global._mongoose = { conn: null, promise: null };

// // async function connectDB() {
// //     if (cached.conn) return cached.conn;
// //     if (!cached.promise) {
// //         cached.promise = mongoose.connect(process.env.MONGODB_URI, {
// //             serverSelectionTimeoutMS: 8000,
// //             bufferCommands: false,
// //         });
// //     }
// //     try {
// //         cached.conn = await cached.promise;
// //     } catch (err) {
// //         cached.promise = null;
// //         throw err;
// //     }
// //     return cached.conn;
// // }

// // module.exports = async (req, res) => {
// //     try {
// //         await connectDB();
// //     } catch (err) {
// //         console.error("MongoDB connection failed:", err.message);
// //         return res.status(500).json({
// //             success: false,
// //             message: "Database connection failed",
// //         });
// //     }
// //     return app(req, res);
// // };

// const mongoose = require("mongoose");
// const app = require("../src/app");

// let cached = global._mongoose;
// if (!cached) cached = global._mongoose = { conn: null, promise: null };

// async function connectDB() {
//     if (cached.conn) return cached.conn;
//     if (!cached.promise) {
//         cached.promise = mongoose.connect(process.env.MONGODB_URI, {
//             serverSelectionTimeoutMS: 8000,
//             bufferCommands: false,
//         });
//     }
//     try {
//         cached.conn = await cached.promise;
//     } catch (err) {
//         cached.promise = null;
//         throw err;
//     }
//     return cached.conn;
// }

// module.exports = async (req, res) => {
//     try {
//         await connectDB();
//     } catch (err) {
//         console.error("MongoDB connection failed:", err.message);
//         return res.status(500).json({ success: false, message: "Database connection failed" });
//     }
//     return app(req, res);
// };
module.exports = async (req, res) => {
    try {
        await connectDB();
    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
        res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        return res.status(500).json({
            success: false,
            message: "Database connection failed",
            reason: err.message,
        });
    }
    return app(req, res);
};