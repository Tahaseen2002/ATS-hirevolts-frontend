import { X, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { candidateApi } from '../api';
import { Candidate } from '../types';

interface AddCandidateModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  editCandidate?: Candidate | null;
}

export default function AddCandidateModal({ onClose, onSuccess, editCandidate }: AddCandidateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    location: '',
    skills: '',
    status: 'New'
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePath, setResumePath] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [parseMode, setParseMode] = useState<'manual' | 'resume'>('manual');

  // Pre-fill form when editing
  useEffect(() => {
    if (editCandidate) {
      setFormData({
        name: editCandidate.name,
        email: editCandidate.email,
        phone: editCandidate.phone,
        position: editCandidate.position,
        experience: editCandidate.experience.toString(),
        location: editCandidate.location,
        skills: editCandidate.skills.join(', '),
        status: editCandidate.status
      });
      setParseMode('manual'); // Edit mode is always manual
    }
  }, [editCandidate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      setParseMode('resume');
      setError('');
      setParsing(true);

      try {
        // Parse resume without saving
        const result = await candidateApi.parseResume(file);
        
        // Pre-fill form with parsed data
        setFormData({
          name: result.parsedData.name || '',
          email: result.parsedData.email || '',
          phone: result.parsedData.phone || '',
          position: formData.position || '', // Keep position if already filled
          experience: result.parsedData.experience?.toString() || '',
          location: result.parsedData.location || '',
          skills: result.parsedData.skills?.join(', ') || '',
          status: 'New'
        });
        
        // Store resume path for later use
        setResumePath(result.resumePath || '');
      } catch (err: any) {
        setError(err.message || 'Failed to parse resume');
        setResumeFile(null);
      } finally {
        setParsing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editCandidate) {
        // Update existing candidate
        await candidateApi.update(editCandidate.id, {
          ...formData,
          experience: parseFloat(formData.experience) || 0,
          skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
        });
      } else if (parseMode === 'resume' && resumeFile && resumePath) {
        // Create candidate with pre-uploaded resume
        const formDataToSend = new FormData();
        formDataToSend.append('resume', resumeFile);
        formDataToSend.append('name', formData.name);
        formDataToSend.append('email', formData.email);
        formDataToSend.append('phone', formData.phone);
        formDataToSend.append('position', formData.position);
        formDataToSend.append('experience', formData.experience);
        formDataToSend.append('location', formData.location);
        formDataToSend.append('skills', formData.skills);
        formDataToSend.append('status', formData.status);

        await candidateApi.uploadResume(formDataToSend);
      } else {
        // Manual entry
        await candidateApi.create({
          ...formData,
          experience: parseFloat(formData.experience) || 0,
          skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
        });
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || editCandidate ? 'Failed to update candidate' : 'Failed to add candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{editCandidate ? 'Edit Candidate' : 'Add New Candidate'}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {!editCandidate && (
            <div className="mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={parseMode === 'resume'}
                  onChange={(e) => setParseMode(e.target.checked ? 'resume' : 'manual')}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  Parse candidate info from resume automatically
                </span>
              </label>
            </div>
          )}
           {!editCandidate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resume Upload {parseMode === 'resume' && '*'}
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-blue-600"
                  accept=".pdf,.doc,.docx"
                  required={parseMode === 'resume'}
                  disabled={parsing}
                />
                {parsing && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Parsing resume...</span>
                  </div>
                )}
                {resumeFile && !parsing && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-green-600">
                    <Upload className="w-4 h-4" />
                    <span>{resumeFile.name} - Parsed successfully!</span>
                  </div>
                )}
              </div>
              {parseMode === 'resume' && !parsing && (
                <p className="mt-1 text-xs text-gray-500">
                  Upload a resume to auto-fill candidate information. Review and edit the parsed data before submitting.
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-blue-600"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-blue-600"
                placeholder="john@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone {parseMode === 'manual' && '*'}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-blue-600"
                placeholder="+1 234 567 8900"
                required={parseMode === 'manual'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position {parseMode === 'manual' && '*'}
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-blue-600"
                placeholder="Software Engineer"
                required={parseMode === 'manual'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience (years) {parseMode === 'manual' && '*'}
              </label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-blue-600"
                placeholder="5"
                required={parseMode === 'manual'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location {parseMode === 'manual' && '*'}
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-blue-600"
                placeholder="New York, NY"
                required={parseMode === 'manual'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills (comma separated)
            </label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-blue-600"
              placeholder="React, TypeScript, Node.js"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select 
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-blue-600"
            >
              <option value="New">New</option>
              <option value="Screening">Screening</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

         

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : editCandidate ? 'Update Candidate' : 'Add Candidate'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
