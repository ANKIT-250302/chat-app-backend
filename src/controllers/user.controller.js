import User from "../models/User.js";
import FriendRequest from "../models/friendRequest.js";

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user._id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
        $and:[
            { _id:{ $ne:currentUserId }  },
            { _id: { $nin: currentUser.friends } },
            { isOnBoarded:true}
            ]
    });
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error in getRecommonded user controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select()
      .populate(
        "friends",
        "fullName profilePic nativeLanguage learningLanguage"
      );

    res.status(200).json(user.friends);
  } catch (error) {
    console.log(error);
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { rec_id } = req.params;
    if (myId === rec_id) {
      return res
        .status(200)
        .json({ message: "You cannot send request to yourself" });
    }
    const recipient = await User.findById(rec_id);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }
    if (recipient.friends.includes(myId)) {
      return res
        .status(400)
        .json({ message: "You are already friends with this user" });
    }
    const existingrequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: rec_id },
        { sender: rec_id, recipient: myId },
      ],
    });

    if (existingrequest) {
      return res
        .status(400)
        .json({
          message:
            "A friend reqquuest already exists between you and this user",
        });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: rec_id,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in SendFriendRequest controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { rec_id } = req.params;
    if (!rec_id) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const friendRequest = await FriendRequest.findById(rec_id);

    if (!friendRequest) {
      {
        return res.status(404).json({ message: "Friend request not found." });
      }
    }

    if (friendRequest.recipient.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Yout are not authorized to accept this request." });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Internal server error:", error);
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incommingRequests = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate(
      "sender",
      "fullName profilePic nativeLanguage learningLanguage"
    );
    const acceptedRequests = await FriendRequest.find({
      recipient:req.user._id,
      status:"accepted"
    }).populate("recipient", "fullName profilePic");
    console.log("accepted:",acceptedRequests)
    res.status(200).json({incommingRequests, acceptedRequests});
  } catch (error) {
    console.error("Error in getFriendRequests controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getOutgoingFriendRequests(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate(
      "recipient",
      "fullName profilePic nativeLanguage learningLanguage"
    );

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getOutgoingFriendRequest controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
