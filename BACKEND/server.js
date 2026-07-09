require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./database/connectDB");
const movieRoutes = require("./routes/movies");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Homepage
app.get("/", (req, res) => {
  res.send("🎬 Welcome to SNOWWFLIX!");
});

// Use movie routes
app.use("/movies", movieRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});