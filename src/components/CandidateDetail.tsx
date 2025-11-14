import { Mail, Phone, MapPin, Calendar, Award, FileText, Briefcase, ExternalLink, Edit } from 'lucide-react';
import { Candidate } from '../types';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { jobApi } from '../api';

interface CandidateDetailProps {
  candidate: Candidate;
  onEdit?: (candidate: Candidate) => void;
}

export default function CandidateDetail({ candidate, onEdit }: CandidateDetailProps) {
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [activeTab, setActiveTab] = useState<'detail' | 'appliedJobs'>('detail');

  useEffect(() => {
    fetchAppliedJobs();
  }, [candidate.id]);

  const fetchAppliedJobs = async () => {
    try {
      setLoading(true);
      // Fetch all jobs
      const allJobs = await jobApi.getAll();
      
      console.log('All jobs:', allJobs);
      console.log('Current candidate ID:', candidate.id);
      
      // Separate applied jobs and available jobs
      const applied: any[] = [];
      const available: any[] = [];
      
      allJobs.forEach((job: any) => {
        const hasApplied = job.appliedCandidates && job.appliedCandidates.some((jobCandidate: any) => {
          const candidateId = typeof jobCandidate === 'object' ? jobCandidate._id : jobCandidate;
          return candidateId === candidate.id;
        });
        
        const jobData = {
          id: job._id,
          title: job.title,
          department: job.department,
          status: job.status,
          appliedDate: new Date(job.postedDate).toISOString().split('T')[0]
        };
        
        if (hasApplied) {
          applied.push(jobData);
        } else if (job.status === 'Open') {
          // Only show open jobs in available list
          available.push(jobData);
        }
      });
      
      console.log('Applied jobs:', applied);
      console.log('Available jobs:', available);
      
      setAppliedJobs(applied);
      setAvailableJobs(available);
    } catch (err) {
      console.error('Error fetching applied jobs:', err);
      setAppliedJobs([]);
      setAvailableJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = (jobId: string) => {
    window.open(`/jobs/${jobId}`, '_blank');
  };

  const handleApplyToJob = async () => {
    if (!selectedJobId) {
      toast.error('Please select a job');
      return;
    }

    try {
      setApplying(true);
      await jobApi.addCandidate(selectedJobId, candidate.id);
      toast.success('Successfully applied to job!');
      setSelectedJobId('');
      // Refresh the jobs list
      fetchAppliedJobs();
    } catch (err: any) {
      console.error('Error applying to job:', err);
      const errorMessage = err.message || 'Failed to apply to job';
      if (errorMessage.includes('already')) {
        toast.error('Already applied to this job');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setApplying(false);
    }
  };

  const handleViewResume = () => {
    if (candidate.viewUrl) {
      // Use the viewUrl provided by backend
      const apiUrl = 'https://ats-portal-hirevolts.onrender.com';
      const fullUrl = `${apiUrl}${candidate.viewUrl}`;
      console.log('Opening resume at:', fullUrl); // Debug log
      window.open(fullUrl, '_blank');
    } else if (candidate.resumeUrl) {
      // Fallback: construct URL if viewUrl is not available
      const apiUrl = 'https://ats-portal-hirevolts.onrender.com';
      const viewUrl = `${apiUrl}/api/candidates/${candidate.id}/view-resume`;
      console.log('Opening resume at (fallback):', viewUrl); // Debug log
      window.open(viewUrl, '_blank');
    } else {
      console.error('No resume URL available');
    }
  };

  const handleDownloadResume = () => {
    if (candidate.resumeUrl) {
      // For download, we can use the direct Cloudinary URL
      window.open(candidate.resumeUrl, '_blank');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
            {candidate.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{candidate.name}</h2>
            <p className="text-sm sm:text-base text-gray-600">{candidate.position}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">{candidate.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">{candidate.phone}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">{candidate.location}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">Applied: {candidate.appliedDate}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-t border-gray-200 mt-4 sm:mt-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('detail')}
            className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-colors border-b-2 ${
              activeTab === 'detail'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Detail
          </button>
          <button
            onClick={() => setActiveTab('appliedJobs')}
            className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-colors border-b-2 ${
              activeTab === 'appliedJobs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Applied Jobs
          </button>
        </div>

        {/* Tab Content */}
        <div className="pt-4 sm:pt-6">
          {activeTab === 'detail' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Experience</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-700">{candidate.experience} years of professional experience</p>
              </div>

              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <div className="flex items-center space-x-2 mb-3">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Actions</h3>
                <div className="space-y-2">
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(candidate)}
                      className="w-full bg-blue-600 text-white py-2 px-4 text-sm sm:text-base hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Candidate</span>
                    </button>
                  )}
                  {candidate.resumeUrl && (
                    <button 
                      onClick={handleViewResume}
                      className="w-full border border-blue-600 text-blue-600 py-2 px-4 text-sm sm:text-base hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View Resume</span>
                    </button>
                  )}
                  {candidate.resumeUrl && (
                    <button 
                      onClick={handleDownloadResume}
                      className="w-full border border-gray-300 text-gray-700 py-2 px-4 text-sm sm:text-base hover:bg-gray-50 transition-colors"
                    >
                      Download Resume
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appliedJobs' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Applied Jobs ({appliedJobs.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {loading ? (
                    <div className="text-center py-4 text-gray-500 text-sm">Loading applied jobs...</div>
                  ) : appliedJobs.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">No jobs applied yet</div>
                  ) : (
                    appliedJobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => handleJobClick(job.id)}
                        className="p-3 border border-gray-200 hover:border-blue-600 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm sm:text-base text-gray-900 truncate">{job.title}</h4>
                            <p className="text-xs sm:text-sm text-gray-600">{job.department}</p>
                            <p className="text-xs text-gray-500 mt-1">Applied: {job.appliedDate}</p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium whitespace-nowrap ml-2">
                            {job.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Apply to Job</h3>
                {loading ? (
                  <div className="text-center py-4 text-gray-500 text-sm">Loading jobs...</div>
                ) : availableJobs.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No open positions available at the moment
                  </div>
                ) : (
                  <>
                    <select 
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 focus:outline-none focus:border-blue-600 mb-3"
                      disabled={applying}
                    >
                      <option value="">Select a job...</option>
                      {availableJobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title} - {job.department}
                        </option>
                      ))}
                    </select>
                    <button 
                      onClick={handleApplyToJob}
                      disabled={!selectedJobId || applying}
                      className="w-full bg-blue-600 text-white py-2 px-4 text-sm sm:text-base hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {applying ? 'Applying...' : 'Apply to Selected Job'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
