const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String }, // Text content
  videoUrl: { type: String }, // YouTube/Vimeo link
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thumbnail: { type: String },
  modules: [moduleSchema],
  category: { type: String },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
