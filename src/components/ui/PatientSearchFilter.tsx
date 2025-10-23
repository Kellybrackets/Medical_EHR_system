import React from 'react';
import { Search, Filter, X, Users } from 'lucide-react';
import { Button } from './Button';
import { SearchInput } from './SearchInput';

interface PatientSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  genderFilter: 'all' | 'Male' | 'Female';
  onGenderFilterChange: (value: 'all' | 'Male' | 'Female') => void;
  sortBy: 'name' | 'age' | 'lastVisit';
  onSortChange: (value: 'name' | 'age' | 'lastVisit') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  totalResults: number;
  onClearFilters: () => void;
  showFilters?: boolean;
  className?: string;
}

export const PatientSearchFilter: React.FC<PatientSearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  genderFilter,
  onGenderFilterChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  totalResults,
  onClearFilters,
  showFilters = true,
  className = ''
}) => {
  const hasActiveFilters = searchTerm || genderFilter !== 'all' || sortBy !== 'name';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search by name, ID number, or phone..."
            className="w-full"
            icon={<Search className="h-4 w-4 text-gray-400" />}
          />
        </div>
        
        {showFilters && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClearFilters}
              disabled={!hasActiveFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Filters and Sort */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Gender Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={genderFilter}
              onChange={(e) => onGenderFilterChange(e.target.value as 'all' | 'Male' | 'Female')}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'name' | 'age' | 'lastVisit')}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="name">Name</option>
              <option value="age">Age</option>
              <option value="lastVisit">Last Visit</option>
            </select>
            
            <button
              onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              <div className={`text-gray-500 transform transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}>
                ↑
              </div>
            </button>
          </div>

          {/* Results Count */}
          <div className="flex items-center gap-1 text-sm text-gray-600 ml-auto">
            <Users className="h-4 w-4" />
            <span>{totalResults} patient{totalResults !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
};