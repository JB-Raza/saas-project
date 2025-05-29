import express from 'express'
const router = express.Router()
import upload from '../cloudinary/cloudinary.js'
import { verifyAdminUser } from '../middlewares.js'

// controllers
import { createBlog, getAllBlogs, getBlog } from '../controllers/blog.controllers.js'

router.post(
  "/create",
  verifyAdminUser,
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "otherImages", maxCount: 5 }
  ]),
  createBlog
)

router.get("/:id", getBlog)
router.get("/", getAllBlogs)

export default router