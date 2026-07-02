import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connection = await mongoose.connect("mongodb://localhost:27017/StyleBusters",); 
        console.log(`MongoDB connected ${connection.connection.host}`);
    } catch (error) {
        console.error("Error connecting MongoDB"); 
        process.exit(1); 
    }
};


export default connectDB; 