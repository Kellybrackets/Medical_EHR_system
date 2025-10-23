import React from 'react';

interface StatusBadgeProps {
  status: 'new' | 'active' | 'follow-up' | 'inactive';
  lastVisit?: string;
  className?: string;
}

const getStatusConfig = (status: string, lastVisit?: string) => {
  // Calculate if patient needs follow-up (hasn't visited in 6+ months)
  const needsFollowUp = lastVisit ? 
    (Date.now() - new Date(lastVisit).getTime()) > (6 * 30 * 24 * 60 * 60 * 1000) : false;

  if (needsFollowUp) {
    return {
      label: 'Follow-up needed',
      className: 'bg-orange-100 text-orange-800 border-orange-200'
    };
  }

  switch (status) {
    case 'new':
      return {
        label: 'New patient',
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    case 'active':
      return {
        label: 'Active',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    case 'follow-up':
      return {
        label: 'Follow-up',
        className: 'bg-orange-100 text-orange-800 border-orange-200'
      };
    case 'inactive':
      return {
        label: 'Inactive',
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      };
    default:
      return {
        label: 'Active',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      };
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  lastVisit,
  className = ''
}) => {
  const config = getStatusConfig(status, lastVisit);

  return (
    <span 
      className={`
        inline-flex 
        items-center 
        px-2 
        py-1 
        rounded-full 
        text-xs 
        font-medium 
        border 
        ${config.className} 
        ${className}
      `}
    >
      {config.label}
    </span>
  );
};