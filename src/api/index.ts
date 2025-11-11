const API_BASE_URL = 'http://localhost:5000/api';

export const candidateApi = {
  // Get all candidates
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/candidates`);
    if (!response.ok) throw new Error('Failed to fetch candidates');
    return response.json();
  },

  // Get candidate by ID
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/candidates/${id}`);
    if (!response.ok) throw new Error('Failed to fetch candidate');
    return response.json();
  },

  // Create candidate manually
  create: async (candidateData: any) => {
    const response = await fetch(`${API_BASE_URL}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData)
    });
    if (!response.ok) throw new Error('Failed to create candidate');
    return response.json();
  },

  // Upload resume and create candidate
  uploadResume: async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/candidates/upload-resume`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload resume');
    }
    return response.json();
  },

  // Parse resume without saving (returns parsed data only)
  parseResume: async (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await fetch(`${API_BASE_URL}/candidates/parse-resume`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to parse resume');
    }
    return response.json();
  },

  // Update candidate
  update: async (id: string, candidateData: any) => {
    const response = await fetch(`${API_BASE_URL}/candidates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData)
    });
    if (!response.ok) throw new Error('Failed to update candidate');
    return response.json();
  },

  // Delete candidate
  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/candidates/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete candidate');
    return response.json();
  }
};

export const jobApi = {
  // Get all jobs
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/jobs`);
    if (!response.ok) throw new Error('Failed to fetch jobs');
    return response.json();
  },

  // Get job by ID
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`);
    if (!response.ok) throw new Error('Failed to fetch job');
    return response.json();
  },

  // Create job
  create: async (jobData: any) => {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    });
    if (!response.ok) throw new Error('Failed to create job');
    return response.json();
  },

  // Update job
  update: async (id: string, jobData: any) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    });
    if (!response.ok) throw new Error('Failed to update job');
    return response.json();
  },

  // Delete job
  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete job');
    return response.json();
  },

  // Add candidate to job
  addCandidate: async (jobId: string, candidateId: string) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/candidates/${candidateId}`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to add candidate to job');
    return response.json();
  }
};
