const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().populate('instructorId', 'name');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my enrollments
router.get('/my/enrollments', protect, authorize('candidate'), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ candidateId: req.user.id }).populate('courseId');
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single course (Move below /my/enrollments)
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructorId', 'name');
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create course (Admin or Recruiter)
router.post('/', protect, authorize('admin', 'recruiter'), async (req, res) => {
  try {
    const { title, description, modules, category, level } = req.body;
    const course = await Course.create({
      title,
      description,
      modules,
      category,
      level,
      instructorId: req.user.id
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Enroll in a course (Candidate)
router.post('/:id/enroll', protect, authorize('candidate'), async (req, res) => {
  try {
    console.log(`Enrollment attempt for course: ${req.params.id} by user: ${req.user.id}`);
    const existing = await Enrollment.findOne({ courseId: req.params.id, candidateId: req.user.id });
    if (existing) {
      console.log('User already enrolled');
      return res.status(400).json({ message: 'Already enrolled' });
    }

    const enrollment = await Enrollment.create({
      courseId: req.params.id,
      candidateId: req.user.id
    });
    console.log('Enrollment successful');
    res.status(201).json(enrollment);
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update progress
router.put('/enrollment/:id/progress', protect, authorize('candidate'), async (req, res) => {
  try {
    const { progress, completedModuleId } = req.body;
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    if (progress !== undefined) enrollment.progress = progress;
    if (completedModuleId) enrollment.completedModules.push(completedModuleId);
    
    if (enrollment.progress >= 100) enrollment.completed = true;

    await enrollment.save();
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update course (Admin or Recruiter)
router.put('/:id', protect, authorize('admin', 'recruiter'), async (req, res) => {
  try {
    const { title, description, modules, category, level, thumbnail } = req.body;
    const course = await Course.findById(req.params.id);
    
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    // Check ownership (only instructor or admin can edit)
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this course' });
    }

    course.title = title || course.title;
    course.description = description || course.description;
    course.modules = modules || course.modules;
    course.category = category || course.category;
    course.level = level || course.level;
    course.thumbnail = thumbnail || course.thumbnail;

    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete course (Admin or Recruiter)
router.delete('/:id', protect, authorize('admin', 'recruiter'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Check ownership
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    await Course.findByIdAndDelete(req.params.id);
    // Also delete enrollments
    await Enrollment.deleteMany({ courseId: req.params.id });
    
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
