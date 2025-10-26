import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config({ path: './.env' }) // 👈 يتأكد من تحميل الملف

const connectDB = async () => {
  try {
    console.log('MONGO_URI:', process.env.MONGO_URI) // 👈 اختبر القراءة

    if (!process.env.MONGO_URI) {
      throw new Error('❌ MONGO_URI not found in environment variables!')
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB
