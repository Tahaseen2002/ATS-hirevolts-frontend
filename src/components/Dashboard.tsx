import { Users, Briefcase, CheckCircle, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DashboardStats {
  summary: {
    totalCandidates: number;
    totalJobs: number;
    openJobs: number;
    closedJobs: number;
    recentCandidates: number;
    activeApplications: number;
  };
  candidatesByStatus: Array<{ status: string; count: number }>;
  jobsByDepartment: Array<{ department: string; count: number }>;
  candidatesByExperience: Array<{ range: string; count: number }>;
  topSkills: Array<{ skill: string; count: number }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('https://ats-portal-hirevolts.onrender.com/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'users':
        return <Users className="w-8 h-8" />;
      case 'briefcase':
        return <Briefcase className="w-8 h-8" />;
      case 'check':
        return <CheckCircle className="w-8 h-8" />;
      case 'trending':
        return <TrendingUp className="w-8 h-8" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Failed to load dashboard data</div>
        </div>
      </div>
    );
  }

  const kpis = [
    { 
      label: 'Total Candidates', 
      value: stats.summary.totalCandidates, 
      change: 12, 
      icon: 'users' 
    },
    { 
      label: 'Open Positions', 
      value: stats.summary.openJobs, 
      change: 3, 
      icon: 'briefcase' 
    },
    { 
      label: 'Active Applications', 
      value: stats.summary.activeApplications, 
      change: 15, 
      icon: 'check' 
    },
    { 
      label: 'Recent Candidates', 
      value: stats.summary.recentCandidates, 
      change: 8, 
      icon: 'trending' 
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-blue-600">{getIcon(kpi.icon)}</div>
              <span
                className={`text-sm font-semibold ${
                  kpi.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {kpi.change > 0 ? '+' : ''}{kpi.change}%
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{kpi.label}</h3>
            <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Candidates by Status</h3>
          <div className="space-y-4">
            {stats.candidatesByStatus.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium capitalize">{item.status}</span>
                  <span className="text-gray-900 font-bold">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 h-2">
                  <div
                    className="bg-blue-600 h-2"
                    style={{ width: `${(item.count / stats.summary.totalCandidates) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Top Skills</h3>
          <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
            <div className="space-y-3">
              {stats.topSkills.slice(0, 8).map((skill, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700">{skill.skill}</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    {skill.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
