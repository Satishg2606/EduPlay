import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
export const verifyJWT=asyncHandler(async(req, _,next)=>{
    try {
        // console.log("----",req.body);
        const token=await req.cookies?.accessToken || req.header("Authorization")?.replace("bearer ","");
        if(!token)
        {
            new ApiError(401,"unAuthorized Access")
        }
        const decodedToken=await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken");
        if(!user)
        {
            new ApiError(401,"Invalid AccessToken");
        }
        req.user=user;
        next();
    } catch (error) {
        throw new ApiError(401,error?.message||"Invalid Acess Token");
    }

});