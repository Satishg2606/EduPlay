import { Router } from 'express';
import {
    addCommentToVideo,
    deleteComment,
    addCommentToTweet,
    getVideoComments,
    getTweetComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/v/:videoId").get(getVideoComments).post(addCommentToVideo);
router.route("/t/:tweetId").get(getTweetComments).post(addCommentToTweet);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router