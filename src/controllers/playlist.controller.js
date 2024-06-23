import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const {name, description} = req.body;
    const {userId} = req.user?._id;
    if(!(name && description)){
        throw new ApiError(400,"Missing details.");
    }
    const playlist = await Playlist.create({
        name:name,
        description:description,
        videos:[],
        owner:userId
    });
    if(!playlist){
        throw ApiError(500,"Error in creating playlist.");
    }
    return res.status(200).json(
        200,
        {
            playlist
        },
        "Playlist Created Successfully."
    );

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!userId){
        throw new ApiError(400,"Insufficient Data");
    }
    // const playlists = Playlist.find({owner:new mongoose.Types.ObjectId(userId)});
    
    const playlists = await Playlist.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videosList",
                pipeline:[
                    {
                        $project:{
                            title:1,
                            videoFile:1,
                            thumbnail:1,
                            description:1,
                            duration:1,
                            views:1,
                            isPublished:1,
                        }
                    }
                ]
            },
            
        },
        {
            $addFields:{
                videosList:"$videosList"
            }
        }
    ])
    if(!playlists){
        throw new ApiError(404,"Playlists not Found.");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                playlists
            },
            "Playlists Fetched successfully."
        )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    //      AlGORITHM
    //get playlist Id
    //Aggregate funtion for searching playlist and videos inside the playlist.
    //return playlist.

    if(!playlistId){
        throw new ApiError(400,"Id Missing");
    }
    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id:playlistId
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videosList",
                pipeline:[
                    {
                        $project:{
                            title:1,
                            videoFile:1,
                            thumbnail:1,
                            description:1,
                            duration:1,
                            views:1,
                            isPublished:1,
                        }
                    }
                ]
            },
            
        },
        {
            $addFields:{
                videosList:"$videosList"
            }
        }
    ]);
    console.log(playlist);
    if(!playlist){
        throw new ApiError(500,"Error while fetching playlist.");
    }

    return res.status(200).json(
        new ApiResponse(200,
            {
                playlist
            },
            "Playlist Fetched Successfull."
        )
    );
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!(playlistId && videoId)){
        throw new ApiError(400,"All fields are necccesary")
    }

    const playlist= await Playlist.findByIdAndUpdate(playlistId,
        {
            $push:videoId
        },
        {
            new:true
        }
    );

    if(!playlist){
        throw new ApiError(500,"Error while updating playlist.")
    }

    res.status(200).json(
        new ApiResponse(
            200,
            {
                playlist
            },
            "playlist video added to playlist successfully."
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!(playlistId && videoId)){
        throw new ApiError(400,"Missing required fields");
    }
    const playlist = await Playlist.findByIdAndUpdate(playlistId,
        { $pull: { videos: videoId } },
        { new: true, useFindAndModify: false }
    );
    if(!playlist){
        throw new ApiError(500,"error while removing video from playlist")
    }

    res.status(200).json(
        new ApiResponse(200,
            {
                playlist
            },
            "succesfully removed video from playlist"
        )
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!playlistId){
        throw  new ApiError(400,"Id required.")
    }

    const playlistDelete = Playlist.findByIdAndDelete(playlistId);
    if (!playlistDelete.value) {
        throw new ApiError(404,"Playlist not found.");
    }
    res.status(200).json(
        new ApiResponse(200,
            {
                playlistDelete
            },
            "Playlist deleted successfully."
        )
    )
  
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!playlistId){
        throw new ApiError(400,"Playlist Id Required.")
    }

    if(!(name || description)){
        throw new ApiError(400,"name or description required.");
    }

    const playlist = Playlist.findByIdAndUpdate(playlistId, 
        {
            $set:{
                name:name,
                description:description
            }
        }, 
        {
            new : true
        });
    
        if(!playlist){
            throw new ApiError(404,"Playlist not found.")
        }

        res.status(200).json(200,
            {
                playlist
            },
            "Playlist details updated successfully."
        )

    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}