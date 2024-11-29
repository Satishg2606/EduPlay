import mongoose, {isValidObjectId} from "mongoose"
import Fuse from 'fuse.js';
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteVideoFromCloudinary,uploadVideoOnCloudinary, deleteFileFromCloudinary} from "../utils/cloudinary.js"
import {extractPublicIdFromUrl} from "../utils/getPublicId.js"



const getAllVideos = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        query = "", 
        sortBy = 'createdAt', 
        sortType = 'desc', 
        userId 
    } = req.query;

    const skip = (page - 1) * limit;

    // Define sorting options
    const sortOptions = { [sortBy]: sortType === 'asc' ? 1 : -1 };

    // Define initial match filter (if userId is provided)
    const matchStage = userId ? { userId } : {};

    // Fetch videos from the database
    const allVideos = await Video.find(matchStage).sort(sortOptions).skip(skip).limit(parseInt(limit));

    // Fetch users data to join with videos
    const users = await User.find({}, { fullName: 1, username: 1, avatar: 1 }); // Fetch relevant user fields

    // Create a map for quick user lookup
    const userMap = {};
    users.forEach(user => {
        userMap[user._id] = user; // Map user IDs to user data
    });

    // If a query is provided, perform fuzzy search using Fuse.js
    let data = allVideos;
    if (query) {
        // Create a Fuse instance
        const fuse = new Fuse(allVideos, {
            keys: ['title', 'description'], // Specify searchable fields
            includeScore: true, // Include score for search relevance
            threshold: 0.3, // Adjust the threshold for fuzzy matching (0.0 = perfect match, 1.0 = no match)
        });

        // Perform the search
        const results = fuse.search(query);
        data = results.map(result => result.item); // Get the matched items
    }

    // Map user data to the video data
    const videosWithUsers = data.map(video => ({
        ...video.toObject(), // Convert Mongoose document to plain object
        user: userMap[video.owner], // Attach user data
    }));

    // Count total documents based on the search query or match stage
    const totalVideos = query 
        ? videosWithUsers.length // If searching, return the length of the results
        : await Video.countDocuments(matchStage);

    res.status(200).json(new ApiResponse(200, {
        videos: videosWithUsers,
        currentPage: page,
        totalPages: Math.ceil(totalVideos / limit),
        totalVideos
    }, "Retrieved videos successfully"));
});



const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body;
   
    // const {videoFile} = req.files?.videoFile[0]?.path;
    // const {thumbnail} = req.files?.thumbnail[0]?.path;
    if(!(title && description)){
        throw new ApiError(400,"All fields are neccesary")
    }
    let videoLocalPath;
    //  = req.files?.avatar[0]?.path;
    if (
      req.files &&
      Array.isArray(req.files?.videoFile) &&
      req.files?.videoFile?.length > 0
    ) {
        videoLocalPath = req.files?.videoFile[0]?.path;
    }

    console.log("\n videoFileLocalPath----------",videoLocalPath);

    let thumbnailLocalPath;
    //  = req.files?.avatar[0]?.path;
    if (
      req.files &&
      Array.isArray(req.files?.thumbnail) &&
      req.files?.thumbnail?.length > 0
    ) {
        thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    }
    console.log("\n Thumbnail----------",thumbnailLocalPath);

    if(!(videoLocalPath && thumbnailLocalPath)){
        throw new ApiError(400,"Video or thumbnail missing")
    }

    const video=await uploadVideoOnCloudinary(videoLocalPath,"video");
    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath);

    if(!(video && thumbnail))
    {
        throw new ApiError(500,"Problem while uploading files.");
    }
    console.log(video);
    const videoDoc= await Video.create({
        videoFile:video.url,
        thumbnail:thumbnail.url,
        owner:req.user._id,
        title:title,
        description:description,
        duration:video.duration,
        views:0,
        isPublished:0,
    })
    if(!videoDoc){
        new ApiError(500,"Unable to create Document of upload Details.");
    }

    return res.status(200).json(
        new ApiResponse(200,
            {
                uploadData:videoDoc
            },
            "Video Uploaded Successfully"
        )
    )
    // TODO: get video, upload to cloudinary, create video
})



const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId)
    {
        throw new ApiError(400,"VideoId requuired");
    }
    const video = await Video.findById(videoId);
    if(!video)
    {
        throw new ApiError(500,"Error fetching video");
    }

    return res.status(200).json(
        new ApiResponse(200,
            {
                video
            },
            "video Fetched Successfully"
        )
    );
})



const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title , description } = req.body;
    const thumbnail = req.file?.path;
    console.log(thumbnail);
    //TODO: update video details like title, description, thumbnail
    if( !(title || description || thumbnail))
    {
        throw new ApiError(400,"atleast One field required");
    }
    const video = await Video.findById(videoId);
    const prevThumbnail = video.thumbnail;
    console.log(video.thumbnail);
    if(title)
    {
        video.title=title;
    }
    if(description)
    {
        video.description=description;
    }
    if(thumbnail)
    {
        const newThumbnail=await uploadOnCloudinary(thumbnail);
        if(!newThumbnail)
        {
            throw new ApiError(500,"Problme in uploading thumbnail");
        }
        video.thumbnail=newThumbnail.url;
    }

    const newVideo=await video.save({validateBeforeSave:false});

    // console.log(newVideo);
    if(!newVideo){
        throw new ApiError(500,"Error while saving the video Details");
    }

    const public_id=extractPublicIdFromUrl(prevThumbnail);
    const deleteImage=await deleteFileFromCloudinary(public_id);
    console.log("-------",deleteImage)
    return res.status(200).json(
        new ApiResponse(200,
            {
                newVideo
            },
            "Update Action Successfully."
        )
    );
    
})



const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId){
        throw new ApiError(400,"Video Id required.");
    }

    const video = await Video.findById(videoId);
    const public_id=extractPublicIdFromUrl(video.videoFile);
    const cloudVideoDelete=await deleteVideoFromCloudinary(public_id);
    if(!cloudVideoDelete){
        console.log("prev Video Not removed from cloudinary.")
    }

    const deleteVideo=await Video.deleteOne({_id:videoId});

    if(!deleteVideo){
        throw new ApiError(400,"videoId Not found.");
    }
    return res.status(200).json(
        new ApiResponse(200,{
            
        },
    "Video Deleted Successfully.")
    )
})



const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const videoPublishStatus = await Video.findById(videoId).select("isPublished");
    if(!videoPublishStatus)
    {
        throw new ApiError(404,"Video Not Found.");
    }

    videoPublishStatus.isPublished=!videoPublishStatus.isPublished;
    videoPublishStatus.save({validateBeforeSave:false});
    console.log(videoPublishStatus);
    return res.status(200).json(
        new ApiResponse(200,
            {
                videoPublishStatus
            },
            "PublishStatus Toggled."
        )
    )
})



export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}