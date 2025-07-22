import { upsertStreamUser } from "../lib/stream.js";
import User  from "../models/User.js"
import jwt from "jsonwebtoken"

export async function signup(req,res){
    try {
        const {email,password,fullName} = req.body;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if(!email||!password||!fullName){
            return res.status(400).json({message:"All fields are required."})
        }
        if(password.length<6){
            return res.status(400).json({message:"Password must be at least 6 characters."})
        }
        if(!emailRegex.test(email)){
            return res.status(400).json({message:"Enter valid email address."})
        }
        const existingUser = await User.findOne({email});
        if (existingUser){
            return res.status(400).json({message:"Email already exist, use different email."})
        }
        const randomNumber = Math.floor(Math.random() * 100) + 1;
        
        const profilePic = `https://avatar.iran.liara.run/public/${randomNumber}.png`;
        const newUser = await User.create({
            email:email.toLowerCase(),
            fullName:fullName.charAt(0).toUpperCase() + fullName.slice(1),
            password,
            profilePic
        })

        try {
            await upsertStreamUser({
            id:newUser._id.toString(),
            name:newUser.fullName,
            image:newUser.profilePic || ""
            })
            console.log(`Stream User upserted for ${newUser.email}`)
        } catch (error) {
            console.error("Error while calling the upsert function in signup controller:",error)
        }

        const token = jwt.sign({userId:newUser._id},process.env.JWT_SECRET,{expiresIn:"7d"})
        res.cookie("jwt",token,{
            maxAge:7*24*60*60*1000,
            httpOnly:true,
            sameSite:"strict",
            secure:process.env.NODE_ENV === "production" 
        })
        res.status(201).json({success:true,user:newUser});
        } catch (error) {
            console.log("Error in Signup Controller:",error)
            res.status(500).json({message:"Internal server error"});

        }
}

export async function login(req,res){
    try {
        const {email,password} = req.body;
        if(!email||!password){
            return res.status(400).json({message:"Both email and password are required."});
        }
        const user = await User.findOne({email});
        
        if(!user) return res.status(400).json({message:"Invalid user or password."});

        const isPasswordCorrect = await user.matchPassword(password);
        
        if(!isPasswordCorrect) return res.status(400).json({message:"Invalid user or password."});
        


        const token = jwt.sign({userId:user._id},process.env.JWT_SECRET,{expiresIn:"7d"})
        res.cookie("jwt",token,{
            maxAge:7*24*60*60*1000,
            httpOnly:true,
            sameSite:"strict",
            secure:process.env.NODE_ENV === "production" 
        })
        res.status(200).json({success:true,user})

    } catch (error) {
        console.log("Error in Login controller:",error)
        res.status(500).json({message:"Internal server error."})
    }
}

export  function logout(req,res){
    res.clearCookie("jwt")
    res.status(200).json({message:"Logout successfully."})
}

export async function onBoard(req,res){
    try {
        const user_Id = req.user._id;
        const {fullName, bio, nativeLanguage, learningLanguage, location} = req.body;
        if(!fullName || !bio || !nativeLanguage || !learningLanguage || !location){
            return res.status(400).json({message:"All fields are required.",missingFields:[
                !fullName && "fullName",
                !bio && "bio",
                !learningLanguage && "learningLanguage",
                !nativeLanguage && "nativeLanguage",
                !location && "location"
            ].filter(Boolean)
        })
        }
        const updatedUser = await User.findByIdAndUpdate(user_Id,{...req.body,isOnBoarded:true},{new:true});
        if(!updatedUser) return res.status(404).json({message:"User not found."});
        try {
            await upsertStreamUser({
                id:updatedUser._id,
                name:updatedUser.fullName,
                image:updatedUser.profilePic || "",
                language:nativeLanguage
            })
            console.log("Stream user updated on OnBoarding")
        } catch (error) {
            console.error("Error while upserting the stream user on onboarding:",error)
        }
        res.status(200).json({success:true,updatedUser})
    } catch (error) {
        
    }
}

