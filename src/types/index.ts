export interface WorkExperience {
  company: string;
  position: string;
  duration: string;
  description: string | string[]; // Can be either a string or array of strings
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  experience: number;
  status: 'New' | 'Screening' | 'Interview' | 'Offer' | 'Rejected' | 'Hired';
  resumeUrl?: string;
  viewUrl?: string; // Backend proxy URL for viewing resume inline
  skills: string[];
  appliedDate: string;
  location: string;
  workExperience?: WorkExperience[];
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
  minSalary?: number;
  maxSalary?: number;
  client?: string;
  postedDate: string;
  appliedCandidates: string[];
}

export interface KPI {
  label: string;
  value: number;
  change: number;
  icon: string;
}