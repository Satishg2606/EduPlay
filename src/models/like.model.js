import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    comment:{
        type:mongoose.Types.ObjectId,
        ref:"Comment"
    },
    video:{
        type:mongoose.Types.ObjectId,
        ref:"Video"
    },
    likedby:{
        type:mongoose.Types.ObjectId,
        ref:"User",
        required:true,
    },
    tweet:{
        type:mongoose.Types.ObjectId,
        ref:"Tweet"
    }
},{timestamps:true})

export const Like = mongoose.model("Like",likeSchema);