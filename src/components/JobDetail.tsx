import { MapPin, Calendar, DollarSign, Briefcase, Users, Plus, Edit, Trash2 } from 'lucide-react';
import { Job } from '../types';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AddCandidateToJobModal from './AddCandidateToJobModal';
import { jobApi, candidateApi } from '../api';

interface JobDetailProps {
  job: Job;
  onEdit?: (job: Job) => void;
  onRefresh?: () => void;
  onClose?: () => void;
}

export default function JobDetail({ job, onEdit, onRefresh, onClose }: JobDetailProps) {
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [appliedCandidates, setAppliedCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [job.id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const jobData = await jobApi.getById(job.id);
      
      console.log('Job Data:', jobData);
      console.log('Applied Candidates in job:', jobData.appliedCandidates);
      
      // Check if appliedCandidates are already populated (objects) or just IDs
      if (jobData.appliedCandidates && jobData.appliedCandidates.length > 0) {
        const firstCandidate = jobData.appliedCandidates[0];
        
        // If already populated (object with _id), use directly
        if (typeof firstCandidate === 'object' && firstCandidate._id) {
          console.log('Candidates already populated');
          const candidateDetails = jobData.appliedCandidates.map((candidate: any) => ({
            id: candidate._id,
            name: candidate.name,
            position: candidate.position,
            status: candidate.status
          }));
          setAppliedCandidates(candidateDetails);
        } else {
          // If just IDs, fetch each candidate
          console.log('Fetching details for', jobData.appliedCandidates.length, 'candidates');
          const candidateDetails = await Promise.all(
            jobData.appliedCandidates.map(async (candidateId: string) => {
              try {
                console.log('Fetching candidate:', candidateId);
                const candidate = await candidateApi.getById(candidateId);
                console.log('Candidate data:', candidate);
                return {
                  id: candidate._id,
                  name: candidate.name,
                  position: candidate.position,
                  status: candidate.status
                };
              } catch (err) {
                console.error('Error fetching candidate:', candidateId, err);
                return null;
              }
            })
          );
          const validCandidates = candidateDetails.filter(c => c !== null);
          console.log('Valid candidates:', validCandidates);
          setAppliedCandidates(validCandidates);
        }
      } else {
        console.log('No candidates in job');
        setAppliedCandidates([]);
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setStatusUpdating(true);
      await jobApi.update(job.id, { status: newStatus });
      toast.success('Job status updated successfully!');
      onRefresh?.();
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update job status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      await jobApi.delete(job.id);
      toast.success('Job deleted successfully!');
      onRefresh?.();
      // Close the detail panel and return to job list
      setTimeout(() => {
        onClose?.();
      }, 500);
    } catch (err) {
      console.error('Error deleting job:', err);
      toast.error('Failed to delete job');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{job.title}</h2>
            <p className="text-base sm:text-lg text-gray-600">{job.department}</p>
          </div>
          {onEdit && (
            <button 
              onClick={() => onEdit(job)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors whitespace-nowrap flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Job</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">{job.location}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Briefcase className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">{job.type}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">Posted: {job.postedDate}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <DollarSign className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">{job.salary}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="border-t border-gray-200 pt-4 sm:pt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
          <p className="text-sm sm:text-base text-gray-700">{job.description}</p>
        </div>

        <div className="border-t border-gray-200 pt-4 sm:pt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
          <ul className="space-y-2">
            {job.requirements.map((req, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-sm sm:text-base text-gray-700">{req}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-gray-200 pt-4 sm:pt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Status</h3>
          <select
            value={job.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={statusUpdating}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 focus:outline-none focus:border-blue-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>

        <div className="border-t border-gray-200 pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Applied Candidates ({appliedCandidates.length})
              </h3>
            </div>
            <button
              onClick={() => setShowAddCandidateModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 text-xs sm:text-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Add Candidate</span>
            </button>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {loading ? (
              <div className="text-center py-4 text-gray-500 text-sm">Loading candidates...</div>
            ) : appliedCandidates.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">No candidates applied yet</div>
            ) : (
              appliedCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="p-3 border border-gray-200 hover:border-blue-600 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm sm:text-base text-gray-900 truncate">{candidate.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600">{candidate.position}</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium whitespace-nowrap ml-2">
                    {candidate.status}
                  </span>
                </div>
              </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 sm:pt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Actions</h3>
          <div className="space-y-2">
            <button 
              onClick={handleDeleteJob}
              className="w-full border border-red-300 text-red-600 py-2 px-4 text-sm sm:text-base hover:bg-red-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Job</span>
            </button>
          </div>
        </div>
      </div>

      {showAddCandidateModal && (
        <AddCandidateToJobModal
          jobId={job.id}
          jobTitle={job.title}
          onClose={() => setShowAddCandidateModal(false)}
          onSuccess={() => {
            fetchJobDetails();
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
