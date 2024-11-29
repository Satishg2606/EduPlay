import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video

    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    console.log("----------",page,limit)
    console.log("----------",videoId)
    if (!videoId) {
        throw new ApiError(400, "Video Id required.");
    }
    
    // Calculate the number of documents to skip based on the current page and limit
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "users",
                pipeline: [{
                    $project: {
                        fullName: 1,
                        username: 1,
                        avatar: 1,
                    }
                }]
            }
        },
        {
            $addFields: {
                owner: "$owner"
            }
        },
        {
            $project: {
                content: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        },
        {
            $skip: skip
        },
        {
            $limit: parseInt(limit)
        }
    ]);
    
    if(!comments){
        throw new ApiError(404,"comments not found");
    }   
    
    res.status(200).json(
        new ApiResponse(200,
            {
                comments
            },
            "Comments Fetched Successfully"
        )
    );
     
})
const getTweetComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { tweetId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (!tweetId) {
        throw new ApiError(400, "Video Id required.");
    }
    // Calculate the number of documents to skip based on the current page and limit
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const comments = await Comment.aggregate([
        {
            $match: {
                tweet: new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "users",
                pipeline: [{
                    $project: {
                        fullName: 1,
                        username: 1,
                        avatar: 1,
                    }
                }]
            }
        },
        {
            $addFields: {
                owner: "$owner"
            }
        },
        {
            $project: {
                content: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        },
        {
            $skip: skip
        },
        {
            $limit: parseInt(limit)
        }
    ]);
    
    if(!comments){
        throw new ApiError(404,"comments not found");
    }   
    
    res.status(200).json(
        new ApiResponse(200,
            {
                comments
            },
            "Comments Fetched Successfully"
        )
    );
     
})

const addCommentToVideo = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const userId= req.user._id;
    const {content} = req.body;

    if(!(videoId && content)){
        throw new ApiError(400,"Missing required details.")
    }
    const video = await Video.findById(videoId).select("title");
    const comment = await Comment.create({
        content:content,
        owner:userId,
        video:videoId
    });
    if(!video){
        throw new ApiError(404,"Video not Found");
    }
    if(!comment){
        throw new ApiError(500,"Comment not published.");
    }

    res.status(200).json(
        new ApiResponse(
            200,
            {
                comment
            },
            "Comment done Successfully."
        )
    )

    
})

const addCommentToTweet = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {tweetId} = req.params;
    const userId= req.user._id;
    const {content} = req.body;

    if(!(tweetId && content)){
        throw new ApiError(400,"Missing required details.")
    }
    const tweet = await Tweet.findById(tweetId);
    const comment = await Comment.create({
        content:content,
        owner:userId,
        tweet:tweetId
    });
    if(!tweet){
        throw new ApiError(404,"tweet not Found");
    }
    if(!comment){
        throw new ApiError(500,"Comment not published.");
    }

    res.status(200).json(
        new ApiResponse(200,
        {
            comment
        },
        "Comment done Successfully.")
    )

    
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const {commentId} = req.params;
    const { content } = req.body;
    if(!commentId){
        throw new ApiError(400,"comment id required");
    }

    const comment = await Comment.findByIdAndUpdate(commentId, {
        $set:{
            content:content
        }
    }, {new:true});

    if(!comment){
        throw new ApiError(404,"comment not found");
    }

    res.status(200).json(
        new ApiResponse(200,
        {
            comment
        },
        "Comment updated successfully.")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;
    if(!commentId){
        throw new ApiError(400,"Comment Id required");
    }

    const commentDelete = await Comment.findOneAndDelete({_id:commentId});
    if(!commentDelete){
        throw new ApiError(404,"comment not found");
    }
    res.status(200).json(
        new ApiResponse(200,
            {
                // commentDelete
            },
            "Deleted the comment successfully"
        )
    );
})

export {
    getVideoComments, 
    addCommentToVideo, 
    updateComment,
    deleteComment,
    addCommentToTweet,
    getTweetComments
    }