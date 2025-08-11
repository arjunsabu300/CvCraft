// src/services/api.js
// Frontend API client for Resume Customizer

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://cvcraft-6w8a.onrender.com/api';

class ResumeCustomizerAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method for making API requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Remove Content-Type for FormData requests
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Handle file downloads
      if (options.isFileDownload) {
        return response;
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Process resume with job description
  async processResume(resumeFile, jobDescription) {
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jobDescription);

    return this.request('/process-resume', {
      method: 'POST',
      body: formData,
    });
  }

  // Generate PDF of customized resume
  async generatePDF(resumeContent, filename = 'customized-resume') {
    return this.request('/generate-pdf', {
      method: 'POST',
      body: JSON.stringify({ resumeContent, filename }),
      isFileDownload: true,
    });
  }

  // Get keyword suggestions from job description
  async getKeywordSuggestions(jobDescription) {
    return this.request('/keyword-suggestions', {
      method: 'POST',
      body: JSON.stringify({ jobDescription }),
    });
  }

  // Bulk analyze multiple resumes
  async bulkAnalyzeResumes(resumeFiles, jobDescription) {
    const formData = new FormData();
    resumeFiles.forEach(file => {
      formData.append('resumes', file);
    });
    formData.append('jobDescription', jobDescription);

    return this.request('/bulk-analyze', {
      method: 'POST',
      body: formData,
    });
  }

  // Download file helper
  async downloadFile(response, filename) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

// Create singleton instance
const apiClient = new ResumeCustomizerAPI();

// Export both the class and instance
export { ResumeCustomizerAPI };
export default apiClient;

// React hooks for API operations
export const useResumeAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const processResume = async (resumeFile, jobDescription) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.processResume(resumeFile, jobDescription);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const downloadPDF = async (resumeContent, filename) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.generatePDF(resumeContent, filename);
      await apiClient.downloadFile(response, `${filename}.pdf`);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const getKeywords = async (jobDescription) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getKeywordSuggestions(jobDescription);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return {
    loading,
    error,
    processResume,
    downloadPDF,
    getKeywords,
    clearError: () => setError(null),
  };
};

// Error boundary for API errors
export const APIErrorBoundary = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (event) => {
      if (event.error && event.error.message.includes('API')) {
        setHasError(true);
        setError(event.error);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return fallback || (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">API Error</h3>
        <p className="text-red-600 text-sm">{error?.message || 'Something went wrong with the API request'}</p>
        <button
          onClick={() => {
            setHasError(false);
            setError(null);
          }}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return children;
};