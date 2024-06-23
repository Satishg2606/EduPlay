import { Router } from "express";
import { 
    registerUser,
    loginUser, 
    logout ,
    refreshAccessToken ,
    getUserChannelProfile,
    getWatchHistory,
    getCurrentUser,
    updateUserDetails,
    updateAvatarImage, 
    updateCoverImage,
    updatePassword,

} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields(
        [
            {
                name:'avatar',
                maxCount:1,
            },
            {
                name:'coverImage',
                maxCount:1,
            }
        ]
    ),
    registerUser
);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

//secured Routes
router.route("/logout").post(verifyJWT,logout);
router.route("/get-user").post(verifyJWT,getCurrentUser);
router.route("/change-password").post(verifyJWT,updatePassword);
router.route("/update-details").post(verifyJWT,updateUserDetails);
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateAvatarImage);
router.route("/update-cover").patch(verifyJWT,upload.single("coverImage"),updateCoverImage);
router.route("/watch-history").post(verifyJWT,getWatchHistory);
router.route("/c/:username").post(verifyJWT,getUserChannelProfile);

export default router;
