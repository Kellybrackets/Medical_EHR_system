import React, { useState, useMemo } from 'react';
import { Calendar, FileText, Plus, Search, Filter, ChevronDown, ChevronUp, Stethoscope, User } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';
import { useConsultationNotes } from '../../hooks/useConsultationNotes';
import { formatDate, normalizeSearchTerm } from '../../utils/helpers';

interface ConsultationHistoryProps {
  patientId: string;
  onAddConsultation?: () => void;
  canAddConsultation?: boolean;
}

interface SOAPNote {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

interface ConsultationNote {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  reasonForVisit: string;
  soap?: SOAPNote;
  icd10Code?: string;
  createdAt: string;
}

export const ConsultationHistory: React.FC<ConsultationHistoryProps> = ({
  patientId,
  onAddConsultation,
  canAddConsultation = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedConsultations, setExpandedConsultations] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'last30' | 'last90' | 'lastyear'>('all');
  
  const { consultationNotes, loading } = useConsultationNotes();

  const patientConsultations = useMemo(() => {
    let consultations = consultationNotes
      .filter(note => note.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'last30':
          filterDate.setDate(now.getDate() - 30);
          break;
        case 'last90':
          filterDate.setDate(now.getDate() - 90);
          break;
        case 'lastyear':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      consultations = consultations.filter(consultation => 
        new Date(consultation.date) >= filterDate
      );
    }

    // Apply search filter
    if (searchTerm) {
      const search = normalizeSearchTerm(searchTerm);
      consultations = consultations.filter(consultation =>
        consultation.reasonForVisit.toLowerCase().includes(search) ||
        consultation.soap?.assessment?.toLowerCase().includes(search) ||
        consultation.soap?.plan?.toLowerCase().includes(search) ||
        consultation.soap?.subjective?.toLowerCase().includes(search) ||
        consultation.soap?.objective?.toLowerCase().includes(search) ||
        consultation.icd10Code?.toLowerCase().includes(search) ||
        formatDate(consultation.date).toLowerCase().includes(search)
      );
    }

    return consultations;
  }, [consultationNotes, patientId, searchTerm, dateFilter]);

  const toggleConsultation = (consultationId: string) => {
    setExpandedConsultations(prev => ({
      ...prev,
      [consultationId]: !prev[consultationId]
    }));
  };

  const getDateFilterLabel = (filter: string) => {
    switch (filter) {
      case 'last30': return 'Last 30 days';
      case 'last90': return 'Last 3 months';
      case 'lastyear': return 'Last year';
      default: return 'All time';
    }
  };

  if (loading) {
    return (
      <Card>
        <Card.Content className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading consultations...</p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card padding={false}>
      <Card.Header>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Stethoscope className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Consultation History</h3>
              <p className="text-sm text-gray-600">
                {patientConsultations.length} consultation{patientConsultations.length === 1 ? '' : 's'} found
              </p>
            </div>
          </div>
          
          {canAddConsultation && onAddConsultation && (
            <Button onClick={onAddConsultation}>
              <Plus className="h-4 w-4 mr-2" />
              New Consultation
            </Button>
          )}
        </div>
        
        {/* Search and Filters */}
        <div className="mt-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search consultations by reason, diagnosis, or notes..."
                className="w-full"
                icon={<Search className="h-4 w-4 text-gray-400" />}
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {showFilters ? 
                <ChevronUp className="h-4 w-4 ml-1" /> : 
                <ChevronDown className="h-4 w-4 ml-1" />
              }
            </Button>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Period
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['all', 'last30', 'last90', 'lastyear'] as const).map((filter) => (
                    <Button
                      key={filter}
                      size="sm"
                      variant={dateFilter === filter ? "default" : "secondary"}
                      onClick={() => setDateFilter(filter)}
                      className="text-xs"
                    >
                      {getDateFilterLabel(filter)}
                    </Button>
                  ))}
                </div>
              </div>
              
              {(searchTerm || dateFilter !== 'all') && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">
                    Showing {patientConsultations.length} result{patientConsultations.length === 1 ? '' : 's'}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSearchTerm('');
                      setDateFilter('all');
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card.Header>
      
      <Card.Content className="p-0">
        {patientConsultations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || dateFilter !== 'all' ? 'No consultations found' : 'No consultations recorded'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || dateFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Patient consultation history will appear here once consultations are recorded.'}
            </p>
            {canAddConsultation && onAddConsultation && !searchTerm && dateFilter === 'all' && (
              <Button onClick={onAddConsultation}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Consultation
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {patientConsultations.map((consultation, index) => (
              <div key={consultation.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Consultation Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          {formatDate(consultation.date)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Consultation #{patientConsultations.length - index}
                        </span>
                      </div>
                    </div>
                    
                    {/* Reason for Visit */}
                    <div className="mb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-base font-medium text-gray-900 mb-1">
                            {consultation.reasonForVisit}
                          </h4>
                          {consultation.icd10Code && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              ICD-10: {consultation.icd10Code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* SOAP Notes Preview/Expanded */}
                    {consultation.soap && (
                      <div className="mt-4">
                        {expandedConsultations[consultation.id] ? (
                          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-semibold text-gray-900">SOAP Notes</h5>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleConsultation(consultation.id)}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {consultation.soap.subjective && (
                                <div className="bg-white rounded-md p-3 border-l-4 border-blue-400">
                                  <h6 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                                    Subjective
                                  </h6>
                                  <p className="text-sm text-gray-800 leading-relaxed">
                                    {consultation.soap.subjective}
                                  </p>
                                </div>
                              )}
                              
                              {consultation.soap.objective && (
                                <div className="bg-white rounded-md p-3 border-l-4 border-green-400">
                                  <h6 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">
                                    Objective
                                  </h6>
                                  <p className="text-sm text-gray-800 leading-relaxed">
                                    {consultation.soap.objective}
                                  </p>
                                </div>
                              )}
                              
                              {consultation.soap.assessment && (
                                <div className="bg-white rounded-md p-3 border-l-4 border-orange-400">
                                  <h6 className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-2">
                                    Assessment
                                  </h6>
                                  <p className="text-sm text-gray-800 leading-relaxed">
                                    {consultation.soap.assessment}
                                  </p>
                                </div>
                              )}
                              
                              {consultation.soap.plan && (
                                <div className="bg-white rounded-md p-3 border-l-4 border-purple-400">
                                  <h6 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">
                                    Plan
                                  </h6>
                                  <p className="text-sm text-gray-800 leading-relaxed">
                                    {consultation.soap.plan}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-gray-50 rounded-md p-3">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">SOAP notes available</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleConsultation(consultation.id)}
                            >
                              <ChevronDown className="h-4 w-4" />
                              View Details
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Content>
    </Card>
  );
};