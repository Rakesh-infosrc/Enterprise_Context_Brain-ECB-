import { useState, useEffect } from 'react';
import { fetchPendingApprovals, approveAction } from '@/lib/api';

export function useApprovals() {
  const [approvals, setApprovals] = useState<any[]>([]);

  const load = async () => {
    const data = await fetchPendingApprovals();
    setApprovals(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id: string) => {
    await approveAction(id);
    load();
  };

  return { approvals, reload: load, approve: handleApprove };
}
