import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAccessToken } from './auth';
import { api } from './api';

type WorkerData = {
  id: number;
  cnic: string;
  full_name: string;
  phone: string;
  district: string;
  address: string;
  job_title: string;
  designation: string;
  pay_scale: string;
  payment_mode: string;
  bank_name: string;
  bank_account: string;
  eobi_number: string;
  social_security_no: string;
  date_of_joining: string;
  verification_status: string;
  created_at: string;
  employer_name: string;
  employer_ntn: string;
  verifications: any[];
  wwb_reg_no: string;
};

type WorkerContextType = {
  worker: WorkerData | null;
  loading: boolean;
  refreshWorker: () => Promise<void>;
};

const WorkerContext = createContext<WorkerContextType>({
  worker: null,
  loading: true,
  refreshWorker: async () => {},
});

export const WorkerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [worker, setWorker] = useState<WorkerData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkerData = async () => {
    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) {
        setWorker(null);
        return;
      }
      
      const res = await api.get('/workers/me');
      if (res.data?.success) {
        const w = res.data.data;
        // Generate a pseudo-registration number for the card if it doesn't exist
        const year = new Date(w.created_at).getFullYear();
        const distCode = w.district ? w.district.substring(0, 3).toUpperCase() : 'PUN';
        w.wwb_reg_no = `WWB-${distCode}-${year}-${w.id.toString().padStart(4, '0')}`;
        
        setWorker(w);
      } else {
        setWorker(null);
      }
    } catch (err) {
      console.error('Failed to fetch worker details', err);
      setWorker(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
  }, []);

  return (
    <WorkerContext.Provider value={{ worker, loading, refreshWorker: fetchWorkerData }}>
      {children}
    </WorkerContext.Provider>
  );
};

export const useWorker = () => useContext(WorkerContext);
