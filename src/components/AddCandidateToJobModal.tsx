import { X, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { candidateApi, jobApi } from '../api';

interface AddCandidateToJobModalProps {
  jobId: string;
  jobTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddCandidateToJobModal({ jobId, jobTitle, onClose, onSuccess }: AddCandidateToJobModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [addedCandidates, setAddedCandidates] = useState<Set<string>>(new Set());
  const [currentJobCandidates, setCurrentJobCandidates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCandidatesAndJob();
  }, []);

  const fetchCandidatesAndJob = async () => {
    try {
      setLoading(true);
      // Fetch all candidates
      const candidatesData = await candidateApi.getAll();
      const transformedData = candidatesData.map((candidate: any) => ({
        id: candidate._id,
        name: candidate.name,
        position: candidate.position,
        email: candidate.email
      }));
      setCandidates(transformedData);

      // Fetch current job to get already assigned candidates
      const jobData = await jobApi.getById(jobId);
      
      // Extract candidate IDs (handle both populated objects and plain IDs)
      const candidateIds = (jobData.appliedCandidates || []).map((candidate: any) => 
        typeof candidate === 'object' ? candidate._id : candidate
      );
      const jobCandidateIds = new Set<string>(candidateIds);
      setCurrentJobCandidates(jobCandidateIds);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async (candidateId: string) => {
    try {
      setAdding(candidateId);
      await jobApi.addCandidate(jobId, candidateId);
      
      // Add to local added list
      setAddedCandidates(prev => new Set(prev).add(candidateId));
      
      // Call success callback to refresh job details
      onSuccess?.();
      
      // Show success message
      const candidate = candidates.find(c => c.id === candidateId);
      toast.success(`${candidate?.name} added to job successfully!`);
    } catch (err: any) {
      console.error('Error adding candidate to job:', err);
      const errorMessage = err.message || 'Failed to add candidate to job';
      
      // Check if candidate is already assigned
      if (errorMessage.includes('already') || errorMessage.includes('assigned')) {
        toast.error('This candidate is already assigned to this job');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setAdding(null);
    }
  };

  // Filter out candidates already assigned or just added
  const availableCandidates = candidates.filter(
    (candidate) =>
      !currentJobCandidates.has(candidate.id) &&
      !addedCandidates.has(candidate.id) &&
      (candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
       candidate.position.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Candidate to Job</h2>
            <p className="text-sm text-gray-600">{jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="space-y-2 mb-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading candidates...</div>
            ) : availableCandidates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery 
                  ? 'No candidates found matching your search' 
                  : currentJobCandidates.size > 0 || addedCandidates.size > 0
                  ? 'All candidates have been assigned to this job'
                  : 'No candidates available'}
              </div>
            ) : (
              availableCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="p-3 border border-gray-200 hover:border-blue-600 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                    <p className="text-sm text-gray-600">{candidate.position}</p>
                    <p className="text-xs text-gray-500">{candidate.email}</p>
                  </div>
                  <button 
                    onClick={() => handleAddCandidate(candidate.id)}
                    disabled={adding === candidate.id}
                    className="px-3 py-1 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {adding === candidate.id ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
              ))
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full border border-gray-300 text-gray-700 py-2 px-4 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
