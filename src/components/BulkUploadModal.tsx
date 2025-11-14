import { X, Upload, Check, Edit2, Loader, UserPlus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { candidateApi } from '../api';
import toast from 'react-hot-toast';
import { WorkExperience } from '../types';

interface WorkExperienceForm {
  company: string;
  position: string;
  duration: string;
  description: string;
}

interface ParsedCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  experience: number;
  location: string;
  skills: string[];
  resumePath: string;
  resumeText: string;
  workExperience?: WorkExperience[];
  isEditing?: boolean;
  isAdded?: boolean;
}

interface BulkUploadModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BulkUploadModal({ onClose, onSuccess }: BulkUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parsedCandidates, setParsedCandidates] = useState<ParsedCandidate[]>([]);
  const [editingCandidate, setEditingCandidate] = useState<ParsedCandidate | null>(null);
  const [editingWorkExperiences, setEditingWorkExperiences] = useState<WorkExperienceForm[]>([]);
  const [adding, setAdding] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
    }
  };

  const handleParseResumes = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one resume');
      return;
    }

    setParsing(true);
    const parsed: ParsedCandidate[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const result = await candidateApi.parseResume(file);
          parsed.push({
            id: `temp-${Date.now()}-${i}`,
            name: result.parsedData.name || 'Unknown',
            email: result.parsedData.email || '',
            phone: result.parsedData.phone || '',
            position: 'Not Specified',
            experience: result.parsedData.experience || 0,
            location: result.parsedData.location || '',
            skills: result.parsedData.skills || [],
            workExperience: result.parsedData.workExperience || [],
            resumePath: result.resumePath || '',
            resumeText: result.resumeText || '',
            isEditing: false,
            isAdded: false
          });
        } catch (err: any) {
          toast.error(`Failed to parse ${file.name}: ${err.message}`);
        }
      }

      setParsedCandidates(parsed);
      toast.success(`Successfully parsed ${parsed.length} resume(s)`);
    } catch (err) {
      toast.error('Error parsing resumes');
    } finally {
      setParsing(false);
    }
  };

  const handleEditCandidate = (candidate: ParsedCandidate) => {
    setEditingCandidate({ ...candidate });
    
    // Convert work experience to form format
    if (candidate.workExperience && candidate.workExperience.length > 0) {
      const formattedExperiences = candidate.workExperience.map(exp => ({
        company: exp.company || '',
        position: exp.position || '',
        duration: exp.duration || '',
        description: Array.isArray(exp.description) ? exp.description.join('\n').trim() : (exp.description || '')
      }));
      setEditingWorkExperiences(formattedExperiences);
    } else {
      setEditingWorkExperiences([{ company: '', position: '', duration: '', description: '' }]);
    }
  };

  const handleWorkExperienceChange = (index: number, field: keyof WorkExperienceForm, value: string) => {
    const updatedExperiences = [...editingWorkExperiences];
    updatedExperiences[index][field] = value;
    setEditingWorkExperiences(updatedExperiences);
  };

  const addWorkExperience = () => {
    setEditingWorkExperiences([...editingWorkExperiences, { company: '', position: '', duration: '', description: '' }]);
  };

  const removeWorkExperience = (index: number) => {
    if (editingWorkExperiences.length > 1) {
      const updatedExperiences = [...editingWorkExperiences];
      updatedExperiences.splice(index, 1);
      setEditingWorkExperiences(updatedExperiences);
    }
  };

  const handleSaveEdit = () => {
    if (editingCandidate) {
      // Format work experiences for submission - keeping description as string for backend
      const formattedWorkExperiences = editingWorkExperiences.map(exp => ({
        company: exp.company,
        position: exp.position,
        duration: exp.duration,
        description: exp.description // Keep as string, not array
      })).filter(exp => exp.company || exp.position || exp.duration || exp.description);
      
      const updatedCandidate = {
        ...editingCandidate,
        workExperience: formattedWorkExperiences
      };
      
      setParsedCandidates(prev =>
        prev.map(c => (c.id === editingCandidate.id ? updatedCandidate : c))
      );
      setEditingCandidate(null);
      setEditingWorkExperiences([]);
      toast.success('Candidate updated');
    }
  };

  const handleAddSingleCandidate = async (candidate: ParsedCandidate) => {
    setAdding(true);
    
    // Test toast to verify the system is working
    toast.success('Bulk upload toast system working!');

    try {
      // Find the original file for this candidate
      const fileIndex = parsedCandidates.indexOf(candidate);
      const file = files[fileIndex];

      if (!file) {
        throw new Error('Resume file not found');
      }

      const formData = new FormData();
      formData.append('resume', file);
      formData.append('name', candidate.name);
      formData.append('email', candidate.email);
      formData.append('phone', candidate.phone);
      formData.append('position', candidate.position);
      formData.append('experience', candidate.experience.toString());
      formData.append('location', candidate.location);
      formData.append('skills', candidate.skills.join(', '));
      formData.append('status', 'New');
      
      // Add work experience if available
      // Ensure description is sent as string, not array
      if (candidate.workExperience && candidate.workExperience.length > 0) {
        const formattedWorkExperiences = candidate.workExperience.map(exp => ({
          company: exp.company || '',
          position: exp.position || '',
          duration: exp.duration || '',
          description: Array.isArray(exp.description) ? exp.description.join('\n') : exp.description || ''
        }));
        formData.append('workExperience', JSON.stringify(formattedWorkExperiences));
      }

      await candidateApi.uploadResume(formData);

      setParsedCandidates(prev =>
        prev.map(c => (c.id === candidate.id ? { ...c, isAdded: true } : c))
      );

      toast.success(`${candidate.name} added successfully!`);
    } catch (err: any) {
      // Handle duplicate email error specifically
      // Check both err.message and err.error for the duplicate key error
      const errorMessage = err.message || '';
      const errorDetail = err.error || '';
      
      if (errorMessage.includes('E11000 duplicate key error') || errorDetail.includes('E11000 duplicate key error')) {
        toast.error('Candidate already present in list', {
          duration: 2000
        });
        // Mark as added to prevent further attempts
        setParsedCandidates(prev =>
          prev.map(c => (c.id === candidate.id ? { ...c, isAdded: true } : c))
        );
      } else {
        toast.error(err.message || 'Failed to add candidate');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleAddAllCandidates = async () => {
    setAdding(true);
    const notAddedCandidates = parsedCandidates.filter(c => !c.isAdded);

    try {
      for (let i = 0; i < notAddedCandidates.length; i++) {
        const candidate = notAddedCandidates[i];
        const fileIndex = parsedCandidates.indexOf(candidate);
        const file = files[fileIndex];

        if (file) {
          try {
            const formData = new FormData();
            formData.append('resume', file);
            formData.append('name', candidate.name);
            formData.append('email', candidate.email);
            formData.append('phone', candidate.phone);
            formData.append('position', candidate.position);
            formData.append('experience', candidate.experience.toString());
            formData.append('location', candidate.location);
            formData.append('skills', candidate.skills.join(', '));
            formData.append('status', 'New');
            
            // Add work experience if available
            // Ensure description is sent as string, not array
            if (candidate.workExperience && candidate.workExperience.length > 0) {
              const formattedWorkExperiences = candidate.workExperience.map(exp => ({
                company: exp.company || '',
                position: exp.position || '',
                duration: exp.duration || '',
                description: Array.isArray(exp.description) ? exp.description.join('\n') : exp.description || ''
              }));
              formData.append('workExperience', JSON.stringify(formattedWorkExperiences));
            }

            await candidateApi.uploadResume(formData);

            setParsedCandidates(prev =>
              prev.map(c => (c.id === candidate.id ? { ...c, isAdded: true } : c))
            );
          } catch (err: any) {
            // Handle duplicate email error specifically
            // Check both err.message and err.error for the duplicate key error
            const errorMessage = err.message || '';
            const errorDetail = err.error || '';
            
            if (errorMessage.includes('E11000 duplicate key error') || errorDetail.includes('E11000 duplicate key error')) {
              toast.error('Candidate already present in list', {
                duration: 2000
              });
              // Mark as added to prevent further attempts
              setParsedCandidates(prev =>
                prev.map(c => (c.id === candidate.id ? { ...c, isAdded: true } : c))
              );
            } else {
              toast.error(`Error adding ${candidate.name}: ${err.message}`);
            }
          }
        }
      }

      // Check if all candidates were processed
      const remainingNotAdded = parsedCandidates.filter(c => !c.isAdded).length;
      if (remainingNotAdded === 0) {
        toast.success('All candidates processed successfully!');
        onSuccess?.();
        setTimeout(() => onClose(), 1500);
      } else {
        toast.success('Candidates processed. Some already existed in the system.');
      }
    } catch (err: any) {
      toast.error('Error adding candidates');
    } finally {
      setAdding(false);
    }
  };

  const notAddedCount = parsedCandidates.filter(c => !c.isAdded).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Bulk Upload Candidates</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {parsedCandidates.length === 0 ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Multiple Resumes
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select multiple PDF, DOC, or DOCX files
                </p>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="bulk-resume-upload"
                  accept=".pdf,.doc,.docx"
                  multiple
                />
                <label
                  htmlFor="bulk-resume-upload"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Select Resumes
                </label>
              </div>

              {files.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    Selected Files ({files.length})
                  </h3>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded"
                      >
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleParseResumes}
                    disabled={parsing}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center space-x-2"
                  >
                    {parsing ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Parsing Resumes...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Parse All Resumes</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Parsed Candidates ({parsedCandidates.length})
                </h3>
                {notAddedCount > 0 && (
                  <button
                    onClick={handleAddAllCandidates}
                    disabled={adding}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add All ({notAddedCount})</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parsedCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`p-4 border rounded-lg transition-all ${
                      candidate.isAdded
                        ? 'bg-green-50 border-green-500'
                        : 'bg-white border-gray-200 hover:shadow-md cursor-pointer'
                    }`}
                    onClick={() => !candidate.isAdded && handleEditCandidate(candidate)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{candidate.name}</h4>
                      {candidate.isAdded ? (
                        <span className="flex items-center space-x-1 text-green-600 text-sm">
                          <Check className="w-4 h-4" />
                          <span>Added</span>
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCandidate(candidate);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{candidate.position}</p>
                    <p className="text-sm text-gray-500 mb-1">{candidate.email}</p>
                    <p className="text-sm text-gray-500 mb-3">{candidate.phone}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {candidate.experience} years • {candidate.location}
                      </span>
                      {!candidate.isAdded && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddSingleCandidate(candidate);
                          }}
                          disabled={adding}
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Candidate Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Edit Candidate</h3>
              <button
                onClick={() => setEditingCandidate(null)}
                className="p-2 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingCandidate.name}
                  onChange={(e) =>
                    setEditingCandidate({ ...editingCandidate, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingCandidate.email}
                  onChange={(e) =>
                    setEditingCandidate({ ...editingCandidate, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editingCandidate.phone}
                  onChange={(e) =>
                    setEditingCandidate({ ...editingCandidate, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={editingCandidate.position}
                  onChange={(e) =>
                    setEditingCandidate({ ...editingCandidate, position: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience (years)
                </label>
                <input
                  type="number"
                  value={editingCandidate.experience}
                  onChange={(e) =>
                    setEditingCandidate({
                      ...editingCandidate,
                      experience: parseInt(e.target.value) || 0
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editingCandidate.location}
                  onChange={(e) =>
                    setEditingCandidate({ ...editingCandidate, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={editingCandidate.skills.join(', ')}
                  onChange={(e) =>
                    setEditingCandidate({
                      ...editingCandidate,
                      skills: e.target.value.split(',').map((s) => s.trim())
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Work Experience Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-gray-900">Work Experience</h3>
                  <button
                    type="button"
                    onClick={addWorkExperience}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Experience
                  </button>
                </div>
                
                {editingWorkExperiences.map((exp, index) => (
                  <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-700">Experience #{index + 1}</h4>
                      {editingWorkExperiences.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWorkExperience(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Company
                        </label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleWorkExperienceChange(index, 'company', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-blue-600 text-sm"
                          placeholder="Company Name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Position
                        </label>
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => handleWorkExperienceChange(index, 'position', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-blue-600 text-sm"
                          placeholder="Position Title"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={exp.duration}
                          onChange={(e) => handleWorkExperienceChange(index, 'duration', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-blue-600 text-sm"
                          placeholder="JUN 2022 - JUL 2024"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Description
                      </label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => handleWorkExperienceChange(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-blue-600 text-sm"
                        rows={4}
                        placeholder="Enter job responsibilities and achievements (one per line)"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setEditingCandidate(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}