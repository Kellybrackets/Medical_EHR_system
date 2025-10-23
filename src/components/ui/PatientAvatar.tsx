import React from 'react';

interface PatientAvatarProps {
  firstName: string;
  surname: string;
  gender: 'Male' | 'Female' | 'Other';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const getGenderColor = (gender: string) => {
  switch (gender.toLowerCase()) {
    case 'male':
      return 'bg-blue-500 text-white';
    case 'female':
      return 'bg-pink-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const getSizeClasses = (size: string) => {
  switch (size) {
    case 'sm':
      return 'w-8 h-8 text-xs';
    case 'lg':
      return 'w-12 h-12 text-lg';
    case 'xl':
      return 'w-16 h-16 text-xl';
    default:
      return 'w-10 h-10 text-sm';
  }
};

export const PatientAvatar: React.FC<PatientAvatarProps> = ({
  firstName,
  surname,
  gender,
  size = 'md',
  className = ''
}) => {
  const initials = `${firstName.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  const colorClass = getGenderColor(gender);
  const sizeClass = getSizeClasses(size);

  return (
    <div 
      className={`
        ${sizeClass} 
        ${colorClass} 
        ${className}
        rounded-full 
        flex 
        items-center 
        justify-center 
        font-semibold 
        shadow-sm
        transition-all
        duration-200
        hover:shadow-md
      `}
      title={`${firstName} ${surname} (${gender})`}
    >
      {initials}
    </div>
  );
};