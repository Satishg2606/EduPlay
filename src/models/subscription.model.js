import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber:{
        type:mongoose.Types.ObjectId,
        ref :"User",
    },
    channel:{
        type:mongoose.Types.ObjectId,
        ref : "User",
        required:true
    }
},{timestamps:true});

export const Subscription =  mongoose.model("Subscription",subscriptionSchema);