import jwt from "jsonwebtoken"
import User from "../models/User.js"


export const protectRoute = async (req,res,next)=>{
    try {
        const token  = req.cookies.jwt;
        if(!token) return res.status(400).json({message:"Unauthorized: Token not provided"});

        const decode = jwt.verify(token,process.env.JWT_SECRET);;
        const user = await User.findById(decode.userId).select('-password')
        if(!user) return res.status(401).json({message:"Unauthorized: Invalid token"});
        req.user = user
        next()
    } catch (error) {
        console.error("Error in ProtectRoute Middleware:",error)
    }
}