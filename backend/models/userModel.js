// import mongoose from 'mongoose'

// const userSchema = mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//     },
//     username: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     password: {
//       type: String,
//       minLength: 6,
//       required: true,
//     },
//     profilePic: {
//       type: String,
//       default: '',
//     },
//     followers: {
//       type: [String],
//       default: [],
//     },
//     following: {
//       type: [String],
//       default: [],
//     },
//     bio: {
//       type: String,
//       default: '',
//     },
//     isFrozen: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   }
// )

// const User = mongoose.model('User', userSchema)

// export default User

import mongoose from 'mongoose'

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minLength: 6,
      required: true,
    },
    profilePic: {
      type: String,
      default: '',
    },
    coverPic: {
      type: String,
      default: '',
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    bio: {
      type: String,
      default: '',
      maxLength: 150,
    },
    website: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    isFrozen: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
  },
  {
    timestamps: true,
  }
)

// Add index for better search performance

userSchema.index({
  username: 'text',
  name: 'text',
  bio: 'text',
})

// If you want to use text search, use this version instead:
const searchUsersWithTextIndex = async (req, res) => {
  try {
    const { q } = req.query

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' })
    }

    const users = await User.find(
      {
        $text: { $search: q },
        isFrozen: { $ne: true },
      },
      { score: { $meta: 'textScore' } }
    )
      .select('username name profilePic isVerified followers following bio')
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)

    const enhancedUsers = users.map((user) => ({
      _id: user._id,
      username: user.username,
      name: user.name,
      profilePic: user.profilePic,
      isVerified: user.isVerified,
      bio: user.bio,
      followersCount: user.followers.length,
      followingCount: user.following.length,
    }))

    res.status(200).json(enhancedUsers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
// Virtual for isLocked
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now())
})

const User = mongoose.model('User', userSchema)

export default User
