import React, { useState, useRef } from 'react';
import { Upload, FileText, Zap, Download, Eye, BarChart3, Target, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

const ResumeCustomizerApp = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setResumeFile(file);
    } else {
      alert('Please upload a PDF or DOCX file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setResumeFile(file);
      } else {
        alert('Please upload a PDF or DOCX file');
      }
    }
  };

  const processResume = async () => {
    if (!resumeFile || !jobDescription.trim()) {
      alert('Please upload a resume and enter a job description');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Call the actual API
      const response = await fetch('https://cvcraft-6w8a.onrender.com/api/process-resume', {
        method: 'POST',
        body: (() => {
          const formData = new FormData();
          formData.append('resume', resumeFile);
          formData.append('jobDescription', jobDescription);
          return formData;
        })(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
      setIsProcessing(false);
      setActiveTab('results');
    } catch (error) {
      console.error('Error processing resume:', error);
      setIsProcessing(false);
      alert(`Error processing resume: ${error.message}`);
    }
  };

  const downloadPDF = async () => {
    if (!results?.customizedResume) {
      alert('No customized resume available for download');
      return;
    }

    try {
      const response = await fetch('https://cvcraft-6w8a.onrender.com/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeContent: results.customizedResume,
          filename: 'customized-resume'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'customized-resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(`Error downloading PDF: ${error.message}`);
    }
  };

  const TabButton = ({ id, label, icon: Icon, active }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
        active 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-2xl">
              <Sparkles className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Resume Customization AI
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Transform your resume with AI-powered optimization. Get ATS-friendly suggestions, 
            keyword matching, and personalized improvements for any job description.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <TabButton id="upload" label="Upload Resume" icon={Upload} active={activeTab === 'upload'} />
          <TabButton id="results" label="AI Analysis" icon={BarChart3} active={activeTab === 'results'} />
          <TabButton id="preview" label="Preview" icon={Eye} active={activeTab === 'preview'} />
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'upload' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Resume Upload */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <FileText className="text-blue-600" size={28} />
                  Upload Your Resume
                </h2>
                
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                    resumeFile 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <Upload className={`mx-auto mb-4 ${resumeFile ? 'text-green-600' : 'text-gray-400'}`} size={48} />
                  
                  {resumeFile ? (
                    <div>
                      <CheckCircle className="text-green-600 mx-auto mb-2" size={24} />
                      <p className="text-green-700 font-medium">{resumeFile.name}</p>
                      <p className="text-green-600 text-sm">File uploaded successfully!</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-2">Drag and drop your resume here</p>
                      <p className="text-gray-400 text-sm mb-4">or click to browse</p>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Choose File
                  </button>
                </div>
                
                <p className="text-gray-500 text-sm mt-4 text-center">
                  Supported formats: PDF, DOCX (Max 5MB)
                </p>
              </div>

              {/* Job Description */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <Target className="text-purple-600" size={28} />
                  Job Description
                </h2>
                
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here to get personalized resume suggestions..."
                  className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
                
                <div className="mt-6">
                  <button
                    onClick={processResume}
                    disabled={isProcessing || !resumeFile || !jobDescription.trim()}
                    className={`w-full py-4 rounded-xl font-medium text-white transition-all duration-200 flex items-center justify-center gap-3 ${
                      isProcessing || !resumeFile || !jobDescription.trim()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap size={20} />
                        Analyze Resume with AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && results && (
            <div className="space-y-8">
              {/* ATS Score Dashboard */}
              <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${results.atsScore >= 80 ? 'text-green-600' : results.atsScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {results.atsScore}%
                    </div>
                    <p className="text-gray-600">ATS Score</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">{results.matchedKeywords.length}</div>
                    <p className="text-gray-600">Keywords Matched</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-2">{results.missingKeywords.length}</div>
                    <p className="text-gray-600">Missing Keywords</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">{results.skillGaps.length}</div>
                    <p className="text-gray-600">Skill Gaps</p>
                  </div>
                </div>
              </div>

              {/* Improvement Areas */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Improvement Areas</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(results.improvementAreas).map(([area, score]) => (
                    <div key={area} className="text-center">
                      <div className="relative w-20 h-20 mx-auto mb-3">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200" />
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 36}`}
                            strokeDashoffset={`${2 * Math.PI * 36 * (1 - score / 100)}`}
                            className={score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500'}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">{score}%</span>
                        </div>
                      </div>
                      <p className="capitalize font-medium text-gray-700">{area}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords Analysis */}
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <CheckCircle className="text-green-600" size={24} />
                    Matched Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {results.matchedKeywords.map((keyword, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <AlertCircle className="text-orange-600" size={24} />
                    Missing Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {results.missingKeywords.map((keyword, index) => (
                      <span key={index} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skill Gaps */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Skill Gap Analysis</h3>
                <div className="space-y-4">
                  {results.skillGaps.map((gap, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">{gap.skill}</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          gap.importance === 'High' ? 'bg-red-100 text-red-800' : 
                          gap.importance === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {gap.importance} Priority
                        </span>
                      </div>
                      <p className="text-gray-600">{gap.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">AI Recommendations</h3>
                <div className="space-y-4">
                  {results.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                      <Sparkles className="text-blue-600 mt-1" size={18} />
                      <p className="text-gray-700">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setActiveTab('preview')}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Eye size={20} />
                  Preview Customized Resume
                </button>
                
                <button
                  onClick={downloadPDF}
                  className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Download size={20} />
                  Download PDF
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preview' && results && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Customized Resume Preview</h3>
                <div className="flex gap-3">
                  <button
                    onClick={downloadPDF}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <Download size={18} />
                    Download PDF
                  </button>
                  <button className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium">
                    Download Word
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-8 min-h-96">
                {results?.customizedResume ? (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-white p-6 rounded-lg border">
                      {results.customizedResume}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center text-gray-600">
                    <FileText size={64} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">Resume Preview</p>
                    <p className="text-sm">Your customized resume would be displayed here</p>
                    <p className="text-sm mt-2">Upload a resume and enter a job description to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeCustomizerApp;