import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import multer from "multer";
import { deleteFileFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { json } from "express";
import mongoose from "mongoose";
import { sendOTP } from "./otp.controller.js";
import authRouter from "../routes/auth.router.js";
import { OTP } from "../models/otp.model.js";

const generateAccessAndRefreshToken = async (UserId) => {
  try {
    const user = await User.findById(UserId);
    const AccessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { AccessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
};

function extractPublicIdFromUrl(url1) {
  // Convert URL to string to avoid type errors
  const urlString = String(url1);
  console.log(url1)
  // Cloudinary URLs typically have this format: 
  // https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<public_id>.<extension>
  const matches = urlString.match(/\/(?:v\d+\/)?([^\/]+)\.\w+$/);
  console.log("match",matches)
  return matches ? matches[1] : null;
}

const registerUser = asyncHandler(async (req, res) => {
  /* Algorithm for registration of user*/
  //get data from user
  //validation - not empty
  //check if user already exists
  //check for images,avatar
  //upload on cloudinary -> check if uploaded correctly
  //create user object  - Create entry in db
  //remove password and refreshToken field from response
  //check for user creation
  //return response

  const { fullName, email, username, password , otp } = req.body;
  // console.log(req.body);

  if (
    [username, password, email, fullName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const otpEntry = await OTP.findOne({ email, otp });
  if (!otpEntry) {
    return res.status(400).json({ message: "Invalid or expired OTP." });
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User Already Existed");
  }
  let avatarLocalPath;
  //  = req.files?.avatar[0]?.path;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "No Avatar File");
  }
  // const coverImagelocalPath = req.files?.coverImage[0]?.path;
  let coverImagelocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagelocalPath = req.files.coverImage[0].path;
  }

  const avatarImage = await uploadOnCloudinary(avatarLocalPath);
  let coverImage;
  if (coverImagelocalPath != null) {
    coverImage = await uploadOnCloudinary(coverImagelocalPath);
  }
  // console.log(avatarImage);
  if (!avatarImage) {
    throw new ApiError(500, "Image could not upload properly.");
  }
  // const result = await sendOTP({email});
  // console.log(result);
  const userData = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatarImage.url,
    coverImage: coverImage.url || "",
  });
  const resData = await User.findById(userData._id).select(
    "-password -refreshToken"
  );
  if (!userData) {
    console.log("error");
    throw new ApiError(500, "Unable to create account");
  }
  res
    .status(200)
    .json(new ApiResponse(200, userData, "User Created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //get user credentials
  //validate credentials
  //match password
  //generate AccessToken and refreshToken
  //send user data in response

  const { email, username, password } = req.body;
  console.log(req.body);
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // Here is an alternative of above code based on logic discussed in video:
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")

  // }

  let user = await User.findOne({
    $or: [{ username }, { email }],
  }).select("-refreshToken")

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isValid = user.isPasswordCorrect(password);

  if (!isValid) {
    throw new ApiError(404, "Invalid credentials");
  }

  
  const { AccessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .cookie("AccessToken", AccessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          userData: user,
          AccessToken: AccessToken,
          refreshToken: refreshToken,
        },
        "Sucessfully Login"
      )
    );
});

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("AccessToken", options)
    .json(new ApiResponse(200, {}, "Logged Out Succesfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const userRefreshToken =
    (await req.cookies?.refreshToken) || req.body.refreshToken;
  if (!userRefreshToken) {
    throw new ApiError(401, "No refresh Token");
  }
  try {
    const decodedToken = await jwt.verify(
      userRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "Unauthorized Request");
    }

    if (userRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token expired or used");
    }

    const { AccessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    const options = {
      httpOnly: true,
      secure: true,
    };
    res
      .status(200)
      .cookie("AccessToken", AccessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            AccessToken,
            refreshToken: newRefreshToken,
          },
          "Token updated Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const getCurrentUser = asyncHandler(async(req,res)=>{
  const user=req.user;
  if(!user)
  {
    throw new ApiError(400,"user Not Found");
  }
  res.status(200)
  .json(
    new ApiResponse(200,
      {
        userData:req.user
      },
      "Current User Data"
    )
  )
})

const updatePassword = asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword} = req.body;

  if([oldPassword,newPassword].some((field)=>field?.trim() === "")){
    throw new ApiError(401,"fields are required");
  };

  const user=await User.findOne(req.user._id);

  const valid=user.isPasswordCorrect(oldPassword);
  
  if(!valid){
    throw new ApiError(401,"Incorrect password");
  }

  user.password=newPassword;
  await user.save({validateBeforeSave:false});


  res.status(200)
  .json(
    new ApiResponse(200,
      {
        id:user._id
      },
      "Password Updated succesfully"
    )
  )

})

const updateUserDetails = asyncHandler(async(req,res)=>{
  const {fullName,email} = req.body;
  
  if([fullName,email].some((field)=>field.trim()===""))
  {
    throw new ApiError(400,"Details missing");
  }

  const user =await User.findByIdAndUpdate(req.user?._id, 
    {
      $set:{
        fullName ,
        email 
      }
    }, 
    {
      new:true
    }).select("-password -refreshToken");

    if(!user){
      throw new ApiError(500,"Something went wrong");
    }

    res.status(200)
    .json(
      new ApiResponse(200,
        {
          user
        },
        "Details updates successfully"
      )
    );
});

const updateAvatarImage = asyncHandler(async(req,res)=>{
  const avatarLocalpath = req.file?.path;
  
  // console.log(req);
  if(!avatarLocalpath){
    throw new ApiError(401,"Avatar Image missing.");
  }
  const oldImageUrl = await User.findById(req.user._id).select("avatar");
  const publicId = extractPublicIdFromUrl(oldImageUrl.avatar);

  const avatarImage=await uploadOnCloudinary(avatarLocalpath);
  // console.log("Cloud___________\n",avatarImage);
  if(!avatarImage){
    throw new ApiError(500,"Error while uploading on cloudinary");
  }

  const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set:{
        avatar:avatarImage.secure_url
      }
    },
    {
      new:true
    }
  ).select("-password");
  if(!user)
  {
    throw new ApiError(500,"Updation of avatar failed");
  }
  const deletedImage = await deleteFileFromCloudinary(publicId);
  console.log("deleted Logs",deletedImage)
  // console.log("---------Update Avatar-------------------\n",user);
  return res.status(200)
  .json(
    new ApiResponse(
      200,
      {
        userData:user
      },
      "Avatar Image Updated successfully"
    )
  )

})

const updateCoverImage = asyncHandler(async(req,res)=>{
  //get the New file path
  //get the old image url
  //upload new image using cloudinary
  //if uploaded successfully delete previous file from cloud.
  const coverImagelocalPath = req.file?.path;
  if(!coverImagelocalPath){
    throw new ApiError(401,"Cover Image missing.");
  }
  const oldImageUrl = await User.findById(req.user._id).select("coverImage");
  console.log("-------",oldImageUrl)
  const publicId = extractPublicIdFromUrl(oldImageUrl.coverImage);

  const coverImage=await uploadOnCloudinary(coverImagelocalPath);

  if(!coverImage){
    throw new ApiError(500,"Error while uploading on cloudinary");
  }

  const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set:{
        coverImage:coverImage.url
}    },
    {
      new:true
    }
  ).select("-password");
  if(!user)
  {
    throw new ApiError(500,"Updation of coverImage failed");
  }
  const deletedImage = await deleteFileFromCloudinary(publicId);
  console.log("deleted Logs",deletedImage)
  return res.status(200)
  .json(
    new ApiResponse(
      200,
      {
        userData:user
      },
      "Cover Image Updated successfully"
    )
  )

})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
  const {username}= req.params;
  if(!username?.trim())
    {
      throw new ApiError(400,"Username is missing");
    }
    
    const channel = await User.aggregate([
      {
        $match:{
          username:username?.toLowerCase(),
        }
      },
      {
        $lookup:{
          from:"subscriptions",
          localField:"_id",
          foreignField:"channel",
          as : "subscribers"
        }
      },
      {
        $lookup:{
          from:"subscriptions",
          localField:"_id",
          foreignField:"subscriber",
          as : "subscribedTo"
        }
      },
      {
        $addFields:{
          subscriberCount:{
            $size:"$subscribers"
          },
          subscribedToCount:{
            $size:"$subscribedTo"
          },
          isSubscribed:{
            $cond:{
              //in can be used in array as well as in objects
              if:{$in:[req.user._id,"$subscribers.subscriber"]},
              then : true,
              else : false,
            }
          }
        }
      },
      {
        $project:{
          fullName:1,
          username:1,
          email:1,
          avatar:1,
          coverImage:1,
          subscriberCount:1,
          subscribedToCount:1,
          isSubscribed:1,
        }
      }
    ]
  );
  console.log(channel);
  if(!channel?.length)
    {
      throw new ApiError(404,"channel doen not exist");
    }
    
    return res.status(200).json(
      new ApiResponse(200,
        channel[0],
        "Channel details fetched."
    )
  );
})

const getWatchHistory = asyncHandler(async(req,res)=>{

    const History =await User.aggregate([
      {
        //mongoDB return an objectId for user._id so we need mongoose parse ObjectId method
        $match:{_id:new mongoose.Types.ObjectId(req.user._id)}
      },
      {
        $lookup:{
          //to mention model name below always use lower case and make the model name plural : Video -> videos.
          from:"videos",
          localField:"watchHistory",
          foreignField:"_id",
          as:"watchHistory",
          pipeline:[
            {
              $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                  {
                    $project:{
                      username:1,
                      avatar:1,
                      fullName:1,
                    },
                  },
                  {
                    $addFields:{
                      owner:{
                        $first:"$owner"
                      }
                    }
                  }
                ]
              } 
            }
          ]
        }
      }
    ])

    if(!History.length)
    {
      throw new ApiError(400,"No History recieved.");
    }
    return res.status(200).json(
      new ApiResponse(200,
        History[0]?.watchHistory,
        "watch History Fetched Successfully"
      )
    )
})

//routes are yet to set for updateWatchHistory
const updateWatchHistory = asyncHandler(async(req,res)=>{
  const {_id:videoId} = req.body;
  const userId = req.user?._id;
  //Push this id to watchHistory array.
  if(!(userId && videoId)){
    throw new ApiError(400,"Insufficient Data.");
  }
  const user = User.findByIdAndUpdate(userId,{
    $push:videoId
  },
  {
    new:true  
  })
  .select("-password");
  if(!user){
    throw new ApiError(500,"Error Updating watch history");
  }

  return res.status(200).json(
    200,
    {
      user
    },
    "History Updated Successfully."
  )

})



export { registerUser,
  loginUser, 
  logout, 
  refreshAccessToken ,
  getCurrentUser ,
  updatePassword , 
  updateUserDetails , 
  updateAvatarImage , 
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  updateWatchHistory

};
