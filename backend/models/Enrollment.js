const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  progress: { type: Number, default: 0 }, // 0 to 100
  completedModules: [{ type: mongoose.Schema.Types.ObjectId }],
  completed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
