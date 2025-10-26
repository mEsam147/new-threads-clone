import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import User from '../models/userModel.js'
import Post from '../models/postModel.js'
import Conversation from '../models/conversationModel.js'
import Message from '../models/messageModel.js'

// Setup dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Debug check
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI not found. Check your .env file path.')
  process.exit(1)
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('❌ Connection Error:', error.message)
    process.exit(1)
  }
}

// Generate random helpers
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randomInt = (max) => Math.floor(Math.random() * max)

// Seeder function
const seedData = async () => {
  await connectDB()

  // Clear old data
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
  ])
  console.log('🧹 Cleared old collections.')

  // 1️⃣ Create Users
  const usersData = [
    {
      name: 'Mohamed Samir',
      username: 'moesam1456',
      email: 'moesam@example.com',
      password: '123456',
      bio: 'Full Stack Developer & tech lover 💻',
      profilePic: 'https://randomuser.me/api/portraits/men/45.jpg',
    },
    {
      name: 'Sara Ali',
      username: 'sara_ali',
      email: 'sara@example.com',
      password: '123456',
      bio: 'UX designer and photographer 📸',
      profilePic: 'https://randomuser.me/api/portraits/women/68.jpg',
    },
    {
      name: 'Ahmed Nour',
      username: 'ahmed_n',
      email: 'ahmed@example.com',
      password: '123456',
      bio: 'Node.js backend engineer 🚀',
      profilePic: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
      name: 'Lina Fathy',
      username: 'lina_f',
      email: 'lina@example.com',
      password: '123456',
      bio: 'Frontend developer who loves React ⚛️',
      profilePic: 'https://randomuser.me/api/portraits/women/52.jpg',
    },
    {
      name: 'Youssef Omar',
      username: 'youssef_o',
      email: 'youssef@example.com',
      password: '123456',
      bio: 'Product designer and UI enthusiast 🎨',
      profilePic: 'https://randomuser.me/api/portraits/men/18.jpg',
    },
  ]

  const users = await User.insertMany(usersData)
  console.log(`👥 Created ${users.length} users.`)

  // Add followers/following relationships
  for (let user of users) {
    const others = users.filter((u) => u._id.toString() !== user._id.toString())
    const randomFollow = others.slice(0, randomInt(others.length))
    user.following = randomFollow.map((u) => u._id.toString())
    for (let f of randomFollow) {
      f.followers.push(user._id.toString())
      await f.save()
    }
    await user.save()
  }
  console.log('🔁 Added followers/following relationships.')

  // 2️⃣ Create Posts
  const sampleTexts = [
    'Just deployed my first MERN project! 🔥',
    'Coffee + coding = perfect morning ☕💻',
    'Exploring new features in React 19 🤩',
    'Working on a new UI concept for Threads Clone!',
    'Does anyone else love Tailwind as much as I do?',
  ]

  const posts = []
  for (let i = 0; i < 20; i++) {
    const user = randomElement(users)
    posts.push({
      postedBy: user._id,
      text: randomElement(sampleTexts),
      img: `https://picsum.photos/seed/${i}/500/300`,
      likes: users.filter(() => Math.random() < 0.4).map((u) => u._id),
      replies: [
        {
          userId: randomElement(users)._id,
          text: 'Nice post! 🔥',
          username: randomElement(users).username,
          userProfilePic: randomElement(users).profilePic,
        },
      ],
    })
  }

  await Post.insertMany(posts)
  console.log(`📝 Created ${posts.length} posts.`)

  // 3️⃣ Create Conversations & Messages
  const conversations = []
  const messages = []

  for (let i = 0; i < 5; i++) {
    const participants = [randomElement(users)._id, randomElement(users)._id].filter(
      (v, i, a) => a.indexOf(v) === i
    ) // unique

    if (participants.length < 2) continue

    const convo = await Conversation.create({
      participants,
      lastMessage: {
        text: 'Hey there 👋',
        sender: participants[0],
        seen: true,
      },
    })
    conversations.push(convo)

    for (let j = 0; j < 5; j++) {
      messages.push({
        conversationId: convo._id,
        sender: randomElement(participants),
        text: ['Hey!', 'How’s your day?', 'That’s awesome!', '😂', 'Talk soon!'][randomInt(5)],
        seen: Math.random() > 0.5,
      })
    }
  }

  await Message.insertMany(messages)
  console.log(`💬 Created ${conversations.length} conversations with ${messages.length} messages.`)

  console.log('✅ Seeding complete!')
  process.exit(0)
}

seedData()
