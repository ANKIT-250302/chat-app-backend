import express from "express"
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
    getMyFriends, 
    getRecommendedUsers,
    sendFriendRequest,
    acceptFriendRequest,
    getFriendRequests,
    getOutgoingFriendRequests
} from "../controllers/user.controller.js";

const router = express.Router();

//apply middleware to all routes
router.use(protectRoute)

router.get("/",getRecommendedUsers)
router.get("/friends",getMyFriends)
router.post("/friend-request/:rec_id",sendFriendRequest)
router.put("/friend-request/:rec_id/accept",acceptFriendRequest)
router.get("/friend-requests",getFriendRequests)
router.get("/outgoinig-friend-requests",getOutgoingFriendRequests)

export default router;