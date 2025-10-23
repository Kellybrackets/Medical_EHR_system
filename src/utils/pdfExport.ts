import { Patient } from '../types';
import { generatePatientSummary, calculateBMI } from './patientViewUtils';
import { formatDate } from './patientUtils';

/**
 * Generate PDF-ready HTML content for patient summary
 */
export const generatePatientPDFContent = (patient: Patient): string => {
  const summary = generatePatientSummary(patient);
  const bmi = patient.medicalHistory?.height && patient.medicalHistory?.weight 
    ? calculateBMI(patient.medicalHistory.height, patient.medicalHistory.weight)
    : null;

  const styles = `
    <style>
      @media print {
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .page-break { page-break-before: always; }
        .no-print { display: none; }
      }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      
      .header {
        text-align: center;
        border-bottom: 3px solid #3B82F6;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      
      .header h1 {
        color: #1E40AF;
        margin: 0;
        font-size: 2.5em;
      }
      
      .header p {
        color: #6B7280;
        margin: 10px 0 0 0;
        font-size: 1.1em;
      }
      
      .patient-info {
        background: #F3F4F6;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 30px;
      }
      
      .patient-info h2 {
        color: #1F2937;
        margin-top: 0;
        border-bottom: 2px solid #E5E7EB;
        padding-bottom: 10px;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-top: 15px;
      }
      
      .info-item {
        background: white;
        padding: 15px;
        border-radius: 6px;
        border-left: 4px solid #3B82F6;
      }
      
      .info-label {
        font-weight: 600;
        color: #374151;
        font-size: 0.9em;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .info-value {
        color: #1F2937;
        font-size: 1.1em;
        margin-top: 5px;
      }
      
      .section {
        margin-bottom: 30px;
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .section-header {
        background: #F9FAFB;
        padding: 15px 20px;
        border-bottom: 1px solid #E5E7EB;
      }
      
      .section-header h3 {
        margin: 0;
        color: #1F2937;
        font-size: 1.3em;
      }
      
      .section-content {
        padding: 20px;
      }
      
      .health-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
      }
      
      .metric-card {
        text-align: center;
        padding: 15px;
        background: #F8FAFC;
        border-radius: 6px;
        border: 1px solid #E2E8F0;
      }
      
      .metric-value {
        font-size: 2em;
        font-weight: bold;
        color: #1E40AF;
      }
      
      .metric-label {
        color: #64748B;
        font-size: 0.9em;
        margin-top: 5px;
      }
      
      .bmi-normal { color: #059669; }
      .bmi-overweight { color: #D97706; }
      .bmi-obese { color: #DC2626; }
      .bmi-underweight { color: #3B82F6; }
      
      .medical-list {
        list-style: none;
        padding: 0;
      }
      
      .medical-list li {
        background: #FEF3F2;
        margin: 8px 0;
        padding: 12px;
        border-radius: 6px;
        border-left: 4px solid #EF4444;
      }
      
      .allergy-item {
        background: #FEF2F2;
        border-left-color: #DC2626;
      }
      
      .condition-item {
        background: #FFF7ED;
        border-left-color: #EA580C;
      }
      
      .medication-item {
        background: #EFF6FF;
        border-left-color: #2563EB;
      }
      
      .emergency-contact {
        background: #FEF2F2;
        border: 1px solid #FECACA;
        border-radius: 6px;
        padding: 15px;
        margin-top: 15px;
      }
      
      .emergency-contact h4 {
        color: #DC2626;
        margin-top: 0;
      }
      
      .contact-detail {
        display: flex;
        justify-content: space-between;
        margin: 8px 0;
        padding: 5px 0;
        border-bottom: 1px solid #FECACA;
      }
      
      .contact-detail:last-child {
        border-bottom: none;
      }
      
      .footer {
        margin-top: 50px;
        text-align: center;
        color: #6B7280;
        font-size: 0.9em;
        border-top: 1px solid #E5E7EB;
        padding-top: 20px;
      }
      
      @media (max-width: 600px) {
        .info-grid {
          grid-template-columns: 1fr;
        }
        .health-metrics {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    </style>
  `;

  const content = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Patient Summary - ${summary.fullName}</title>
      ${styles}
    </head>
    <body>
      <div class="header">
        <h1>Patient Medical Summary</h1>
        <p>Generated on ${formatDate(new Date().toISOString())}</p>
      </div>

      <div class="patient-info">
        <h2>${summary.fullName}</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Patient ID</div>
            <div class="info-value">${summary.idNumber}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Age</div>
            <div class="info-value">${summary.age} years</div>
          </div>
          <div class="info-item">
            <div class="info-label">Gender</div>
            <div class="info-value">${summary.gender}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date of Birth</div>
            <div class="info-value">${summary.dateOfBirth || 'Not provided'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h3>Health Metrics</h3>
        </div>
        <div class="section-content">
          <div class="health-metrics">
            <div class="metric-card">
              <div class="metric-value">${summary.healthMetrics.height.replace(' cm', '')}</div>
              <div class="metric-label">Height (cm)</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${summary.healthMetrics.weight.replace(' kg', '')}</div>
              <div class="metric-label">Weight (kg)</div>
            </div>
            <div class="metric-card">
              <div class="metric-value ${bmi ? (bmi.category === 'Normal' ? 'bmi-normal' : 
                bmi.category === 'Overweight' ? 'bmi-overweight' : 
                bmi.category === 'Obese' ? 'bmi-obese' : 'bmi-underweight') : ''}">${bmi ? bmi.value : '--'}</div>
              <div class="metric-label">BMI ${bmi ? `(${bmi.category})` : ''}</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" style="color: #DC2626;">${summary.healthMetrics.bloodType}</div>
              <div class="metric-label">Blood Type</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h3>Contact Information</h3>
        </div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Phone</div>
              <div class="info-value">${summary.phone}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${summary.email}</div>
            </div>
          </div>
          <div style="margin-top: 15px;">
            <div class="info-label">Address</div>
            <div class="info-value">${summary.address}</div>
          </div>
          
          <div class="emergency-contact">
            <h4>Emergency Contact</h4>
            <div class="contact-detail">
              <span><strong>Name:</strong></span>
              <span>${summary.emergencyContact.name}</span>
            </div>
            <div class="contact-detail">
              <span><strong>Relationship:</strong></span>
              <span>${summary.emergencyContact.relationship}</span>
            </div>
            <div class="contact-detail">
              <span><strong>Phone:</strong></span>
              <span>${summary.emergencyContact.phone}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h3>Medical Aid Information</h3>
        </div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Provider</div>
              <div class="info-value">${summary.insurance.provider}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Member Number</div>
              <div class="info-value">${summary.insurance.memberNumber}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Plan</div>
              <div class="info-value">${summary.insurance.plan}</div>
            </div>
          </div>
        </div>
      </div>

      ${summary.medicalHistory.allergies.length > 0 || 
        summary.medicalHistory.chronicConditions.length > 0 || 
        summary.medicalHistory.currentMedications.length > 0 ? `
      <div class="section">
        <div class="section-header">
          <h3>Medical History</h3>
        </div>
        <div class="section-content">
          ${summary.medicalHistory.allergies.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h4 style="color: #DC2626; margin-bottom: 10px;">⚠️ Allergies</h4>
            <ul class="medical-list">
              ${summary.medicalHistory.allergies.map(allergy => `<li class="allergy-item">${allergy}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          ${summary.medicalHistory.chronicConditions.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h4 style="color: #EA580C; margin-bottom: 10px;">🩺 Chronic Conditions</h4>
            <ul class="medical-list">
              ${summary.medicalHistory.chronicConditions.map(condition => `<li class="condition-item">${condition}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          ${summary.medicalHistory.currentMedications.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h4 style="color: #2563EB; margin-bottom: 10px;">💊 Current Medications</h4>
            <ul class="medical-list">
              ${summary.medicalHistory.currentMedications.map(medication => `<li class="medication-item">${medication}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          ${summary.medicalHistory.familyHistory !== 'No family history recorded' ? `
          <div>
            <h4 style="color: #7C3AED; margin-bottom: 10px;">👨‍👩‍👧‍👦 Family History</h4>
            <div style="background: #F3F4F6; padding: 15px; border-radius: 6px; border-left: 4px solid #7C3AED;">
              ${summary.medicalHistory.familyHistory}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <p><strong>Confidential Medical Document</strong></p>
        <p>This document contains confidential patient information and should be handled according to medical privacy regulations.</p>
        <p>Generated from EHR System on ${formatDate(new Date().toISOString())}</p>
      </div>
    </body>
    </html>
  `;

  return content;
};

/**
 * Export patient data as PDF using browser's print functionality
 */
export const exportPatientToPDF = (patient: Patient): void => {
  const pdfContent = generatePatientPDFContent(patient);
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  } else {
    // Fallback: create a blob URL and open it
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.click();
    URL.revokeObjectURL(url);
  }
};