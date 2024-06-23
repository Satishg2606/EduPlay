import mongoose from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription
    // check if doc with subscriber === userId && channel = channelId exists.
    // if(flag is true){
    // delete the document with the following filter 
    //      - subscriber === userId && channel = channelId  }
    // else{
    //  create a document with :  
    //      subscriber = userId , channel = channelId}
            
    const {channelId} = req.params
    const {_id:userId} = req.user;
    console.log(userId)
    if( !userId ){
        throw new ApiError(401,"Insufficient data.")
    }
    const isSubscribed = await Subscription.exists({ subscriber: new mongoose.Types.ObjectId(userId), channel: new mongoose.Types.ObjectId(channelId) });
    if(isSubscribed){
        try {
            const remove = await Subscription.deleteOne({ subscriber: userId, channel: channelId });
            if (remove.deletedCount > 0) {
                res.status(200).json(new ApiResponse(200,
                    {
                        isSubscribed:false,
                    },
                    "Unsubscibed SucessFull."
                ));
            } else {
                res.status(500).json(new ApiResponse(
                404,
                message="Unsubscribed Failed"
                ));
            }
        } catch (error) {
            throw new ApiError(500,"Unsubscribe action failed");
            // Handle the error, e.g., by sending an error response
        }
    }else{
        try{
           const newSubscribe = await Subscription.create({ subscriber: userId, channel: channelId });
           if(newSubscribe){
            res.status(200).json(
                new ApiResponse(200,
                    {
                        isSubscribed:true,
                    },
                    "Subscribed SuccesFully"
                )
            )
           }else{
            res.status(500).json(
                new ApiResponse(500,
                    {
                        isSubscribed:true,
                    },
                    "Subscribe Failed."
                )
            )
           }
        }catch(error)
        {
            throw new ApiError(500,"Unable to perform Unsubcribe action.");
        }

    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId:channelId} = req.params
    // if(channelId !== req.user._id){
    //     throw new ApiError()
    // }
    console.log(new mongoose.Types.ObjectId(channelId))
    const channelSubscribers=await Subscription.aggregate([
        {
            $match:{ channel:new mongoose.Types.ObjectId(channelId) }
        },//we will get multiple docs with channel field having channelId.
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as :" subscriberDetails",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            email:1,
                            avatar:1,
                            coverImage:1
                        }
                    }
                ]
            }
        },
        
    ]);
    console.log(channelSubscribers)
    if(!channelSubscribers?.length){
        throw new ApiError(400,"No Subscribers found");
    }
    console.log(channelSubscribers)
    return res.status(200).json(
        new ApiResponse(200,
            {
                Subscribers:channelSubscribers
            },
            "Subscribers Fetched Successfully"
        )
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId:subscriberId } = req.params

    const subscribedChannels=await Subscription.aggregate([
        {
            $match:{ subscriber:new mongoose.Types.ObjectId(subscriberId) }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as :"subscribedChannels",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1,
                            coverImage:1
                        }
                    }
                ]
            }
        },
        {
            $project:{
                subscribedChannels:1
            }
        }
        
    ]);
    if(!subscribedChannels?.length){
        throw new ApiError(400,"No Channels found");
    }
    console.log(subscribedChannels)
    return res.status(200).json(
        new ApiResponse(200,
            {
                channelsSubscribed:subscribedChannels
            },
            "Subscribed Channels Fetched Successfully"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}