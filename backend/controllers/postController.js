import Post from '../models/postModel.js'
import User from '../models/userModel.js'
import Notification from '../models/notificationModel.js'
import { v2 as cloudinary } from 'cloudinary'
import { getRecipientSocketId, io } from '../socket/socket.js'

const createPost = async (req, res) => {
  try {
    const { postedBy, text } = req.body
    let { img, imgs, video, hashtags, location } = req.body

    if (!postedBy || !text) {
      return res.status(400).json({ error: 'Postedby and text fields are required' })
    }

    const user = await User.findById(postedBy)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Unauthorized to create post' })
    }

    const maxLength = 500
    if (text.length > maxLength) {
      return res.status(400).json({ error: `Text must be less than ${maxLength} characters` })
    }

    // Extract mentions and hashtags
    const mentionRegex = /@(\w+)/g
    const mentions = []
    let match
    while ((match = mentionRegex.exec(text))) {
      const mentionedUser = await User.findOne({ username: match[1] })
      if (mentionedUser) {
        mentions.push(mentionedUser._id)
      }
    }

    const hashtagRegex = /#(\w+)/g
    const extractedHashtags = []
    while ((match = hashtagRegex.exec(text))) {
      extractedHashtags.push(match[1].toLowerCase())
    }

    // Handle single image
    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img, {
        folder: 'threads/posts',
      })
      img = uploadedResponse.secure_url
    }

    // Handle multiple images
    if (imgs && imgs.length > 0) {
      const uploadedImages = []
      for (const image of imgs) {
        const uploadedResponse = await cloudinary.uploader.upload(image, {
          folder: 'threads/posts',
        })
        uploadedImages.push(uploadedResponse.secure_url)
      }
      imgs = uploadedImages
    }

    // Handle video
    if (video) {
      const uploadedResponse = await cloudinary.uploader.upload(video, {
        resource_type: 'video',
        folder: 'threads/posts',
      })
      video = uploadedResponse.secure_url
    }

    const newPost = new Post({
      postedBy,
      text,
      img,
      imgs,
      video,
      hashtags: hashtags || extractedHashtags,
      mentions,
      location,
    })

    await newPost.save()
    await newPost.populate('postedBy', 'username profilePic name')

    // Create notifications for mentions
    for (const mentionedUserId of mentions) {
      if (mentionedUserId.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: mentionedUserId,
          sender: req.user._id,
          type: 'mention',
          post: newPost._id,
          text: `${req.user.username} mentioned you in a post`,
        })

        // Send socket notification
        const recipientSocketId = getRecipientSocketId(mentionedUserId)
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('newNotification', {
            type: 'mention',
            message: `${req.user.username} mentioned you`,
          })
        }
      }
    }

    res.status(201).json(newPost)
  } catch (err) {
    res.status(500).json({ error: err.message })
    console.log(err)
  }
}

const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('postedBy', 'username profilePic name isVerified')
      .populate('replies.userId', 'username profilePic name')

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Increment view count
    post.viewCount += 1
    await post.save()

    res.status(200).json(post)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Unauthorized to delete post' })
    }

    // Delete media from cloudinary
    if (post.img) {
      const imgId = post.img.split('/').pop().split('.')[0]
      await cloudinary.uploader.destroy(imgId)
    }

    if (post.imgs && post.imgs.length > 0) {
      for (const img of post.imgs) {
        const imgId = img.split('/').pop().split('.')[0]
        await cloudinary.uploader.destroy(imgId)
      }
    }

    if (post.video) {
      const videoId = post.video.split('/').pop().split('.')[0]
      await cloudinary.uploader.destroy(videoId, { resource_type: 'video' })
    }

    await Post.findByIdAndDelete(req.params.id)

    // Delete associated notifications
    await Notification.deleteMany({ post: req.params.id })

    res.status(200).json({ message: 'Post deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getUserReplies = async (req, res) => {
  const { username } = req.params
  try {
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Find posts where this user has replied
    const postsWithUserReplies = await Post.find({
      'replies.userId': user._id,
      isHidden: { $ne: true },
    })
      .populate('postedBy', 'username profilePic name isVerified')
      .sort({ createdAt: -1 })

    res.status(200).json(postsWithUserReplies)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
const likeUnlikePost = async (req, res) => {
  try {
    const { id: postId } = req.params
    const userId = req.user._id

    const post = await Post.findById(postId).populate('postedBy')

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    const userLikedPost = post.likes.includes(userId)

    if (userLikedPost) {
      // Unlike post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } })
      res.status(200).json({ message: 'Post unliked successfully' })
    } else {
      // Like post
      post.likes.push(userId)
      await post.save()

      // Create notification if not liking own post
      if (post.postedBy._id.toString() !== userId.toString()) {
        await Notification.create({
          recipient: post.postedBy._id,
          sender: userId,
          type: 'like',
          post: postId,
          text: `${req.user.username} liked your post`,
        })

        // Send socket notification
        const recipientSocketId = getRecipientSocketId(post.postedBy._id)
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('newNotification', {
            type: 'like',
            message: `${req.user.username} liked your post`,
          })
        }
      }

      res.status(200).json({ message: 'Post liked successfully' })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const replyToPost = async (req, res) => {
  try {
    const { text } = req.body
    const postId = req.params.id
    const userId = req.user._id
    const userProfilePic = req.user.profilePic
    const username = req.user.username

    if (!text) {
      return res.status(400).json({ error: 'Text field is required' })
    }

    const post = await Post.findById(postId).populate('postedBy')
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    const reply = {
      userId,
      text,
      userProfilePic,
      username,
      createdAt: new Date(),
    }

    post.replies.push(reply)
    await post.save()

    // Create notification if not replying to own post
    if (post.postedBy._id.toString() !== userId.toString()) {
      await Notification.create({
        recipient: post.postedBy._id,
        sender: userId,
        type: 'reply',
        post: postId,
        text: `${username} replied to your post`,
      })

      // Send socket notification
      const recipientSocketId = getRecipientSocketId(post.postedBy._id)
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('newNotification', {
          type: 'reply',
          message: `${username} replied to your post`,
        })
      }
    }

    res.status(200).json(reply)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user._id
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const following = user.following

    const feedPosts = await Post.find({
      postedBy: { $in: following },
      isHidden: { $ne: true },
    })
      .populate('postedBy', 'username profilePic name isVerified')
      .sort({ createdAt: -1 })
      .limit(20)

    res.status(200).json(feedPosts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getUserPosts = async (req, res) => {
  const { username } = req.params
  try {
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const posts = await Post.find({
      postedBy: user._id,
      isHidden: { $ne: true },
    })
      .populate('postedBy', 'username profilePic name isVerified')
      .sort({ createdAt: -1 })

    res.status(200).json(posts)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const sharePost = async (req, res) => {
  try {
    const { id: postId } = req.params
    const userId = req.user._id
    const { text } = req.body

    const originalPost = await Post.findById(postId)
    if (!originalPost) {
      return res.status(404).json({ error: 'Post not found' })
    }

    const sharedPost = new Post({
      postedBy: userId,
      text: text || '',
      originalPost: postId,
      isSharedPost: true,
    })

    await sharedPost.save()

    // Update share count on original post
    originalPost.shareCount += 1
    originalPost.shares.push(userId)
    await originalPost.save()

    // Create notification
    if (originalPost.postedBy.toString() !== userId.toString()) {
      await Notification.create({
        recipient: originalPost.postedBy,
        sender: userId,
        type: 'share',
        post: postId,
        text: `${req.user.username} shared your post`,
      })

      const recipientSocketId = getRecipientSocketId(originalPost.postedBy)
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('newNotification', {
          type: 'share',
          message: `${req.user.username} shared your post`,
        })
      }
    }

    res.status(201).json(sharedPost)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const searchPosts = async (req, res) => {
  try {
    const { q, hashtag } = req.query
    let query = { isHidden: { $ne: true } }

    if (q) {
      query.$or = [
        { text: { $regex: q, $options: 'i' } },
        { 'replies.text': { $regex: q, $options: 'i' } },
      ]
    }

    if (hashtag) {
      query.hashtags = hashtag.toLowerCase()
    }

    const posts = await Post.find(query)
      .populate('postedBy', 'username profilePic name isVerified')
      .sort({ createdAt: -1 })
      .limit(50)

    res.status(200).json(posts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const editPost = async (req, res) => {
  try {
    const { id } = req.params
    const { text } = req.body

    const post = await Post.findById(id)
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Unauthorized to edit post' })
    }

    post.text = text
    post.isEdited = true
    post.editedAt = new Date()

    await post.save()
    res.status(200).json(post)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getTrendingPosts = async (req, res) => {
  try {
    const trendingPosts = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
          isHidden: { $ne: true },
        },
      },
      {
        $project: {
          engagement: { $add: [{ $size: '$likes' }, { $size: '$replies' }, '$shareCount'] },
          post: '$$ROOT',
        },
      },
      {
        $sort: { engagement: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'users',
          localField: 'post.postedBy',
          foreignField: '_id',
          as: 'postedBy',
        },
      },
      {
        $unwind: '$postedBy',
      },
    ])

    res.status(200).json(
      trendingPosts.map((item) => ({
        ...item.post,
        postedBy: {
          _id: item.postedBy._id,
          username: item.postedBy.username,
          profilePic: item.postedBy.profilePic,
          name: item.postedBy.name,
          isVerified: item.postedBy.isVerified,
        },
      }))
    )
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export {
  createPost,
  getPost,
  deletePost,
  likeUnlikePost,
  replyToPost,
  getFeedPosts,
  getUserPosts,
  sharePost,
  searchPosts,
  editPost,
  getTrendingPosts,
  getUserReplies,
}
