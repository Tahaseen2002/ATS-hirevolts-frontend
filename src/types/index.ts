export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  experience: number;
  status: 'New' | 'Screening' | 'Interview' | 'Offer' | 'Rejected';
  resumeUrl?: string;
  skills: string[];
  appliedDate: string;
  location: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  status: 'Open' | 'Closed' | 'On Hold';
  description: string;
  requirements: string[];
  salary: string;
  postedDate: string;
  appliedCandidates: string[];
}

export interface KPI {
  label: string;
  value: number;
  change: number;
  icon: string;
}
