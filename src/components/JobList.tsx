import { useState, useEffect, useMemo } from 'react';
import { Plus, X, Grid3x3, List, Search, Briefcase, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { Job } from '../types';
import JobDetail from './JobDetail';
import AddJobModal from './AddJobModal';
import { jobApi } from '../api';

export default function JobList() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasUserClosedDetail, setHasUserClosedDetail] = useState(false);
  const itemsPerPage = 10;

  // Filter jobs based on search query
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      const titleMatch = job.title.toLowerCase().includes(query);
      const locationMatch = job.location.toLowerCase().includes(query);
      const salaryMatch = job.salary.toLowerCase().includes(query);
      const requirementsMatch = job.requirements.some((req) => 
        req.toLowerCase().includes(query)
      );
      
      return titleMatch || locationMatch || salaryMatch || requirementsMatch;
    });
  }, [jobs, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchJobs();
  }, []);

  // Auto-select first job when jobs are initially loaded (only if user hasn't explicitly closed it)
  useEffect(() => {
    if (jobs.length > 0 && !selectedJob && !hasUserClosedDetail) {
      setSelectedJob(jobs[0]);
    }
  }, [jobs, selectedJob, hasUserClosedDetail]);

  // Handle selection when filtered results change
  useEffect(() => {
    if (selectedJob && filteredJobs.length > 0) {
      // If selected job is not in filtered results, select first filtered job
      const isSelectedInFiltered = filteredJobs.some(job => job.id === selectedJob.id);
      if (!isSelectedInFiltered) {
        setSelectedJob(filteredJobs[0]);
        setCurrentPage(1); // Reset to first page when selection changes
        setHasUserClosedDetail(false); // Reset flag when auto-selecting
      }
    } else if (filteredJobs.length === 0 && selectedJob) {
      // Clear selection if no filtered results
      setSelectedJob(null);
    }
  }, [filteredJobs, selectedJob]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobApi.getAll();
      // Transform MongoDB data to match frontend interface
      const transformedData = data.map((job: any) => {
        // Extract candidate IDs (handle both populated objects and plain IDs)
        const candidateIds = (job.appliedCandidates || []).map((candidate: any) => 
          typeof candidate === 'object' ? candidate._id : candidate
        );
        
        return {
          id: job._id,
          title: job.title,
          department: job.department,
          location: job.location,
          type: job.type,
          status: job.status,
          description: job.description,
          requirements: job.requirements || [],
          salary: job.salary,
          postedDate: new Date(job.postedDate).toISOString().split('T')[0],
          appliedCandidates: candidateIds
        };
      });
      setJobs(transformedData);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch jobs');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    fetchJobs(); // Refresh the list
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingJob(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-green-100 text-green-700';
      case 'Closed':
        return 'bg-red-100 text-red-700';
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Full-time':
        return 'bg-blue-100 text-blue-700';
      case 'Part-time':
        return 'bg-purple-100 text-purple-700';
      case 'Contract':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex h-full">
      <div
        className={`${
          selectedJob ? 'w-full lg:w-2/5' : 'w-full'
        } transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col`}
      >
        <div className="sticky top-0 z-30 p-6 bg-white border-b border-gray-200 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Jobs</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Job</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by job name, skills, location, or salary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center space-x-2 border-t border-gray-200 pt-4">
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center space-x-1 px-3 py-1.5 transition-colors ${
                viewMode === 'card'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              <span className="text-xs font-medium">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1 px-3 py-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-xs font-medium">Table</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading jobs...</div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-4">
              <div className="text-gray-400 mb-4">
                <Briefcase className="w-16 h-16" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs yet</h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                Get started by creating your first job posting. Add job details, requirements, and start receiving applications.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-2 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Job</span>
              </button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500 text-center">
                {searchQuery ? 'No jobs found matching your search' : 'No jobs available'}
              </div>
            </div>
          ) : viewMode === 'card' ? (
            <>
              <div className={`p-4 ${selectedJob ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
                {paginatedJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => {
                    setSelectedJob(job);
                    setHasUserClosedDetail(false);
                  }}
                  className={`p-4 border cursor-pointer transition-all ${
                    selectedJob?.id === job.id
                      ? 'bg-blue-50 border-blue-600 shadow-md'
                      : 'bg-white border-gray-200 hover:shadow-md hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium ${getStatusColor(
                        job.status
                      )}`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 font-medium">{job.department}</p>
                  <div className="flex items-center space-x-2 mb-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium ${getTypeColor(job.type)}`}
                    >
                      {job.type}
                    </span>
                    <span className="text-xs text-gray-500">{job.location}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{job.description}</p>
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700">
                      {job.salary ? job.salary.replace(/\$/g, '₹') : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Posted: {job.postedDate}</span>
                    <span className="text-xs font-medium text-blue-600">
                      {Array.isArray(job.appliedCandidates) ? job.appliedCandidates.length : 0} applicants
                    </span>
                  </div>
                </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredJobs.length)} of {filteredJobs.length} jobs
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 text-sm border rounded ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-2 text-gray-500">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white border-b-2 border-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Salary</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Applicants</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedJobs.map((job) => (
                    <tr
                      key={job.id}
                      onClick={() => {
                        setSelectedJob(job);
                        setHasUserClosedDetail(false);
                      }}
                      className={`border-b cursor-pointer transition-colors ${
                        selectedJob?.id === job.id
                          ? 'bg-blue-50'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{job.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{job.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{job.location}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium ${getTypeColor(job.type)}`}>
                          {job.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{job.salary.replace(/\$/g, '₹')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">
                        {Array.isArray(job.appliedCandidates) ? job.appliedCandidates.length : 0}
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredJobs.length)} of {filteredJobs.length} jobs
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 text-sm border rounded ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-2 text-gray-500">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedJob && (
        <div className="fixed lg:relative inset-0 lg:w-3/5 bg-white z-50 lg:z-auto lg:block">
          <button
            onClick={() => {
              setSelectedJob(null);
              setHasUserClosedDetail(true);
            }}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <JobDetail 
            job={selectedJob} 
            onEdit={handleEdit}
            onRefresh={fetchJobs}
            onClose={() => {
              setSelectedJob(null);
              setHasUserClosedDetail(true);
            }}
          />
        </div>
      )}

      {showAddModal && (
        <AddJobModal 
          onClose={handleCloseModal} 
          onSuccess={handleAddSuccess}
          editJob={editingJob}
        />
      )}
    </div>
  );
}
