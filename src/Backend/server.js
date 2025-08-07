// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { Groq } = require('groq-sdk');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  }
});

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  try {
    await fs.access('uploads');
  } catch {
    await fs.mkdir('uploads');
  }
};

ensureUploadsDir();

// Utility function to extract text from PDF
const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`Error extracting text from PDF: ${error.message}`);
  }
};

// Utility function to extract text from DOCX
const extractTextFromDOCX = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    return result.value;
  } catch (error) {
    throw new Error(`Error extracting text from DOCX: ${error.message}`);
  }
};

// Function to analyze resume with Groq AI
const analyzeResumeWithGroq = async (resumeText, jobDescription) => {
  try {
    const prompt = `
    Analyze the following resume against the job description and provide a comprehensive analysis:

    RESUME:
    ${resumeText}

    JOB DESCRIPTION:
    ${jobDescription}

    Please provide a detailed analysis in JSON format with the following structure:
    {
      "atsScore": <number between 0-100>,
      "matchedKeywords": [<array of keywords found in both resume and job description>],
      "missingKeywords": [<array of important keywords from job description missing in resume>],
      "skillGaps": [
        {
          "skill": "<skill name>",
          "importance": "<High/Medium/Low>",
          "suggestion": "<specific suggestion to improve this skill area>"
        }
      ],
      "suggestions": [<array of specific improvement suggestions>],
      "improvementAreas": {
        "technical": <score 0-100>,
        "experience": <score 0-100>,
        "keywords": <score 0-100>,
        "formatting": <score 0-100>
      },
      "enhancedSections": {
        "summary": "<improved professional summary>",
        "skills": [<enhanced skills list>],
        "experience": "<suggestions for experience section>",
        "achievements": [<suggested achievements to highlight>]
      }
    }

    Focus on:
    1. ATS compatibility and keyword optimization
    2. Skill alignment with job requirements
    3. Experience relevance
    4. Achievement quantification
    5. Technical skill gaps
    6. Industry-specific terminology
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert resume analyzer and career coach. Provide detailed, actionable feedback to help job seekers optimize their resumes for ATS systems and hiring managers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama3-70b-8192", // or "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: 4000,
    });

    const analysisText = completion.choices[0].message.content;
    
    // Extract JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Unable to parse AI response');
    }
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
};

// Function to generate customized resume content
const generateCustomizedResume = async (resumeText, jobDescription, analysis) => {
  try {
    const prompt = `
    Based on the following resume analysis and original resume, create an optimized version:

    ORIGINAL RESUME:
    ${resumeText}

    JOB DESCRIPTION:
    ${jobDescription}

    ANALYSIS:
    ${JSON.stringify(analysis, null, 2)}

    Please generate an improved resume that:
    1. Incorporates missing keywords naturally
    2. Enhances the professional summary
    3. Quantifies achievements where possible
    4. Improves ATS compatibility
    5. Maintains the original structure but with optimizations

    Return the customized resume in a clean, professional format.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer. Create ATS-optimized, professional resumes that highlight candidate strengths while incorporating job-specific keywords naturally."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama3-70b-8192",
      temperature: 0.2,
      max_tokens: 3000,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Resume generation error:', error);
    throw new Error(`Resume generation failed: ${error.message}`);
  }
};

// Function to generate PDF resume
const generatePDFResume = async (resumeContent, outputPath) => {
  return new Promise((resolve, reject) => {
    const stream = require('fs').createWriteStream(outputPath);
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      pdfVersion: '1.5', // Ensure compatibility
      lang: 'en-US', // Set language
      info: {
        Title: 'Customized Resume',
        Author: 'Resume Customizer',
        Creator: 'Resume Customizer API'
      }
    });

    // Register fonts properly
    doc.registerFont('Helvetica', 'Helvetica');
    doc.registerFont('Helvetica-Bold', 'Helvetica-Bold');

    doc.pipe(stream);

    // Clean the content first
    const cleanContent = resumeContent.replace(/[^\x00-\x7F]/g, ''); // Remove non-ASCII characters

    const sections = cleanContent.split('\n\n');
    
    sections.forEach((section, index) => {
      if (index > 0) doc.moveDown();
      const lines = section.split('\n');
      lines.forEach((line, lineIndex) => {
        // Skip empty lines
        if (!line.trim()) return;
        
        if (lineIndex === 0 && line.includes(':')) {
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .text(line.trim(), { 
               continued: false,
               encoding: 'UTF-8' // Explicit encoding
             });
        } else {
          doc.fontSize(11)
             .font('Helvetica')
             .text(line.trim(), { 
               continued: false,
               encoding: 'UTF-8' // Explicit encoding
             });
        }
      });
    });

    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', (err) => reject(err));
  });
};


// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Resume Customizer API is running' });
});

// Process resume endpoint
app.post('/api/process-resume', upload.single('resume'), async (req, res) => {
  try {
    const { jobDescription } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    // Extract text from uploaded file
    let resumeText;
    if (req.file.mimetype === 'application/pdf') {
      resumeText = await extractTextFromPDF(req.file.path);
    } else {
      resumeText = await extractTextFromDOCX(req.file.path);
    }

    // Analyze resume with AI
    const analysis = await analyzeResumeWithGroq(resumeText, jobDescription);

    // Generate customized resume
    const customizedResume = await generateCustomizedResume(resumeText, jobDescription, analysis);

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({
      ...analysis,
      customizedResume,
      originalResume: resumeText
    });

  } catch (error) {
    console.error('Processing error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({ 
      error: 'Failed to process resume', 
      details: error.message 
    });
  }
});

// Generate PDF endpoint
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { resumeContent, filename = 'customized-resume' } = req.body;

    if (!resumeContent) {
      return res.status(400).json({ error: 'Resume content is required' });
    }

    const outputPath = path.join(__dirname, 'temp', `${filename}-${Date.now()}.pdf`);
    
    // Ensure temp directory exists
    await fs.mkdir(path.join(__dirname, 'temp'), { recursive: true });

    // Generate PDF
    await generatePDFResume(resumeContent, outputPath);

    // Send file
    res.download(outputPath, `${filename}.pdf`, async (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up temp file
      try {
        await fs.unlink(outputPath);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF', 
      details: error.message 
    });
  }
});

// Get keyword suggestions endpoint
app.post('/api/keyword-suggestions', async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const prompt = `
    Extract the most important keywords and skills from this job description:

    ${jobDescription}

    Return a JSON object with:
    {
      "technical_skills": [<array of technical skills>],
      "soft_skills": [<array of soft skills>],
      "tools_technologies": [<array of tools and technologies>],
      "industry_keywords": [<array of industry-specific terms>],
      "certifications": [<array of relevant certifications mentioned>],
      "experience_keywords": [<array of experience-related keywords>]
    }
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting relevant keywords from job descriptions for resume optimization."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama3-70b-8192",
      temperature: 0.2,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0].message.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const keywords = JSON.parse(jsonMatch[0]);
      res.json(keywords);
    } else {
      throw new Error('Unable to parse keyword extraction response');
    }

  } catch (error) {
    console.error('Keyword extraction error:', error);
    res.status(500).json({ 
      error: 'Failed to extract keywords', 
      details: error.message 
    });
  }
});

// Bulk resume analysis endpoint
app.post('/api/bulk-analyze', upload.array('resumes', 10), async (req, res) => {
  try {
    const { jobDescription } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No resume files uploaded' });
    }

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const results = [];

    for (const file of req.files) {
      try {
        // Extract text from file
        let resumeText;
        if (file.mimetype === 'application/pdf') {
          resumeText = await extractTextFromPDF(file.path);
        } else {
          resumeText = await extractTextFromDOCX(file.path);
        }

        // Analyze resume
        const analysis = await analyzeResumeWithGroq(resumeText, jobDescription);

        results.push({
          filename: file.originalname,
          analysis: analysis,
          success: true
        });

        // Clean up file
        await fs.unlink(file.path);

      } catch (error) {
        results.push({
          filename: file.originalname,
          error: error.message,
          success: false
        });

        // Clean up file on error
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
    }

    res.json({ results });

  } catch (error) {
    console.error('Bulk analysis error:', error);

    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
    }

    res.status(500).json({ 
      error: 'Failed to perform bulk analysis', 
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Resume Customizer API server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Make sure to set GROQ_API_KEY environment variable`);
});

module.exports = app;