import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();


// Ensure the upload directory exists
// Ensure the upload directory exists
const uploadDir = path.resolve(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Function to return multer upload middleware
const getUploader = () => {
  const storage = multer.diskStorage({
    destination: (_, __, cb) => {
      cb(null, uploadDir);
    },
    filename: (_, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  });

  return multer({ storage });
};



//const upload = multer({ storage }); // Use the custom storage configuration

// Middleware to parse JSON request bodies
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.use((req,res, next) => {
  console.log("Request Body:", req.body);
  next();
});

// Load posts from JSON
const loadPosts = () => {
  const data = fs.readFileSync(path.resolve(__dirname, "../data/posts.json"), "utf-8");
  return JSON.parse(data);
};


// Save posts to JSON
const savePosts = (posts) => {
  fs.writeFileSync(path.resolve(__dirname, "../data/posts.json"), JSON.stringify(posts, null, 2));
};

// Home Page - View all posts
router.get("/", (req, res) => {
  const posts = loadPosts();
  res.render("index.ejs", { posts });
});

// Create New Post Form
router.get("/create", (_, res) => {
  res.render("create.ejs");
});

// Add New Post with Image Upload
const upload = getUploader();

router.post("/add", upload.single("image"), (req, res) => {
  try {
    const posts = loadPosts();

    const newPost = {
      id: Date.now().toString(),
      title: req.body.title,
      content: req.body.content,
      image: req.file ? `/uploads/${req.file.filename}` : null, // Save relative image path
    };

    posts.push(newPost);
    savePosts(posts);
    res.redirect("/");
  } catch (error) {
    console.error("Error adding post:", error.message);
    res.status(500).send("Internal Server Error");
  }
});


// View Single Post
router.get("/post/:id", (req, res) => {
  const posts = loadPosts();
  const post = posts.find((p) => p.id === req.params.id);
  res.render("view.ejs", { post });
});

// Edit Post Form
router.get("/post/edit/:id", (req, res) => {
  const posts = loadPosts();
  const post = posts.find((p) => p.id === req.params.id);
  res.render("edit.ejs", { post });
});

// Update Post
router.put("/post/:id", (req, res) => {
  try {
    let posts = loadPosts();
    const index = posts.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: "Post not found" });
    }
    posts[index].title = req.body.title;
    posts[index].content = req.body.content;
    savePosts(posts);
    //redirect to the updated post page
    res.redirect(`/`);
  } catch (error) {
    console.error("Error updating post:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete Post
router.delete("/post/:id", (req, res) => {
  try {
    let posts = loadPosts();
    const postToDelete = posts.find((p) => p.id === req.params.id);

    if (!postToDelete) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Delete the associated image file if it exists
    if (postToDelete.image) {
      const imagePath = path.resolve(__dirname, `..${postToDelete.image}`);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    posts = posts.filter((p) => p.id !== req.params.id);
    savePosts(posts);
    res.redirect("/");
  } catch (error) {
    console.error("Error deleting post:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//about page
router.get("/about", (req, res) => {
  res.render("about.ejs");
});

// Export router
export default router;
