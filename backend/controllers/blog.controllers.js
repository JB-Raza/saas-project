import Blog from '../models/blog.model.js'

export const createBlog = async (req, res, next) => {
    try {
        const user = req?.user
        if (!user) {
            return res.status(401).json({ success: false, message: "Authentication required to publish blog" })
        }

        const bannerImage = req.files?.bannerImage?.[0]?.path
        if (!bannerImage) {
            return res.status(400).json({ success: false, message: "Banner image is required" })
        }

        const otherImages = req?.files?.otherImages || []
        const otherImagesLinks = otherImages.map(image => image.path)

        const { title, summary, content, readTime, tags } = req.body

        let parsedTags = []
        if (tags) {
            parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags
        }

        const newBlog = new Blog({
            author: user._id,
            bannerImage,
            otherImages: otherImagesLinks,
            title,
            summary,
            content,
            readTime: readTime ? Number(readTime) : Math.ceil((content || "").split(/\s+/).length / 200),
            tags: parsedTags
        })

        await newBlog.save()
        return res.status(201).json({
            success: true,
            blog: newBlog,
            message: "Blog saved successfully",
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const getAllBlogs = async (req, res, next) => {
    try {
        const { search, tag, page = 1, limit = 10 } = req.query

        const filter = {}
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { summary: { $regex: search, $options: "i" } }
            ]
        }
        if (tag) {
            filter.tags = { $in: [tag] }
        }

        const pageNum = Math.max(1, parseInt(page, 10))
        const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10)))
        const skip = (pageNum - 1) * limitNum

        const totalBlogs = await Blog.countDocuments(filter)
        const allBlogs = await Blog.find(filter)
            .populate("author", "name username")
            .select("-content")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)

        return res.status(200).json({
            success: true,
            totalBlogs,
            totalPages: Math.ceil(totalBlogs / limitNum),
            currentPage: pageNum,
            blogs: allBlogs
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const getBlog = async (req, res, next) => {
    try {
        const { id } = req.params
        if (!id) {
            return res.status(400).json({ success: false, message: "Blog ID is required" })
        }

        const blog = await Blog.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } },
            { new: true }
        ).populate("author", "name username")

        if (!blog) {
            return res.status(404).json({ success: false, message: "Blog not found" })
        }

        return res.status(200).json({
            success: true,
            blog
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
