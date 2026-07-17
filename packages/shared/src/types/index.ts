export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'super_admin' | 'wwb_admin' | 'dept_officer' | 'employer';
  department?: string;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
}

export interface Business {
  id: string;
  ntn: string;
  business_name: string;
  industry_type?: string;
  address?: string;
  district?: string;
  contact_person?: string;
  contact_phone?: string;
  verification_status: 'pending' | 'verified' | 'flagged';
  registered_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Worker {
  id: string;
  cnic: string;
  full_name: string;
  employer_id?: string;
  job_title?: string;
  designation?: string;
  date_of_joining?: Date;
  pay_scale?: number;
  payment_mode?: 'bank' | 'cash';
  bank_account?: string;
  bank_name?: string;
  eobi_number?: string;
  social_security_no?: string;
  address?: string;
  district?: string;
  phone?: string;
  verification_status: 'pending' | 'verified' | 'flagged';
  created_at: Date;
  updated_at: Date;
}

export interface Verification {
  id: string;
  entity_type: 'worker' | 'business';
  entity_id: string;
  department: string;
  verified_by?: string;
  status: 'approved' | 'rejected' | 'pending';
  remarks?: string;
  verified_at: Date;
}
