import mongoose from "mongoose";
import DB_Name from "../constant.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_Name}`
    );
    console.log(
      `[Database] Connected to MongoDB! Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error(
      "[Database Connection Failed]:",
      (error as any)?.message || error
    );
    process.exit(1);
  }
};

export default connectDB;
