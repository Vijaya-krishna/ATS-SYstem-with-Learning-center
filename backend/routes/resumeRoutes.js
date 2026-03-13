const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { v2: cloudinary } = require('cloudinary');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/authMiddleware');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage so we can parse the buffer AND upload to Cloudinary
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'ats_resumes',
        public_id: `${Date.now()}-${originalname.replace(/\s+/g, '_')}`,
        format: 'pdf'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// ATS Scoring Logic
const calculateATSScore = (resumeText, jobDescription) => {
  if (!resumeText || !jobDescription) return { score: 0, matches: [], missing: [] };
  
  const jdWords = jobDescription.toLowerCase().match(/\b(\w{4,})\b/g) || [];
  const uniqueJdKeywords = [...new Set(jdWords)];
  
  if (uniqueJdKeywords.length === 0) return { score: 100, matches: [], missing: [] };
  
  const resumeString = resumeText.toLowerCase();
  const matches = [];
  const missing = [];
  
  uniqueJdKeywords.forEach(keyword => {
    if (resumeString.includes(keyword)) {
      matches.push(keyword);
    } else {
      missing.push(keyword);
    }
  });
  
  let score = Math.round((matches.length / uniqueJdKeywords.length) * 100);
  if (score > 100) score = 100;

  return { 
    score, 
    matches, 
    missing: missing.slice(0, 15)
  };
};

// Upload resume and apply
router.post('/apply-with-resume', protect, authorize('candidate'), upload.single('resume'), async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;
    const file = req.file;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    // Check if already applied
    const existing = await Application.findOne({ jobId, candidateId: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    let atsScoreData = { score: 0, matches: [], missing: [] };
    let resumeLink = '';

    if (file) {
      // Parse PDF from buffer
      try {
        const pdfData = await pdfParse(file.buffer);
        const extractedText = pdfData.text;
        
        const job = await Job.findById(jobId);
        if (job) {
          atsScoreData = calculateATSScore(extractedText, job.description);
        }
      } catch (parseErr) {
        console.error("PDF Parse error", parseErr);
      }

      // Upload to Cloudinary
      try {
        const cloudResult = await uploadToCloudinary(file.buffer, file.originalname);
        resumeLink = cloudResult.secure_url; // Permanent Cloudinary URL
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        // Continue even if upload fails
      }
    }

    const application = await Application.create({
      jobId,
      candidateId: req.user.id,
      resumeLink,
      coverLetter,
      atsScore: atsScoreData.score
    });
    
    const recommendations = atsScoreData.missing.length > 0
      ? `To improve your score next time, consider adding these keywords if they match your experience: ${atsScoreData.missing.slice(0, 10).join(', ')}.`
      : "Great job! Your resume matched the job description perfectly.";

    res.status(201).json({ 
      message: 'Applied successfully', 
      application, 
      atsDetails: {
        score: atsScoreData.score,
        matchesCount: atsScoreData.matches.length,
        missingKeywords: atsScoreData.missing,
        recommendations
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Standalone Resume Scan (Candidate & Recruiter) - no storage needed
router.post('/scan', protect, authorize('candidate', 'recruiter'), upload.single('resume'), async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: 'No resume file uploaded' });
    if (!jobDescription) {
      return res.status(400).json({ message: 'Job Description is required for scanning' });
    }

    // Parse from memory buffer directly - no disk needed
    const pdfData = await pdfParse(file.buffer).catch(err => {
      console.error("PDFParse Library Error:", err);
      throw err;
    });
    const extractedText = pdfData.text;
    
    const jdWords = jobDescription.toLowerCase().match(/\b(\w{4,})\b/g) || [];
    const uniqueJdKeywords = [...new Set(jdWords)];
    
    const resumeString = extractedText.toLowerCase();
    const matches = [];
    const missing = [];

    uniqueJdKeywords.forEach(keyword => {
      if (resumeString.includes(keyword)) {
        matches.push(keyword);
      } else {
        missing.push(keyword);
      }
    });

    const score = uniqueJdKeywords.length > 0 
      ? Math.round((matches.length / uniqueJdKeywords.length) * 100) 
      : 100;

    const recommendations = missing.length > 0
      ? `To improve your score, consider adding these keywords if they match your experience: ${missing.slice(0, 10).join(', ')}.`
      : "Great job! Your resume matches the job description perfectly.";

    res.json({
      score,
      matches: matches.length,
      totalKeywords: uniqueJdKeywords.length,
      recommendations,
      missingKeywords: missing.slice(0, 15)
    });

  } catch (error) {
    console.error("Scanning Error:", error);
    res.status(500).json({ message: 'Server error during scan', error: error.message });
  }
});

module.exports = router;
