const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  year: Number,
  genre: String,
  description: String,
  poster: String,
  trailer: String
});

module.exports = mongoose.model("Movie", movieSchema);