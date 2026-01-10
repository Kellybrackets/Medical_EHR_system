/**
 * Lab Results Utility Functions
 * Helper functions for lab result formatting, classification, and analysis
 */

import type {
  LabResult,
  AbnormalFlag,
  ResultStatus,
  LabResultTrendPoint,
  LabResultComparison,
} from '../types/lab';

// =====================================================
// FORMATTING FUNCTIONS
// =====================================================

/**
 * Format lab result value with unit
 */
export function formatResultValue(result: LabResult): string {
  const value = result.result_value;
  const unit = result.result_unit;

  if (!value) return 'N/A';
  if (!unit) return value;

  return `${value} ${unit}`;
}

/**
 * Format reference range for display
 */
export function formatReferenceRange(result: LabResult): string {
  if (result.reference_range) {
    return result.reference_range;
  }

  if (result.reference_range_low !== null && result.reference_range_high !== null) {
    return `${result.reference_range_low} - ${result.reference_range_high}`;
  }

  if (result.reference_range_low !== null) {
    return `≥ ${result.reference_range_low}`;
  }

  if (result.reference_range_high !== null) {
    return `≤ ${result.reference_range_high}`;
  }

  return 'Not specified';
}

/**
 * Get human-readable abnormal flag description
 */
export function getAbnormalFlagDescription(flag: AbnormalFlag | null): string {
  if (!flag) return 'Unknown';

  const descriptions: Record<AbnormalFlag, string> = {
    N: 'Normal',
    L: 'Low',
    H: 'High',
    LL: 'Very Low',
    HH: 'Very High',
    CRITICAL: 'Critical',
    '<': 'Below Range',
    '>': 'Above Range',
    A: 'Abnormal',
    AA: 'Very Abnormal',
  };

  return descriptions[flag] || flag;
}

/**
 * Get human-readable result status
 */
export function getResultStatusDescription(status: ResultStatus): string {
  const descriptions: Record<ResultStatus, string> = {
    preliminary: 'Preliminary',
    final: 'Final',
    corrected: 'Corrected',
    amended: 'Amended',
    cancelled: 'Cancelled',
    entered_in_error: 'Error',
  };

  return descriptions[status] || status;
}

/**
 * Format datetime for display
 */
export function formatResultDate(datetime: string | null, includeTime: boolean = true): string {
  if (!datetime) return 'N/A';

  const date = new Date(datetime);

  if (includeTime) {
    return date.toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Calculate age of result in hours
 */
export function getResultAgeHours(result: LabResult): number {
  const now = new Date();
  const resultDate = new Date(result.reported_datetime);
  return (now.getTime() - resultDate.getTime()) / (1000 * 60 * 60);
}

/**
 * Get human-readable age of result
 */
export function getResultAgeDescription(result: LabResult): string {
  const ageHours = getResultAgeHours(result);

  if (ageHours < 1) {
    const minutes = Math.floor(ageHours * 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }

  if (ageHours < 24) {
    const hours = Math.floor(ageHours);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }

  const days = Math.floor(ageHours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// =====================================================
// CLASSIFICATION FUNCTIONS
// =====================================================

/**
 * Check if result is abnormal
 */
export function isAbnormal(result: LabResult): boolean {
  return result.abnormal_flag !== null && result.abnormal_flag !== 'N';
}

/**
 * Check if result is critical
 */
export function isCritical(result: LabResult): boolean {
  return result.abnormal_flag === 'CRITICAL';
}

/**
 * Check if result needs acknowledgment
 */
export function needsAcknowledgment(result: LabResult): boolean {
  return isCritical(result) && !result.critical_acknowledged;
}

/**
 * Check if result is final (not preliminary)
 */
export function isFinal(result: LabResult): boolean {
  return result.result_status === 'final' || result.result_status === 'corrected';
}

/**
 * Get severity level (0-5, higher is more severe)
 */
export function getSeverityLevel(result: LabResult): number {
  if (!result.abnormal_flag) return 0;

  const severityMap: Record<AbnormalFlag, number> = {
    N: 0,
    L: 1,
    H: 1,
    LL: 2,
    HH: 2,
    '<': 3,
    '>': 3,
    A: 2,
    AA: 3,
    CRITICAL: 5,
  };

  return severityMap[result.abnormal_flag] || 0;
}

/**
 * Get color code for result (for UI styling)
 */
export function getResultColor(result: LabResult): string {
  if (!result.abnormal_flag || result.abnormal_flag === 'N') {
    return 'green'; // Normal
  }

  const severity = getSeverityLevel(result);

  if (severity >= 5) return 'red'; // Critical
  if (severity >= 3) return 'orange'; // Severe abnormal
  if (severity >= 1) return 'yellow'; // Mild abnormal

  return 'green';
}

/**
 * Get CSS class for result styling
 */
export function getResultClassName(result: LabResult): string {
  if (isCritical(result)) return 'result-critical';
  if (getSeverityLevel(result) >= 3) return 'result-severe';
  if (isAbnormal(result)) return 'result-abnormal';
  return 'result-normal';
}

// =====================================================
// ANALYSIS FUNCTIONS
// =====================================================

/**
 * Compare result value to reference range
 */
export function compareToReferenceRange(result: LabResult): {
  status: 'normal' | 'low' | 'high' | 'unknown';
  percentageOfRange: number | null;
} {
  if (
    result.result_value_numeric === null ||
    result.reference_range_low === null ||
    result.reference_range_high === null
  ) {
    return { status: 'unknown', percentageOfRange: null };
  }

  const value = result.result_value_numeric;
  const low = result.reference_range_low;
  const high = result.reference_range_high;

  if (value < low) {
    const percentBelow = ((low - value) / low) * 100;
    return { status: 'low', percentageOfRange: -percentBelow };
  }

  if (value > high) {
    const percentAbove = ((value - high) / high) * 100;
    return { status: 'high', percentageOfRange: percentAbove };
  }

  // Calculate position within range (0-100%)
  const rangeSize = high - low;
  const positionInRange = ((value - low) / rangeSize) * 100;

  return { status: 'normal', percentageOfRange: positionInRange };
}

/**
 * Analyze trend from multiple results
 */
export function analyzeTrend(results: LabResult[]): {
  trend: 'improving' | 'worsening' | 'stable' | 'unknown';
  description: string;
  points: LabResultTrendPoint[];
} {
  if (results.length < 2) {
    return {
      trend: 'unknown',
      description: 'Insufficient data for trend analysis',
      points: [],
    };
  }

  // Sort by collection datetime
  const sortedResults = [...results].sort(
    (a, b) => new Date(a.collection_datetime).getTime() - new Date(b.collection_datetime).getTime()
  );

  // Create trend points
  const points: LabResultTrendPoint[] = sortedResults
    .filter((r) => r.result_value_numeric !== null)
    .map((r) => ({
      datetime: r.collection_datetime,
      value: r.result_value_numeric!,
      unit: r.result_unit || '',
      abnormal_flag: r.abnormal_flag,
      reference_range_low: r.reference_range_low,
      reference_range_high: r.reference_range_high,
    }));

  if (points.length < 2) {
    return {
      trend: 'unknown',
      description: 'Insufficient numeric data for trend analysis',
      points,
    };
  }

  // Calculate severity scores for first and last results
  const firstSeverity = getSeverityLevel(sortedResults[0]);
  const lastSeverity = getSeverityLevel(sortedResults[sortedResults.length - 1]);

  // Determine trend
  let trend: 'improving' | 'worsening' | 'stable' | 'unknown';
  let description: string;

  if (lastSeverity < firstSeverity) {
    trend = 'improving';
    description = 'Results are improving over time';
  } else if (lastSeverity > firstSeverity) {
    trend = 'worsening';
    description = 'Results are worsening over time';
  } else if (lastSeverity === 0 && firstSeverity === 0) {
    // Both normal
    const values = points.map((p) => p.value);
    const variance = calculateVariance(values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const coefficientOfVariation = (Math.sqrt(variance) / mean) * 100;

    if (coefficientOfVariation < 10) {
      trend = 'stable';
      description = 'Results remain consistently normal';
    } else {
      trend = 'stable';
      description = 'Results fluctuate but remain within normal range';
    }
  } else {
    trend = 'stable';
    description = 'Results are stable';
  }

  return { trend, description, points };
}

/**
 * Calculate variance for trend analysis
 */
function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((value) => Math.pow(value - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Group results by test code and analyze
 */
export function groupAndAnalyzeResults(results: LabResult[]): LabResultComparison[] {
  // Group by test code
  const grouped = results.reduce((acc, result) => {
    const key = result.test_code;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(result);
    return acc;
  }, {} as Record<string, LabResult[]>);

  // Analyze each group
  return Object.entries(grouped).map(([testCode, testResults]) => {
    const { trend, points } = analyzeTrend(testResults);

    return {
      test_name: testResults[0].test_name,
      test_code: testCode,
      results: testResults,
      trend,
      trend_data: points,
    };
  });
}

// =====================================================
// FILTERING AND SORTING FUNCTIONS
// =====================================================

/**
 * Filter results by date range
 */
export function filterByDateRange(
  results: LabResult[],
  startDate: Date,
  endDate: Date
): LabResult[] {
  return results.filter((result) => {
    const collectionDate = new Date(result.collection_datetime);
    return collectionDate >= startDate && collectionDate <= endDate;
  });
}

/**
 * Get results from last N days
 */
export function getRecentResults(results: LabResult[], days: number): LabResult[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return results.filter((result) => {
    const collectionDate = new Date(result.collection_datetime);
    return collectionDate >= cutoffDate;
  });
}

/**
 * Sort results by multiple criteria
 */
export function sortResults(
  results: LabResult[],
  criteria: 'date' | 'severity' | 'test' | 'status'
): LabResult[] {
  const sorted = [...results];

  switch (criteria) {
    case 'date':
      return sorted.sort(
        (a, b) =>
          new Date(b.collection_datetime).getTime() - new Date(a.collection_datetime).getTime()
      );

    case 'severity':
      return sorted.sort((a, b) => getSeverityLevel(b) - getSeverityLevel(a));

    case 'test':
      return sorted.sort((a, b) => a.test_name.localeCompare(b.test_name));

    case 'status':
      const statusOrder = {
        preliminary: 0,
        final: 1,
        corrected: 2,
        amended: 3,
        cancelled: 4,
        entered_in_error: 5,
      };
      return sorted.sort(
        (a, b) => statusOrder[a.result_status] - statusOrder[b.result_status]
      );

    default:
      return sorted;
  }
}

// =====================================================
// EXPORT FUNCTIONS
// =====================================================

/**
 * Convert results to CSV format
 */
export function resultsToCSV(results: LabResult[]): string {
  const headers = [
    'Collection Date',
    'Test Name',
    'Result Value',
    'Unit',
    'Reference Range',
    'Flag',
    'Status',
    'Ordering Doctor',
    'Lab',
  ];

  const rows = results.map((result) => [
    formatResultDate(result.collection_datetime),
    result.test_name,
    result.result_value,
    result.result_unit || '',
    formatReferenceRange(result),
    getAbnormalFlagDescription(result.abnormal_flag),
    getResultStatusDescription(result.result_status),
    result.ordering_doctor_name || '',
    result.performing_lab,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return csvContent;
}

/**
 * Download results as CSV file
 */
export function downloadResultsAsCSV(results: LabResult[], filename: string = 'lab_results.csv') {
  const csv = resultsToCSV(results);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Prepare results for PDF export
 */
export function prepareResultsForPDF(results: LabResult[]): {
  title: string;
  data: Record<string, string>[];
} {
  return {
    title: 'Laboratory Results Report',
    data: results.map((result) => ({
      'Collection Date': formatResultDate(result.collection_datetime),
      'Test': result.test_name,
      'Result': formatResultValue(result),
      'Reference Range': formatReferenceRange(result),
      'Flag': getAbnormalFlagDescription(result.abnormal_flag),
      'Status': getResultStatusDescription(result.result_status),
    })),
  };
}

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

/**
 * Validate result value is within expected bounds
 */
export function validateResultValue(result: LabResult): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check if numeric result has reference ranges
  if (result.result_value_numeric !== null) {
    if (result.reference_range_low === null && result.reference_range_high === null) {
      warnings.push('Missing reference ranges for numeric result');
    }

    // Check for extreme outliers (10x outside range)
    if (result.reference_range_high !== null) {
      if (result.result_value_numeric > result.reference_range_high * 10) {
        warnings.push('Result is extremely high - verify accuracy');
      }
    }

    if (result.reference_range_low !== null) {
      if (result.result_value_numeric < result.reference_range_low * 0.1) {
        warnings.push('Result is extremely low - verify accuracy');
      }
    }
  }

  // Check for missing critical fields
  if (!result.test_name) {
    warnings.push('Missing test name');
  }

  if (!result.result_value) {
    warnings.push('Missing result value');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
