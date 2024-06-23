import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteVideoFromCloudinary,uploadVideoOnCloudinary} from "../utils/cloudinary.js"
import {extractPublicIdFromUrl} from "../utils/getPublicId.js"

//Pending...
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

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
    const {thumbnailLocalPath} = req.file?.path;
    //TODO: update video details like title, description, thumbnail
    if( !(title || description || thumbnail))
    {
        throw new ApiError(400,"atleast One field required");
    }
    const video = await Video.findById(videoId);
    const prevThumbnail = video.thumbnail;
    if(title)
    {
        video.title=title;
    }
    if(description)
    {
        video.description=description;
    }
    if(thumbnailLocalPath)
    {
        const newThumbnail=await uploadOnCloudinary(thumbnailLocalPath);
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

    const deleteVideo=await Video.deleteOne(videoId);

    if(!deleteVideo){
        throw new ApiError(400,"videoId Not found.");
    }
    return res.status.json(
        new ApiResponse(200,{
            deleteVideo
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