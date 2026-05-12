import React from 'react';

const Badge = ({ children, type = 'neutral', className = '' }) => {
  const types = {
    income: "bg-success/10 text-success border-success/20",
    expense: "bg-danger/10 text-danger border-danger/20",
    neutral: "bg-neutral-muted/10 text-neutral-muted border-neutral-muted/20",
    primary: "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-chip text-xs font-medium border ${types[type]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
