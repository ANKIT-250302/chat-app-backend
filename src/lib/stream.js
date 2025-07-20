import {StreamChat} from "stream-chat"
import dotenv from "dotenv"

dotenv.config()

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_sk;

if(!apiKey|| !apiSecret){
    console.error("Stream API key and Secret is missing.");
}

const streamClient = StreamChat.getInstance(apiKey,apiSecret);

export const upsertStreamUser = async (userData)=>{
    try {
        await streamClient.upsertUsers([userData]);
        return userData;
    } catch (error) {
        console.error("Error in upserting the stream user",error);
    }
};



export const generateStreamToken = (userId)=>{
    try {
        //ensure user id is string
        const userIdStr = userId.toString();
        return streamClient.createToken(userIdStr);
    } catch (error) {
        console.log("Error in generating Stream token:",error);
    }
}