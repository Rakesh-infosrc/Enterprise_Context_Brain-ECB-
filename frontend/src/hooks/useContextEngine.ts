import { useState } from 'react';
import { apiClient } from '@/lib/api';

export function useContextEngine() {
  const [contextData, setContextData] = useState<any>(null);

  const inspectContext = async (projectCode: str) => {
    const res = await apiClient.get(`/context/inspect/${projectCode}`);
    setContextData(res.data);
  };

  return { contextData, inspectContext };
}
