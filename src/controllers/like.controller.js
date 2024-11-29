import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const userId = req.user?._id
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
    }

    try {
        const existingLike = await Like.findOne({ video: videoId, likedby: userId });

        if (existingLike) {
            // If the like exists, remove it (unlike)
            await Like.findByIdAndDelete(existingLike._id);
            return res.status(200).json(
                new ApiResponse(200,
                    {},
                    "Video unliked successfully" 
                )    
            );
        } else {
            // If the like does not exist, add a new like
            const newLike = new Like({
                video: videoId,
                likedby: userId
            });

            await newLike.save();
            return res.status(200).json(
                new ApiResponse(200,
                    {
                        newLike
                    },
                    "Video liked successfully" 
                )    
            );        }
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const userId = req.user._id
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({ message: "Invalid video ID" });
    }

    try {
        const existingLike = await Like.findOne({ comment: commentId, likedby: userId });

        if (existingLike) {
            // If the like exists, remove it (unlike)
            await Like.findByIdAndDelete(existingLike._id);
            return res.status(200).json(
                new ApiResponse(200,
                    {},
                    "Comment unliked successfully" 
                )    
            );
        } else {
            // If the like does not exist, add a new like
            const newLike = new Like({
                comment: commentId,
                likedby: userId
            });

            await newLike.save();
            return res.status(200).json(
                new ApiResponse(200,
                    {
                        newLike
                    },
                    "Comment liked successfully" 
                )    
            );        }
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId = req.user._id
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        return res.status(400).json({ message: "Invalid video ID" });
    }

    try {
        const existingLike = await Like.findOne({ tweet: tweetId, likedby: userId });

        if (existingLike) {
            // If the like exists, remove it (unlike)
            await Like.findByIdAndDelete(existingLike._id);
            return res.status(200).json(
                new ApiResponse(200,
                    {},
                    "tweet unliked successfully" 
                )    
            );
        } else {
            // If the like does not exist, add a new like
            const newLike = new Like({
                tweet: tweetId,
                likedby: userId
            });

            await newLike.save();
            return res.status(200).json(
                new ApiResponse(200,
                    {
                        newLike
                    },
                    "tweet liked successfully" 
                )    
            );        }
    } catch (error) {
        return new ApiError(500,"Something went wrong")
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id;
    try {
    
        const likedVideos = await Like.aggregate([
            {
                $match:{
                    video:{ $ne: null } 
                }
            },
            {
                $match:{
                    likedby : userId
                }
            },
            {
                $lookup:{
                    from:"videos",
                    localField:"video",
                    foreignField:"_id",
                    as:"videos",
                    pipeline:[
                        {
                            $project:{
                                title:1,
                                videoFile:1,
                                thumbnail:1,
                                duration:1,
                                views:1,
                                owner:1,
                            }
                        }
                    ]
                }
            },
            {
                $project:{
                    videos:1,
                }
            }
        ])
        if(!likedVideos){
            throw new ApiError(404,"No liked Videos found.");
        }

        res.status(200).json(
            new ApiResponse(200,
                {
                    likedVideos
                },
                "Liked videos fetched successfully."
            )
        )
    } catch (error) {
    
}
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}