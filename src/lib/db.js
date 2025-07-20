import mongoose from "mongoose"

export const connectDB = async () =>{
    try {
        const conn = await mongoose.connect(process.env.MONGOURI);
        // console.log(`Monogo DB connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(`Error connecting MonogoDB: ${error}`);
    }
}