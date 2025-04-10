import { connect, ConnectOptions } from "mongoose";
const MONGODB_URL = "mongodb://localhost:27017";

export const dbConnect = () => {
    connect(MONGODB_URL).then(
        () => {
            console.log("Database connected successfully");
        },
        (error) => {
            console.error("Database connection failed");
            console.error(error);
        }
    )
}