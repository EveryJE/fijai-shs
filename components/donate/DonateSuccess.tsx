import React from 'react';

interface DonateSuccessProps {
  message?: string;
}

export const DonateSuccess: React.FC<DonateSuccessProps> = ({ message }) => (
  <div style={{ textAlign: 'center', padding: 32 }}>
    <h3>Thank you for your donation!</h3>
    <p>{message || 'Your payment was successful.'}</p>
  </div>
);
