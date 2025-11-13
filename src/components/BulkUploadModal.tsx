import { X, Upload, Check, Edit2, Loader, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { candidateApi } from '../api';
import toast from 'react-hot-toast';

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
  };

  const handleSaveEdit = () => {
    if (editingCandidate) {
      setParsedCandidates(prev =>
        prev.map(c => (c.id === editingCandidate.id ? editingCandidate : c))
      );
      setEditingCandidate(null);
      toast.success('Candidate updated');
    }
  };

  const handleAddSingleCandidate = async (candidate: ParsedCandidate) => {
    setAdding(true);
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

      await candidateApi.uploadResume(formData);

      setParsedCandidates(prev =>
        prev.map(c => (c.id === candidate.id ? { ...c, isAdded: true } : c))
      );

      toast.success(`${candidate.name} added successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add candidate');
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

          await candidateApi.uploadResume(formData);

          setParsedCandidates(prev =>
            prev.map(c => (c.id === candidate.id ? { ...c, isAdded: true } : c))
          );
        }
      }

      toast.success('All candidates added successfully!');
      onSuccess?.();
      setTimeout(() => onClose(), 1500);
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
