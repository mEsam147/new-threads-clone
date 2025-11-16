import mongoose from 'mongoose'

const postSchema = mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      maxLength: 500,
    },
    img: {
      type: String,
    },
    video: {
      type: String,
    },
    imgs: [
      {
        type: String,
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    shares: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    shareCount: {
      type: Number,
      default: 0,
    },
    originalPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    isSharedPost: {
      type: Boolean,
      default: false,
    },
    hashtags: [String],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    location: String,
    replies: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        text: {
          type: String,
          required: true,
          maxLength: 500,
        },
        userProfilePic: {
          type: String,
        },
        username: {
          type: String,
        },
        likes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    replyCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Add indexes for better performance
postSchema.index({ postedBy: 1, createdAt: -1 })
postSchema.index({ hashtags: 1 })
postSchema.index({ createdAt: -1 })

// Virtual for like count
postSchema.virtual('likeCount').get(function () {
  return this.likes.length
})

// Middleware to update counts
postSchema.pre('save', function (next) {
  this.replyCount = this.replies.length
  next()
})

const Post = mongoose.model('Post', postSchema)

export default Post
