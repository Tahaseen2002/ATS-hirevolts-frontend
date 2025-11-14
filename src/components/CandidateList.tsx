import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, X, Grid3x3, List, Upload, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Candidate } from '../types';
import CandidateDetail from './CandidateDetail';
import AddCandidateModal from './AddCandidateModal';
import BulkUploadModal from './BulkUploadModal';
import { candidateApi } from '../api';

export default function CandidateList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter candidates based on search query
  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      const nameMatch = candidate.name.toLowerCase().includes(query);
      const emailMatch = candidate.email.toLowerCase().includes(query);
      const phoneMatch = candidate.phone.toLowerCase().includes(query);
      const locationMatch = candidate.location.toLowerCase().includes(query);
      const skillsMatch = candidate.skills.some((skill) => 
        skill.toLowerCase().includes(query)
      );
      
      return nameMatch || emailMatch || phoneMatch || locationMatch || skillsMatch;
    });
  }, [candidates, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCandidates = filteredCandidates.slice(startIndex, endIndex);

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Auto-select first candidate when candidates are initially loaded
  useEffect(() => {
    if (candidates.length > 0 && !selectedCandidate) {
      setSelectedCandidate(candidates[0]);
    }
  }, [candidates]);

  // Handle selection when filtered results change
  useEffect(() => {
    if (selectedCandidate && filteredCandidates.length > 0) {
      // If selected candidate is not in filtered results, select first filtered candidate
      const isSelectedInFiltered = filteredCandidates.some(candidate => candidate.id === selectedCandidate.id);
      if (!isSelectedInFiltered) {
        setSelectedCandidate(filteredCandidates[0]);
        setCurrentPage(1); // Reset to first page when selection changes
      }
    } else if (filteredCandidates.length === 0 && selectedCandidate) {
      // Clear selection if no filtered results
      setSelectedCandidate(null);
    }
  }, [filteredCandidates, selectedCandidate]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const data = await candidateApi.getAll();
      // Transform MongoDB data to match frontend interface
      const transformedData = data.map((candidate: any) => ({
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        position: candidate.position,
        experience: candidate.experience,
        status: candidate.status,
        skills: candidate.skills || [],
        appliedDate: new Date(candidate.appliedDate).toISOString().split('T')[0],
        location: candidate.location,
        resumeUrl: candidate.resumeUrl,
        viewUrl: candidate.viewUrl // Include viewUrl from backend
      }));
      setCandidates(transformedData);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch candidates');
      console.error('Error fetching candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    fetchCandidates(); // Refresh the list
  };

  const handleEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingCandidate(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-700';
      case 'Screening':
        return 'bg-yellow-100 text-yellow-700';
      case 'Interview':
        return 'bg-purple-100 text-purple-700';
      case 'Offer':
        return 'bg-green-100 text-green-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex h-full">
      <div
        className={`${
          selectedCandidate ? 'w-full lg:w-2/5' : 'w-full'
        } transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col`}
      >
        <div className="sticky top-0 z-30 p-6 bg-white border-b border-gray-200 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Candidates</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBulkUploadModal(true)}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span>Bulk Upload</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Candidate</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, skills, location, email, or phone..."
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
              <div className="text-gray-500">Loading candidates...</div>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-4">
              {searchQuery ? (
                <div className="text-gray-500 text-center">
                  No candidates found matching your search
                </div>
              ) : (
                <>
                  <div className="text-gray-400 mb-4">
                    <Users className="w-16 h-16" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates yet</h3>
                  <p className="text-gray-500 text-center mb-6 max-w-md">
                    Get started by adding your first candidate to the system. You can add candidates individually or upload them in bulk.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-2 hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add Candidate</span>
                    </button>
                    <button
                      onClick={() => setShowBulkUploadModal(true)}
                      className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-2 hover:bg-green-700 transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Bulk Upload</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : viewMode === 'card' ? (
            <>
              <div className="p-4 space-y-3">
                {paginatedCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate)}
                  className={`p-4 border cursor-pointer transition-all ${
                    selectedCandidate?.id === candidate.id
                      ? 'bg-blue-50 border-blue-600 shadow-md'
                      : 'bg-white border-gray-200 hover:shadow-md hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium ${getStatusColor(
                        candidate.status
                      )}`}
                    >
                      {candidate.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 font-medium">{candidate.position}</p>
                  <p className="text-sm text-gray-500 mb-1">{candidate.email}</p>
                  <p className="text-sm text-gray-500 mb-3">{candidate.phone}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{candidate.experience} years</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{candidate.location}</span>
                    </div>
                    <span className="text-xs text-gray-400">Applied: {candidate.appliedDate}</span>
                  </div>
                </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredCandidates.length)} of {filteredCandidates.length} candidates
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
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Position</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Experience</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      onClick={() => setSelectedCandidate(candidate)}
                      className={`border-b cursor-pointer transition-colors ${
                        selectedCandidate?.id === candidate.id
                          ? 'bg-blue-50'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{candidate.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{candidate.position}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{candidate.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{candidate.experience} years</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{candidate.location}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium ${getStatusColor(candidate.status)}`}>
                          {candidate.status}
                        </span>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredCandidates.length)} of {filteredCandidates.length} candidates
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

      {selectedCandidate && (
        <div className="fixed lg:relative inset-0 lg:w-3/5 bg-white z-50 lg:z-auto lg:block">
          <button
            onClick={() => setSelectedCandidate(null)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <CandidateDetail 
            candidate={selectedCandidate} 
            onEdit={handleEdit}
          />
        </div>
      )}

      {showAddModal && (
        <AddCandidateModal 
          onClose={handleCloseModal} 
          onSuccess={handleAddSuccess}
          editCandidate={editingCandidate}
        />
      )}

      {showBulkUploadModal && (
        <BulkUploadModal
          onClose={() => setShowBulkUploadModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  );
}
