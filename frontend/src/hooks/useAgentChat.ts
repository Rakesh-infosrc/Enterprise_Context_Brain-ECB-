import { useState } from 'react';
import { queryManagerAgent } from '@/lib/api';

export function useAgentChat() {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  const sendMessage = async (question: string) => {
    setLoading(true);
    try {
      const data = await queryManagerAgent(question);
      setMessages((prev) => [...prev, { role: 'agent', ...data }]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage };
}
