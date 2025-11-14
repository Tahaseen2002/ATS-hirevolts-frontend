import { Mail, Phone, MapPin, Calendar, Award, FileText, Briefcase, ExternalLink, Edit } from 'lucide-react';
import { Candidate, WorkExperience } from '../types';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { jobApi, candidateApi } from '../api';

interface CandidateDetailProps {
  candidate: Candidate;
  onEdit?: (candidate: Candidate) => void;
}

export default function CandidateDetail({ candidate, onEdit }: CandidateDetailProps) {
  const [candidateData, setCandidateData] = useState<Candidate>(candidate);
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  // Update candidate data when prop changes
  useEffect(() => {
    setCandidateData(candidate);
    fetchAppliedJobs();
  }, [candidate]);

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
    if (candidateData.viewUrl) {
      // Use the viewUrl provided by backend
      const apiUrl = 'https://ats-portal-hirevolts.onrender.com';
      const fullUrl = `${apiUrl}${candidateData.viewUrl}`;
      console.log('Opening resume at:', fullUrl); // Debug log
      window.open(fullUrl, '_blank');
    } else if (candidateData.resumeUrl) {
      // Fallback: construct URL if viewUrl is not available
      const apiUrl = 'https://ats-portal-hirevolts.onrender.com';
      const viewUrl = `${apiUrl}/api/candidates/${candidateData.id}/view-resume`;
      console.log('Opening resume at (fallback):', viewUrl); // Debug log
      window.open(viewUrl, '_blank');
    } else {
      console.error('No resume URL available');
    }
  };

  const handleDownloadResume = () => {
    if (candidateData.resumeUrl) {
      // For download, we can use the direct Cloudinary URL
      window.open(candidateData.resumeUrl, '_blank');
    }
  };

  // Helper function to format work experience description
  const formatDescription = (description: string | string[]): string[] => {
    if (Array.isArray(description)) {
      return description;
    }
    // If it's a string, split by newlines
    return description.split('\n').filter(line => line.trim() !== '');
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
            {candidateData.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{candidateData.name}</h2>
            <p className="text-sm sm:text-base text-gray-600">{candidateData.position}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">{candidateData.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">{candidateData.phone}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">{candidateData.location}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">Applied: {candidateData.appliedDate}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="border-t border-gray-200 pt-4 sm:pt-6">
          <div className="flex items-center space-x-2 mb-3">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Experience</h3>
          </div>
          <p className="text-sm sm:text-base text-gray-700">{candidateData.experience} years of professional experience</p>
        </div>

        {/* Work Experience Section */}
        {candidateData.workExperience && candidateData.workExperience.length > 0 && (
          <div className="border-t border-gray-200 pt-4 sm:pt-6">
            <div className="flex items-center space-x-2 mb-3">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Work Experience</h3>
            </div>
            <div className="space-y-4">
              {candidateData.workExperience.map((exp: WorkExperience, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{exp.position || 'Position'}</h4>
                    <span className="text-sm text-gray-500 mt-1 sm:mt-0">{exp.duration || 'Duration'}</span>
                  </div>
                  <p className="text-blue-600 font-medium mb-2">{exp.company || 'Company'}</p>
                  {exp.description && (
                    <ul className="list-disc list-inside space-y-1">
                      {formatDescription(exp.description).map((desc: string, descIndex: number) => (
                        <li key={descIndex} className="text-sm text-gray-700">
                          {desc}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4 sm:pt-6">
          <div className="flex items-center space-x-2 mb-3">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {candidateData.skills.map((skill, index) => (
              <span
                key={index}
                className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/*  <div className="border-t border-gray-200 pt-4 sm:pt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Status</h3>
          <select
            value={candidateData.status}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 focus:outline-none focus:border-blue-600"
          >
            <option>New</option>
            <option>Screening</option>
            <option>Interview</option>
            <option>Offer</option>
            <option>Rejected</option>
          </select>
        </div> */}

        <div className="border-t border-gray-200 pt-4 sm:pt-6">
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

        <div className="border-t border-gray-200 pt-4 sm:pt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Actions</h3>
          <div className="space-y-2">
            {onEdit && (
              <button 
                onClick={() => onEdit(candidateData)}
                className="w-full bg-blue-600 text-white py-2 px-4 text-sm sm:text-base hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Candidate</span>
              </button>
            )}
            {candidateData.resumeUrl && (
              <button 
                onClick={handleViewResume}
                className="w-full border border-blue-600 text-blue-600 py-2 px-4 text-sm sm:text-base hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Resume</span>
              </button>
            )}
            {/* <button className="w-full border border-blue-600 text-blue-600 py-2 px-4 text-sm sm:text-base hover:bg-blue-50 transition-colors">
              Schedule Interview
            </button> */}
            {candidateData.resumeUrl && (
              <button 
                onClick={handleDownloadResume}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 text-sm sm:text-base hover:bg-gray-50 transition-colors"
              >
                Download Resume
              </button>
            )}
            {/* <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 text-sm sm:text-base hover:bg-gray-50 transition-colors">
              Send Email
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
}