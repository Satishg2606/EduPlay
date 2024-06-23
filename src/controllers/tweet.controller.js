
import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    const { _id:userId } = req.user;
    console.log(content,"   ",userId);
    
    if( !(userId || content) ){
        throw new ApiError(400,"Insufficient Data");
    }
    const tweet = await Tweet.create({ content: content , owner: userId });
    if(!tweet)
    {
        throw new ApiError(500,"tweet Not posted");
    }

    return res.status(200).json(
        new ApiResponse(200,
            {
                tweet
            },
            "Tweet Posted Successfully"
        )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    const user= await User.findById(userId).select("fullName username avatar coverImage")
    const tweets = await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project:{
                _id : 1,
                content:1,
                createdAt:1,
                updatedAt:1
            }
        },
        {
            $addFields:{
                username:"$user.username",
                avatar:"$user.avatar",
                coverImage:'$user.coverImage',
                fullName:"$user.fullName"
            }
        }
    ])
    console.log(tweets);
    if(!tweets){
        throw new ApiError(404,"Tweets Not Found");
    }
    return res.status(200).json(
        new ApiResponse(200,
            {
                tweets,
            },
            "Tweets fetched Successfully."
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params;
    const { updatedContent } = req.body
    const { userId } = req.user._id

    if(!(tweetId && updatedContent)){
        throw new ApiError(401,"All fields required.")
    }
    const updatedTweet= await Tweet.findByIdAndUpdate(tweetId,
        {content:updatedContent},
        {new:true});
    
    if(!updatedTweet){
        throw new ApiError(500,"Unable to update tweet");
    }

    return res.status(200).json(
        new ApiResponse(200,
            {
                tweet:updatedContent
            },
            "Updated Successfully"
        )
    );

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId:_id} = req.params;
    if(!_id){
        throw new ApiError(401,"Tweet Id required.")
    }
    const deleteTweet=await Tweet.deleteOne({_id:new mongoose.Types.ObjectId(_id)});
    if(!(deleteTweet))
    {
        new ApiError(400,"unable to delete tweet");
    }
    res.status(200).json(
        new ApiResponse(200,{
            
        },"Tweet Deleted Succesfully"
        ),    
    );
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}