import User from '../models/userModel.js'
import Post from '../models/postModel.js'
import Notification from '../models/notificationModel.js'
import bcrypt from 'bcryptjs'
import generateTokenAndSetCookie from '../utils/helpers/generateTokenAndSetCookie.js'
import { v2 as cloudinary } from 'cloudinary'
import mongoose from 'mongoose'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

const getUserProfile = async (req, res) => {
  const { query } = req.params

  try {
    // Log for debugging
    console.log('Searching for user with query:', query)

    // Validate query parameter
    if (!query || query === '[object Object]') {
      return res.status(400).json({ error: 'Invalid user identifier' })
    }

    let user

    // Check if query is a valid MongoDB ObjectId (24 character hex string)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(query)

    if (isValidObjectId) {
      user = await User.findOne({ _id: query }).select('-password -updatedAt')
    } else {
      // query is username - make sure it's a string and trim it
      const username = typeof query === 'string' ? query.trim() : String(query).trim()
      user = await User.findOne({ username: username }).select('-password -updatedAt')
    }

    if (!user) {
      console.log('User not found for query:', query)
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if user is blocked by current user
    if (req.user) {
      const currentUser = await User.findById(req.user._id)
      if (currentUser && currentUser.blockedUsers.includes(user._id)) {
        return res.status(403).json({ error: 'You have blocked this user' })
      }
    }

    res.status(200).json(user)
  } catch (err) {
    console.error('Error in getUserProfile:', err)
    res.status(500).json({ error: err.message })
  }
}

const signupUser = async (req, res) => {
  try {
    const { name, email, username, password } = req.body

    // Validation
    if (!name || !email || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const user = await User.findOne({ $or: [{ email }, { username }] })

    if (user) {
      return res.status(400).json({ error: 'User already exists' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    const newUser = new User({
      name,
      email,
      username,
      password: hashedPassword,
      verificationToken,
    })

    await newUser.save()

    // Send verification email
    await sendVerificationEmail(newUser.email, verificationToken)

    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res)

      res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        bio: newUser.bio,
        profilePic: newUser.profilePic,
        emailVerified: newUser.emailVerified,
      })
    } else {
      res.status(400).json({ error: 'Invalid user data' })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const user = await User.findOne({
      $or: [{ email: username }, { username: username }],
    })

    // Check if account is locked
    if (user && user.isLocked) {
      const timeLeft = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60)
      return res.status(423).json({
        error: `Account is locked. Try again in ${timeLeft} minutes`,
      })
    }

    const isPasswordCorrect = await bcrypt.compare(password, user?.password || '')

    if (!user || !isPasswordCorrect) {
      // Increment login attempts
      if (user) {
        user.loginAttempts += 1
        if (user.loginAttempts >= 5) {
          user.lockUntil = Date.now() + 15 * 60 * 1000 // 15 minutes
        }
        await user.save()
      }

      return res.status(400).json({ error: 'Invalid username or password' })
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0
    user.lockUntil = undefined

    if (user.isFrozen) {
      user.isFrozen = false
    }

    await user.save()

    generateTokenAndSetCookie(user._id, res)

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      bio: user.bio,
      profilePic: user.profilePic,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const logoutUser = (req, res) => {
  try {
    res.cookie('jwt', '', { maxAge: 1 })
    res.status(200).json({ message: 'User logged out successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const followUnFollowUser = async (req, res) => {
  try {
    const { id } = req.params
    const userToModify = await User.findById(id)
    const currentUser = await User.findById(req.user._id)

    if (id === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot follow/unfollow yourself' })
    }

    if (!userToModify || !currentUser) {
      return res.status(400).json({ error: 'User not found' })
    }

    // Check if user is private
    if (userToModify.isPrivate && !userToModify.followers.includes(currentUser._id)) {
      return res.status(400).json({ error: 'This account is private' })
    }

    const isFollowing = currentUser.following.includes(id)

    if (isFollowing) {
      // Unfollow user
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } })
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } })
      res.status(200).json({ message: 'User unfollowed successfully' })
    } else {
      // Follow user
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } })
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } })

      // Create notification
      await Notification.create({
        recipient: id,
        sender: req.user._id,
        type: 'follow',
        text: `${currentUser.username} started following you`,
      })

      res.status(200).json({ message: 'User followed successfully' })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateUser = async (req, res) => {
  const { name, email, username, password, bio, website, location, isPrivate } = req.body
  let { profilePic, coverPic } = req.body

  const userId = req.user._id
  try {
    let user = await User.findById(userId)
    if (!user) return res.status(400).json({ error: 'User not found' })

    if (req.params.id !== userId.toString()) {
      return res.status(400).json({ error: "You cannot update other user's profile" })
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' })
      }
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)
      user.password = hashedPassword
    }

    // Handle profile picture upload
    if (profilePic) {
      if (user.profilePic) {
        const oldImgId = user.profilePic.split('/').pop().split('.')[0]
        await cloudinary.uploader.destroy(oldImgId)
      }

      const uploadedResponse = await cloudinary.uploader.upload(profilePic, {
        folder: 'threads/profiles',
      })
      profilePic = uploadedResponse.secure_url
    }

    // Handle cover picture upload
    if (coverPic) {
      if (user.coverPic) {
        const oldImgId = user.coverPic.split('/').pop().split('.')[0]
        await cloudinary.uploader.destroy(oldImgId)
      }

      const uploadedResponse = await cloudinary.uploader.upload(coverPic, {
        folder: 'threads/covers',
      })
      coverPic = uploadedResponse.secure_url
    }

    user.name = name || user.name
    user.email = email || user.email
    user.username = username || user.username
    user.profilePic = profilePic || user.profilePic
    user.coverPic = coverPic || user.coverPic
    user.bio = bio || user.bio
    user.website = website || user.website
    user.location = location || user.location
    user.isPrivate = isPrivate !== undefined ? isPrivate : user.isPrivate

    user = await user.save()

    // Update posts with new username and profilePic
    await Post.updateMany(
      { 'replies.userId': userId },
      {
        $set: {
          'replies.$[reply].username': user.username,
          'replies.$[reply].userProfilePic': user.profilePic,
        },
      },
      { arrayFilters: [{ 'reply.userId': userId }] }
    )

    // password should be null in response
    user.password = null

    res.status(200).json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id

    const usersFollowedByYou = await User.findById(userId).select('following')

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(userId) },
          isFrozen: { $ne: true },
        },
      },
      {
        $sample: { size: 15 },
      },
    ])

    const filteredUsers = users.filter((user) => !usersFollowedByYou.following.includes(user._id))
    const suggestedUsers = filteredUsers.slice(0, 5)

    suggestedUsers.forEach((user) => (user.password = null))

    res.status(200).json(suggestedUsers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const freezeAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(400).json({ error: 'User not found' })
    }

    user.isFrozen = true
    await user.save()

    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const blockUser = async (req, res) => {
  try {
    const { id } = req.params
    const currentUser = await User.findById(req.user._id)

    if (id === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot block yourself' })
    }

    const userToBlock = await User.findById(id)
    if (!userToBlock) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (currentUser.blockedUsers.includes(id)) {
      return res.status(400).json({ error: 'User is already blocked' })
    }

    currentUser.blockedUsers.push(id)

    // Remove from followers/following
    currentUser.following = currentUser.following.filter((userId) => userId.toString() !== id)
    currentUser.followers = currentUser.followers.filter((userId) => userId.toString() !== id)

    await currentUser.save()

    res.status(200).json({ message: 'User blocked successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const unblockUser = async (req, res) => {
  try {
    const { id } = req.params
    const currentUser = await User.findById(req.user._id)

    if (!currentUser.blockedUsers.includes(id)) {
      return res.status(400).json({ error: 'User is not blocked' })
    }

    currentUser.blockedUsers = currentUser.blockedUsers.filter((userId) => userId.toString() !== id)

    await currentUser.save()

    res.status(200).json({ message: 'User unblocked successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' })
    }

    // Simple regex-based search (more reliable)
    const users = await User.find({
      $and: [
        {
          $or: [{ username: { $regex: q, $options: 'i' } }, { name: { $regex: q, $options: 'i' } }],
        },
        { isFrozen: { $ne: true } },
      ],
    })
      .select('username name profilePic isVerified followers following bio')
      .limit(20)

    // Enhanced response with match scoring
    const enhancedUsers = users.map((user) => ({
      _id: user._id,
      username: user.username,
      name: user.name,
      profilePic: user.profilePic,
      isVerified: user.isVerified,
      bio: user.bio,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      matchScore: calculateMatchScore(user, q),
    }))

    // Sort by match score (exact matches first)
    enhancedUsers.sort((a, b) => b.matchScore - a.matchScore)

    res.status(200).json(enhancedUsers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Helper function to calculate match score
const calculateMatchScore = (user, query) => {
  let score = 0
  const lowerQuery = query.toLowerCase()
  const lowerUsername = user.username.toLowerCase()
  const lowerName = user.name.toLowerCase()

  // Exact username match gets highest score
  if (lowerUsername === lowerQuery) {
    score += 100
  }

  // Exact name match
  if (lowerName === lowerQuery) {
    score += 80
  }

  // Starts with query
  if (lowerUsername.startsWith(lowerQuery)) {
    score += 60
  }

  if (lowerName.startsWith(lowerQuery)) {
    score += 50
  }

  // Contains query
  if (lowerUsername.includes(lowerQuery)) {
    score += 30
  }

  if (lowerName.includes(lowerQuery)) {
    score += 20
  }

  return score
}

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params

    const user = await User.findOne({ verificationToken: token })
    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token' })
    }

    user.emailVerified = true
    user.verificationToken = undefined
    await user.save()

    res.status(200).json({ message: 'Email verified successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = Date.now() + 3600000 // 1 hour

    await user.save()

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken)

    res.status(200).json({ message: 'Password reset email sent' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    user.loginAttempts = 0
    user.lockUntil = undefined

    await user.save()

    res.status(200).json({ message: 'Password reset successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Email helper functions
const sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransporter({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your email - Threads Clone',
    html: `
      <h1>Verify your email</h1>
      <p>Click the link below to verify your email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
    `,
  })
}

const sendPasswordResetEmail = async (email, token) => {
  const transporter = nodemailer.createTransporter({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset your password - Threads Clone',
    html: `
      <h1>Reset your password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
    `,
  })
}

export {
  signupUser,
  loginUser,
  logoutUser,
  followUnFollowUser,
  updateUser,
  getUserProfile,
  getSuggestedUsers,
  freezeAccount,
  blockUser,
  unblockUser,
  searchUsers,
  verifyEmail,
  forgotPassword,
  resetPassword,
}
