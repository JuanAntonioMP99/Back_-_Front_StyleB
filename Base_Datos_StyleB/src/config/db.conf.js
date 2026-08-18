import mongoose from "mongoose";
import env from "./env.js";

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(env.mongodbUri);
    console.log(`MongoDB connected ${connection.connection.host}`);
  } catch (error) {
    console.error("Error connecting MongoDB");
    process.exit(1);
  }
};

export default connectDB; 