import Blog from '../models/blog.model.js'


export const createBlog = async (req, res, next) => {
    try {
        const user = req?.user
        console.log(user)
        const bannerImage = req.files.bannerImage[0].path

        const otherImages = req?.files.otherImages
        const otherImagesLinks = []
        otherImages?.map((image) => {
            otherImagesLinks.push(image.path)
        })


        const blogData = req.body
        const newBlog = new Blog({ author: user._id, bannerImage, otherImages: otherImagesLinks, ...blogData })
        await newBlog.save()
        res.status(201)
            .json({
                success: true,
                blog: newBlog,
                message: "Blog saved successfully",
            })

    } catch (error) {
        next(error)
    }

}

export const getAllBlogs = async (req, res, next) => {
    try {
        const allBlogs = await Blog.find({}).populate("author", "name").limit(3).select("-content")
        res.status(200).json({ success: true, message: "all blogs are here", blogs: allBlogs })
    } catch (error) {
        next(error)
    }
}

export const getBlog = async (req, res,next) => {
    const {id} = req.params
    if(!id) return res.status(404).json({success: false, message: "no blog found of this ID"})

    const blog = await Blog.findById(id).populate("author", "name")
    
    if(!blog) res.status(400).json({success: false, message: "could not fetch blog"})

        res.status(200).json({
            success: true,
            blog
        })
        
}

