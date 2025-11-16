// import cron from "cron";
// import https from "https";

// const URL = "https://threads-clone-9if3.onrender.com";

// const job = new cron.CronJob("*/14 * * * *", function () {
// 	https
// 		.get(URL, (res) => {
// 			if (res.statusCode === 200) {
// 				console.log("GET request sent successfully");
// 			} else {
// 				console.log("GET request failed", res.statusCode);
// 			}
// 		})
// 		.on("error", (e) => {
// 			console.error("Error while sending request", e);
// 		});
// });

// export default job;

// // CRON JOB EXPLANATION:
// // Cron jobs are scheduled tasks that run periodically at fixed intervals or specific times
// // send 1 GET request for every 14 minutes

// // Schedule:
// // You define a schedule using a cron expression, which consists of five fields representing:

// //! MINUTE, HOUR, DAY OF THE MONTH, MONTH, DAY OF THE WEEK

// //? EXAMPLES && EXPLANATION:
// //* 14 * * * * - Every 14 minutes
// //* 0 0 * * 0 - At midnight on every Sunday
// //* 30 3 15 * * - At 3:30 AM, on the 15th of every month
// //* 0 0 1 1 * - At midnight, on January 1st
// //* 0 * * * * - Every hour

import cron from 'cron'
import https from 'https'
import Post from '../models/postModel.js'
import User from '../models/userModel.js'

const URL = process.env.RENDER_URL || 'https://threads-clone-9if3.onrender.com'

// Keep-alive ping
const keepAliveJob = new cron.CronJob('*/14 * * * *', function () {
  https
    .get(URL, (res) => {
      if (res.statusCode === 200) {
        console.log('GET request sent successfully')
      } else {
        console.log('GET request failed', res.statusCode)
      }
    })
    .on('error', (e) => {
      console.error('Error while sending request', e)
    })
})

// Cleanup job for old notifications
const cleanupJob = new cron.CronJob('0 0 * * 0', async function () {
  try {
    // Delete notifications older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    await Notification.deleteMany({ createdAt: { $lt: thirtyDaysAgo } })

    console.log('Old notifications cleaned up')
  } catch (error) {
    console.error('Error in cleanup job:', error)
  }
})

// Analytics job
const analyticsJob = new cron.CronJob('0 2 * * *', async function () {
  try {
    // Calculate daily stats
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const newUsers = await User.countDocuments({
      createdAt: { $gte: yesterday },
    })

    const newPosts = await Post.countDocuments({
      createdAt: { $gte: yesterday },
    })

    console.log(`Daily Stats - New Users: ${newUsers}, New Posts: ${newPosts}`)
  } catch (error) {
    console.error('Error in analytics job:', error)
  }
})

export default {
  start: () => {
    keepAliveJob.start()
    cleanupJob.start()
    analyticsJob.start()
    console.log('All cron jobs started')
  },
}
