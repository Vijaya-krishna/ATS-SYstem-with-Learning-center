const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const { protect, authorize } = require('../middleware/authMiddleware');

// Apply for a job (Candidate only)
router.post('/', protect, authorize('candidate'), async (req, res) => {
  try {
    const { jobId, resumeLink, coverLetter } = req.body;
    
    // Check if already applied
    const existing = await Application.findOne({ jobId, candidateId: req.user.id });
    if (existing) return res.status(400).json({ message: 'Already applied for this job' });

    const application = await Application.create({
      jobId,
      candidateId: req.user.id,
      resumeLink,
      coverLetter
    });
    
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get applications for a candidate (Candidate only)
router.get('/my-applications', protect, authorize('candidate'), async (req, res) => {
  try {
    const applications = await Application.find({ candidateId: req.user.id }).populate('jobId');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get applications for a specific job (Recruiter only)
router.get('/job/:jobId', protect, authorize('recruiter'), async (req, res) => {
  try {
    // Optionally check if the recruiter owns the job before showing applications
    const applications = await Application.find({ jobId: req.params.jobId }).populate('candidateId', 'name email');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update application status (Recruiter only)
router.put('/:id/status', protect, authorize('recruiter'), async (req, res) => {
  try {
    const { status } = req.body;
    let application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    application.status = status;
    await application.save();
    
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all applications across the system (Admin only)
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const applications = await Application.find().populate('jobId').populate('candidateId', 'name email');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
