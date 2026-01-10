/**
 * Lab Results Tab Component
 * Comprehensive lab results viewer with filtering, sorting, and trending
 * Optimized for doctor workflow and easy analysis
 */

import { useState, useMemo } from 'react';
import { useLabResults } from '../../hooks/useLabResults';
import {
  formatResultValue,
  formatReferenceRange,
  formatResultDate,
  getAbnormalFlagDescription,
  getResultStatusDescription,
  getResultClassName,
  getResultColor,
  isAbnormal,
  isCritical,
  needsAcknowledgment,
  getSeverityLevel,
  analyzeTrend,
  downloadResultsAsCSV,
} from '../../utils/labHelpers';
import { AlertCircle, Download, Filter, TrendingUp, Calendar, Activity } from 'lucide-react';
import type { LabResult, LabResultGroupBy, TestCategory } from '../../types/lab';

interface LabResultsTabProps {
  patientId: string;
}

export function LabResultsTab({ patientId }: LabResultsTabProps) {
  const {
    results,
    groupedResults,
    summary,
    criticalUnacknowledged,
    loading,
    error,
    filters,
    setFilters,
    sort,
    setSort,
    groupBy,
    setGroupBy,
    markAsViewed,
    acknowledgeCritical,
    addNote,
    getResultsByTestCode,
  } = useLabResults({ patientId, enableRealtime: true });

  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [selectedTestForTrend, setSelectedTestForTrend] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  /**
   * Get unique test categories for filter
   */
  const categories = useMemo(() => {
    const cats = new Set(results.map((r) => r.test_category).filter(Boolean));
    return Array.from(cats) as TestCategory[];
  }, [results]);

  /**
   * Handle result selection
   */
  const handleSelectResult = (result: LabResult) => {
    setSelectedResult(result);
    markAsViewed(result.id);
  };

  /**
   * Handle critical acknowledgment
   */
  const handleAcknowledgeCritical = async (resultId: string) => {
    if (!noteText.trim()) {
      alert('Please add a note before acknowledging critical result');
      return;
    }

    try {
      await acknowledgeCritical(resultId, noteText);
      setNoteText('');
      alert('Critical result acknowledged successfully');
    } catch (err) {
      alert('Failed to acknowledge critical result');
    }
  };

  /**
   * Handle add note
   */
  const handleAddNote = async () => {
    if (!selectedResult || !noteText.trim()) return;

    try {
      await addNote(selectedResult.id, noteText);
      setNoteText('');
      alert('Note added successfully');
    } catch (err) {
      alert('Failed to add note');
    }
  };

  /**
   * Show trend for a specific test
   */
  const handleShowTrend = (testCode: string) => {
    setSelectedTestForTrend(testCode);
    setShowTrend(true);
  };

  /**
   * Render trend analysis
   */
  const renderTrendAnalysis = () => {
    if (!selectedTestForTrend) return null;

    const testResults = getResultsByTestCode(selectedTestForTrend);
    if (testResults.length < 2) {
      return <div className="text-gray-500">Need at least 2 results for trend analysis</div>;
    }

    const { trend, description, points } = analyzeTrend(testResults);

    return (
      <div className="trend-analysis p-4 bg-gray-50 rounded">
        <h4 className="font-semibold mb-2">{testResults[0].test_name} - Trend Analysis</h4>
        <div className={`trend-indicator ${trend}`}>
          <TrendingUp className="inline mr-2" size={16} />
          {description}
        </div>

        <div className="trend-graph mt-4">
          {points.map((point, idx) => (
            <div key={idx} className="trend-point">
              <span className="date">{formatResultDate(point.datetime, false)}</span>
              <span className="value">
                {point.value} {point.unit}
              </span>
              {point.abnormal_flag && point.abnormal_flag !== 'N' && (
                <span className={`flag ${point.abnormal_flag}`}>{point.abnormal_flag}</span>
              )}
            </div>
          ))}
        </div>

        <button onClick={() => setShowTrend(false)} className="mt-4 btn-secondary">
          Close Trend
        </button>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="lab-results-loading">
        <Activity className="animate-spin" size={24} />
        <p>Loading lab results...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="lab-results-error">
        <AlertCircle size={24} className="text-red-500" />
        <p>Error loading lab results: {error.message}</p>
      </div>
    );
  }

  // Empty state
  if (results.length === 0) {
    return (
      <div className="lab-results-empty">
        <Activity size={48} className="text-gray-300" />
        <h3>No Lab Results Available</h3>
        <p>This patient has no lab results in the system yet.</p>
      </div>
    );
  }

  return (
    <div className="lab-results-tab">
      {/* Critical Alerts Banner */}
      {criticalUnacknowledged.length > 0 && (
        <div className="critical-alerts-banner bg-red-100 border border-red-400 p-4 mb-4 rounded">
          <div className="flex items-center gap-2">
            <AlertCircle size={24} className="text-red-600" />
            <strong className="text-red-800">
              {criticalUnacknowledged.length} Critical Result{criticalUnacknowledged.length !== 1 ? 's' : ''} Requiring Attention
            </strong>
          </div>
          <div className="mt-2">
            {criticalUnacknowledged.map((result) => (
              <div
                key={result.id}
                className="critical-alert-item cursor-pointer hover:bg-red-200 p-2 rounded"
                onClick={() => handleSelectResult(result)}
              >
                {result.test_name}: {formatResultValue(result)} - {formatResultDate(result.collection_datetime)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="results-summary grid grid-cols-4 gap-4 mb-6">
        <div className="stat-card bg-blue-50 p-4 rounded">
          <div className="stat-value text-2xl font-bold text-blue-600">{summary.total_results}</div>
          <div className="stat-label text-sm text-gray-600">Total Results</div>
        </div>
        <div className="stat-card bg-red-50 p-4 rounded">
          <div className="stat-value text-2xl font-bold text-red-600">{summary.critical_count}</div>
          <div className="stat-label text-sm text-gray-600">Critical</div>
        </div>
        <div className="stat-card bg-yellow-50 p-4 rounded">
          <div className="stat-value text-2xl font-bold text-yellow-600">{summary.abnormal_count}</div>
          <div className="stat-label text-sm text-gray-600">Abnormal</div>
        </div>
        <div className="stat-card bg-green-50 p-4 rounded">
          <div className="stat-value text-sm text-gray-700">
            {summary.last_test_date ? formatResultDate(summary.last_test_date, false) : 'N/A'}
          </div>
          <div className="stat-label text-sm text-gray-600">Last Test</div>
        </div>
      </div>

      {/* Controls */}
      <div className="results-controls flex justify-between items-center mb-4">
        <div className="controls-left flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-control ${showFilters ? 'active' : ''}`}
          >
            <Filter size={16} />
            Filters
          </button>

          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as LabResultGroupBy)}
            className="select-control"
          >
            <option value="none">No Grouping</option>
            <option value="date">Group by Date</option>
            <option value="category">Group by Category</option>
            <option value="test">Group by Test</option>
            <option value="status">Group by Status</option>
          </select>

          <select
            value={sort.field}
            onChange={(e) =>
              setSort({ ...sort, field: e.target.value as typeof sort.field })
            }
            className="select-control"
          >
            <option value="collection_datetime">Sort by Date</option>
            <option value="test_name">Sort by Test Name</option>
            <option value="abnormal_flag">Sort by Severity</option>
          </select>

          <button
            onClick={() => setSort({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
            className="btn-control"
          >
            {sort.direction === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <div className="controls-right flex gap-2">
          <button
            onClick={() => downloadResultsAsCSV(results, `lab_results_${patientId}.csv`)}
            className="btn-control"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel bg-gray-50 p-4 rounded mb-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={filters.testCategory || ''}
                onChange={(e) => setFilters({ ...filters, testCategory: e.target.value || undefined })}
                className="input-control"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.abnormalOnly || false}
                onChange={(e) => setFilters({ ...filters, abnormalOnly: e.target.checked })}
              />
              Abnormal Only
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.criticalOnly || false}
                onChange={(e) => setFilters({ ...filters, criticalOnly: e.target.checked })}
              />
              Critical Only
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.unacknowledgedOnly || false}
                onChange={(e) => setFilters({ ...filters, unacknowledgedOnly: e.target.checked })}
              />
              Unacknowledged Only
            </label>
          </div>

          <button
            onClick={() => setFilters({})}
            className="mt-4 btn-secondary text-sm"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Trend Analysis */}
      {showTrend && renderTrendAnalysis()}

      {/* Results List/Groups */}
      <div className="results-container">
        {groupBy === 'none' ? (
          // Ungrouped list
          <div className="results-list">
            {results.map((result) => (
              <ResultCard
                key={result.id}
                result={result}
                isSelected={selectedResult?.id === result.id}
                onClick={() => handleSelectResult(result)}
                onShowTrend={() => handleShowTrend(result.test_code)}
              />
            ))}
          </div>
        ) : (
          // Grouped results
          <div className="results-groups">
            {Object.entries(groupedResults).map(([group, groupResults]) => (
              <div key={group} className="result-group mb-6">
                <h3 className="group-header font-semibold text-lg mb-3 border-b pb-2">
                  {group} ({groupResults.length})
                </h3>
                <div className="results-list">
                  {groupResults.map((result) => (
                    <ResultCard
                      key={result.id}
                      result={result}
                      isSelected={selectedResult?.id === result.id}
                      onClick={() => handleSelectResult(result)}
                      onShowTrend={() => handleShowTrend(result.test_code)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Result Detail Panel */}
      {selectedResult && (
        <div className="result-detail-panel fixed right-0 top-0 h-full w-96 bg-white shadow-lg p-6 overflow-y-auto">
          <button
            onClick={() => setSelectedResult(null)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>

          <h2 className="text-xl font-bold mb-4">{selectedResult.test_name}</h2>

          <div className="detail-section mb-6">
            <h3 className="font-semibold mb-2">Result</h3>
            <div className={`result-value-large ${getResultClassName(selectedResult)}`}>
              {formatResultValue(selectedResult)}
            </div>
            {selectedResult.abnormal_flag && selectedResult.abnormal_flag !== 'N' && (
              <div className={`flag-badge ${selectedResult.abnormal_flag}`}>
                {getAbnormalFlagDescription(selectedResult.abnormal_flag)}
              </div>
            )}
            <div className="text-sm text-gray-600 mt-2">
              Reference: {formatReferenceRange(selectedResult)}
            </div>
          </div>

          <div className="detail-section mb-6">
            <h3 className="font-semibold mb-2">Details</h3>
            <dl className="detail-list">
              <dt>Collection Date</dt>
              <dd>{formatResultDate(selectedResult.collection_datetime)}</dd>

              <dt>Result Date</dt>
              <dd>{formatResultDate(selectedResult.result_datetime)}</dd>

              <dt>Status</dt>
              <dd>{getResultStatusDescription(selectedResult.result_status)}</dd>

              <dt>Category</dt>
              <dd>{selectedResult.test_category || 'N/A'}</dd>

              <dt>Specimen Type</dt>
              <dd>{selectedResult.specimen_type || 'N/A'}</dd>

              <dt>Performing Lab</dt>
              <dd>{selectedResult.performing_lab}</dd>

              {selectedResult.ordering_doctor_name && (
                <>
                  <dt>Ordering Doctor</dt>
                  <dd>{selectedResult.ordering_doctor_name}</dd>
                </>
              )}

              <dt>Accession Number</dt>
              <dd className="font-mono text-xs">{selectedResult.chiron_accession_number}</dd>
            </dl>
          </div>

          {selectedResult.clinical_comment && (
            <div className="detail-section mb-6">
              <h3 className="font-semibold mb-2">Lab Comment</h3>
              <p className="text-sm text-gray-700">{selectedResult.clinical_comment}</p>
            </div>
          )}

          {selectedResult.clinician_notes && (
            <div className="detail-section mb-6">
              <h3 className="font-semibold mb-2">Clinician Notes</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedResult.clinician_notes}</p>
            </div>
          )}

          <div className="detail-section mb-6">
            <h3 className="font-semibold mb-2">Add Note</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full border rounded p-2 text-sm"
              rows={3}
              placeholder="Add clinical notes..."
            />
            <button onClick={handleAddNote} className="mt-2 btn-primary text-sm">
              Add Note
            </button>
          </div>

          {needsAcknowledgment(selectedResult) && (
            <div className="detail-section bg-red-50 p-4 rounded">
              <h3 className="font-semibold text-red-800 mb-2">Critical Result - Requires Acknowledgment</h3>
              <button
                onClick={() => handleAcknowledgeCritical(selectedResult.id)}
                className="btn-danger"
                disabled={!noteText.trim()}
              >
                Acknowledge Critical Result
              </button>
              <p className="text-xs text-gray-600 mt-2">Note: Please add a clinical note before acknowledging</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual Result Card Component
 */
interface ResultCardProps {
  result: LabResult;
  isSelected: boolean;
  onClick: () => void;
  onShowTrend: () => void;
}

function ResultCard({ result, isSelected, onClick, onShowTrend }: ResultCardProps) {
  const severityColor = getResultColor(result);
  const className = getResultClassName(result);

  return (
    <div
      className={`result-card ${className} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ borderLeftColor: severityColor, borderLeftWidth: '4px' }}
    >
      <div className="result-card-header flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{result.test_name}</h4>
          <p className="text-xs text-gray-500">{result.test_category}</p>
        </div>
        <div className="text-right">
          <div className={`result-value ${className}`}>
            {formatResultValue(result)}
          </div>
          {result.abnormal_flag && result.abnormal_flag !== 'N' && (
            <span className={`flag-badge text-xs ${result.abnormal_flag}`}>
              {result.abnormal_flag}
            </span>
          )}
        </div>
      </div>

      <div className="result-card-body mt-2">
        <div className="text-sm text-gray-600">
          Reference: {formatReferenceRange(result)}
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>
            <Calendar size={12} className="inline mr-1" />
            {formatResultDate(result.collection_datetime, false)}
          </span>
          <span className="status-badge">{result.result_status}</span>
        </div>
      </div>

      {needsAcknowledgment(result) && (
        <div className="result-card-alert bg-red-100 text-red-800 text-xs p-2 mt-2 rounded">
          <AlertCircle size={12} className="inline mr-1" />
          Requires Acknowledgment
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onShowTrend();
        }}
        className="text-xs text-blue-600 hover:text-blue-800 mt-2"
      >
        <TrendingUp size={12} className="inline mr-1" />
        View Trend
      </button>
    </div>
  );
}
