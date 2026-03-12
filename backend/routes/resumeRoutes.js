const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/authMiddleware');

// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

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
    missing: missing.slice(0, 15) // Limit missing keywords for UI
  };
};

// Upload resume and apply
router.post('/apply-with-resume', protect, authorize('candidate'), upload.single('resume'), async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;
    const file = req.file;

    if (!jobId) {
       if (file) fs.unlinkSync(file.path); // clean up
       return res.status(400).json({ message: 'Job ID is required' });
    }

    // Check if already applied
    const existing = await Application.findOne({ jobId, candidateId: req.user.id });
    if (existing) {
       if (file) fs.unlinkSync(file.path);
       return res.status(400).json({ message: 'Already applied for this job' });
    }

    let atsScoreData = { score: 0, matches: [], missing: [] };
    let resumeLink = '';

    if (file) {
       resumeLink = `/uploads/${file.filename}`;
       
       // Parse PDF
       try {
         const dataBuffer = fs.readFileSync(file.path);
         const pdfData = await pdfParse(dataBuffer); // Fix: use pdfParse directly instead of new PDFParse
         const extractedText = pdfData.text;
         
         // Fetch Job to get description
         const job = await Job.findById(jobId);
         if (job) {
            atsScoreData = calculateATSScore(extractedText, job.description);
         }
       } catch (parseErr) {
         console.error("PDF Parse error", parseErr);
         // Continue even if parsing fails, but score remains 0
       }
    }

    const application = await Application.create({
      jobId,
      candidateId: req.user.id,
      resumeLink,
      coverLetter,
      atsScore: atsScoreData.score
    });
    
    // Recommendations logic
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
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Server error' });
  }
});

// Standalone Resume Scan (Candidate & Recruiter)
router.post('/scan', protect, authorize('candidate', 'recruiter'), upload.single('resume'), async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: 'No resume file uploaded' });
    if (!jobDescription) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: 'Job Description is required for scanning' });
    }

    const dataBuffer = fs.readFileSync(file.path);
    // Use the standard PDFParse promise
    const pdfData = await pdfParse(dataBuffer).catch(err => {
      console.error("PDFParse Library Error:", err);
      throw err;
    });
    const extractedText = pdfData.text;
    
    // Cleanup file immediately after parsing as it's just a scan
    if (fs.existsSync(file.path)) {
       fs.unlinkSync(file.path);
    }

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

    // Recommendations logic
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
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch(e){}
    }
    res.status(500).json({ message: 'Server error during scan', error: error.message });
  }
});

module.exports = router;
