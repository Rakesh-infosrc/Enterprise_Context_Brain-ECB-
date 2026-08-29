import React from 'react';
import { getActiveUserEmail, getActiveApiKey, setPersona } from '../lib/api';
import { UserCheck } from 'lucide-react';

const personas = [
  { name: 'Shathya (Master)', email: 'shathya@acmefin.com', apiKey: '', role: 'Master Access' },
  { name: 'Siva (Manager)', email: 'siva@acmefin.com', apiKey: '', role: 'Manager' },
  { name: 'Rakesh (Member)', email: 'rakesh@acmefin.com', apiKey: '', role: 'Siva\'s Team' },
  { name: 'Prasanna (Manager)', email: 'prasanna@acmefin.com', apiKey: '', role: 'Manager' },
  { name: 'Gowtham (Manager)', email: 'gowtham@acmefin.com', apiKey: '', role: 'Manager' },
  { name: 'Reena (Member)', email: 'reena@acmefin.com', apiKey: '', role: 'Gowtham\'s Team' },
  { name: 'Raj (Manager)', email: 'raj@acmefin.com', apiKey: '', role: 'Manager' },
  { name: 'Ramu (Key-Based)', email: 'ramu@acmefin.com', apiKey: 'key-ramu-12345', role: 'Raj\'s Team (Key)' },
  { name: 'Mayoori (Key-Based)', email: 'mayoori@acmefin.com', apiKey: 'key-mayoori-67890', role: 'Raj\'s Team (Key)' },
  { name: 'Lavanya (Member)', email: 'lavanya@acmefin.com', apiKey: '', role: 'Raj\'s Team' }
];

export const PersonaSwitcher: React.FC = () => {
  const currentEmail = getActiveUserEmail();

  const handlePersonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = personas.find(p => p.email === e.target.value);
    if (selected) {
      setPersona(selected.email, selected.apiKey);
      window.location.reload();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative' }}>
      <UserCheck size={14} color="#35d07f" />
      <select
        value={currentEmail}
        onChange={handlePersonaChange}
        className="glass-input"
        style={{
          fontSize: 'var(--fs-2xs)',
          fontWeight: 600,
          padding: '0.35rem 1.8rem 0.35rem 0.65rem',
          appearance: 'none',
          cursor: 'pointer',
          background: 'rgba(53, 208, 127, 0.08)',
          borderColor: 'rgba(53, 208, 127, 0.3)',
          color: '#35d07f',
          borderRadius: 'var(--radius-sm)',
          width: 'auto',
          minWidth: '150px',
        }}
      >
        {personas.map((p) => (
          <option key={p.email} value={p.email} style={{ background: '#07111f', color: '#ffffff' }}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
};
