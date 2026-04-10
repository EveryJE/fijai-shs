import React from 'react';

interface DonateHeaderProps {
  alias?: string;
  holderName?: string;
}

export const DonateHeader: React.FC<DonateHeaderProps> = ({ alias, holderName }) => (
  <div style={{ borderBottom: '1px solid #eee', marginBottom: 24, paddingBottom: 16 }}>
    <h2>Donate to {holderName || alias || '...'}</h2>
    {alias && holderName && (
      <div style={{ color: '#888', fontSize: 14 }}>({alias})</div>
    )}
  </div>
);
