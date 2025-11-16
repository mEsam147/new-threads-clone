// import path from 'path'
// import dotenv from 'dotenv'

// dotenv.config({ path: path.resolve('backend/.env') }) // ✅ تحميل ملف .env من مكانه الصحيح

// import express from 'express'
// import connectDB from './db/connectDB.js'
// import cookieParser from 'cookie-parser'
// import userRoutes from './routes/userRoutes.js'
// import postRoutes from './routes/postRoutes.js'
// import messageRoutes from './routes/messageRoutes.js'
// import { v2 as cloudinary } from 'cloudinary'
// import { app, server } from './socket/socket.js'
// import job from './cron/cron.js'

// dotenv.config()

// connectDB()
// job.start()

// // console.log('MongoDB connected successfully.', process.env)

// const PORT = process.env.PORT || 5000
// const __dirname = path.resolve()

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// })

// // Middlewares
// app.use(express.json({ limit: '50mb' })) // To parse JSON data in the req.body
// app.use(express.urlencoded({ extended: true })) // To parse form data in the req.body
// app.use(cookieParser())

// // Routes
// app.use('/api/users', userRoutes)
// app.use('/api/posts', postRoutes)
// app.use('/api/messages', messageRoutes)

// // http://localhost:5000 => backend,frontend

// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '/frontend/dist')))

//   // react app
//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'))
//   })
// }

// server.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`))

import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve('backend/.env') })

import express from 'express'
import connectDB from './db/connectDB.js'
import cookieParser from 'cookie-parser'
import userRoutes from './routes/userRoutes.js'
import postRoutes from './routes/postRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import { v2 as cloudinary } from 'cloudinary'
import { app, server } from './socket/socket.js'
import job from './cron/cron.js'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'

dotenv.config()

connectDB()
job.start()

const PORT = process.env.PORT || 5000
const __dirname = path.resolve()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Security Middlewares
app.use(helmet())
app.use(mongoSanitize())

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 100 requests per windowMs for general routes
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting for certain paths or authenticated users
    return req.path.startsWith('/api/notifications/unread-count') || req.user // Skip if user is authenticated
  },
})

// Specific limiter for auth routes (more restrictive)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // only 5 attempts per window for auth
  message: 'Too many authentication attempts, please try again later.',
  skip: (req) =>
    !req.path.includes('/auth') && !req.path.includes('/login') && !req.path.includes('/signup'),
})

// Apply limiters
app.use(generalLimiter)
app.use('/api/users/login', authLimiter)
app.use('/api/users/signup', authLimiter)
// Middlewares

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Routes
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/notifications', notificationRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() })
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/frontend/dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'))
  })
}

server.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`))
