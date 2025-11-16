import express from 'express'
import {
  createPost,
  deletePost,
  getPost,
  likeUnlikePost,
  replyToPost,
  getFeedPosts,
  getUserPosts,
  sharePost,
  searchPosts,
  editPost,
  getTrendingPosts,
  getUserReplies,
} from '../controllers/postController.js'
import protectRoute from '../middlewares/protectRoute.js'

const router = express.Router()

router.get('/feed', protectRoute, getFeedPosts)
router.get('/trending', getTrendingPosts)
router.get('/search', searchPosts)
router.get('/:id', getPost)
router.get('/user/:username', getUserPosts)
router.post('/create', protectRoute, createPost)
router.post('/:id/share', protectRoute, sharePost)
router.put('/:id', protectRoute, editPost)
router.delete('/:id', protectRoute, deletePost)
router.put('/like/:id', protectRoute, likeUnlikePost)
router.put('/reply/:id', protectRoute, replyToPost)
// Add this to your postRoutes.js
router.get('/user/:username/replies', getUserReplies)

export default router
