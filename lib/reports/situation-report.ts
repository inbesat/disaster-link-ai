// lib/reports/situation-report.ts

export interface SituationReportData {
  district: string;
  generatedAt: string;
  generatedBy: string;
  // Current status
  floodRiskLevel: string;
  peopleAtRisk: number;
  sheltersActive: number;
  sheltersTotal: number;
  totalOccupancy: number;
  totalCapacity: number;
  resourcesDeployed: number;
  respondersActive: number;
  // Recent alerts
  recentAlerts: Array<{
    severity: string;
    message: string;
    time: string;
  }>;
  // Active evacuations
  evacuations: Array<{
    village: string;
    shelter: string;
    evacuees: number;
    status: string;
  }>;
  // Resource summary
  resources: Array<{
    category: string;
    available: number;
    deployed: number;
    total: number;
  }>;
}

export function generateSituationReportHTML(data: SituationReportData): string {
  // Return a complete HTML document string with inline styles
  // suitable for window.print()
  // Uses a professional, printable layout with media print CSS.
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Situation Report - ${data.district}</title>
  <style>
    :root {
      --bg-dark: #0f172a;
      --text-light: #f8fafc;
      --border: #e2e8f0;
      --text-muted: #64748b;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      margin: 0;
      padding: 40px;
      background: #f1f5f9;
    }
    .report-container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
    
    @media print {
      body {
        padding: 0;
        background: white;
      }
      .report-container {
        padding: 0;
        box-shadow: none;
        max-width: 100%;
      }
      @page {
        margin: 1.5cm;
      }
    }
    
    .header {
      background-color: var(--bg-dark);
      color: var(--text-light);
      padding: 24px;
      border-radius: 6px;
      margin-bottom: 32px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      color: #94a3b8;
    }
    
    .section {
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 2px solid var(--bg-dark);
      padding-bottom: 8px;
      margin-bottom: 16px;
      color: var(--bg-dark);
    }
    
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid var(--border);
      padding: 16px;
      border-radius: 6px;
      text-align: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .kpi-value {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 4px;
      color: var(--bg-dark);
    }
    .kpi-label {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--text-muted);
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 13px;
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      background-color: #f8fafc;
      font-weight: 700;
      color: var(--bg-dark);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    tr:last-child td {
      border-bottom: none;
    }
    
    .severity-critical { color: #dc2626; font-weight: 700; }
    .severity-warning { color: #d97706; font-weight: 700; }
    .severity-info { color: #2563eb; font-weight: 700; }
    
    .footer {
      margin-top: 48px;
      border-top: 1px solid var(--border);
      padding-top: 16px;
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
    }
    .page-number::after {
      content: counter(page);
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <h1>DRIP Situation Report</h1>
      <p>District: ${data.district} &bull; Generated: ${data.generatedAt}</p>
    </div>
    
    <div class="section">
      <div class="section-title">Key Indicators</div>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-value ${data.floodRiskLevel.toUpperCase() === 'CRITICAL' ? 'severity-critical' : ''}">${data.floodRiskLevel}</div>
          <div class="kpi-label">Risk Level</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${data.peopleAtRisk.toLocaleString()}</div>
          <div class="kpi-label">People At Risk</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${data.sheltersActive} / ${data.sheltersTotal}</div>
          <div class="kpi-label">Shelters Open</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${data.resourcesDeployed.toLocaleString()}</div>
          <div class="kpi-label">Resources Deployed</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Recent Alerts</div>
      <table>
        <thead>
          <tr>
            <th style="width: 15%">Time</th>
            <th style="width: 15%">Severity</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          ${data.recentAlerts.map(alert => `
            <tr>
              <td>${alert.time}</td>
              <td class="severity-${alert.severity.toLowerCase()}">${alert.severity}</td>
              <td>${alert.message}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="section">
      <div class="section-title">Active Evacuations</div>
      <table>
        <thead>
          <tr>
            <th>Village / Area</th>
            <th>Destination Shelter</th>
            <th style="text-align: right">Evacuees</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${data.evacuations.map(evac => `
            <tr>
              <td><strong>${evac.village}</strong></td>
              <td>${evac.shelter}</td>
              <td style="text-align: right">${evac.evacuees.toLocaleString()}</td>
              <td>
                <span style="padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; 
                  background-color: ${evac.status === 'Completed' ? '#dcfce7' : '#fef9c3'};
                  color: ${evac.status === 'Completed' ? '#166534' : '#854d0e'};
                ">
                  ${evac.status}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="section">
      <div class="section-title">Resource Inventory</div>
      <table>
        <thead>
          <tr>
            <th>Resource Category</th>
            <th style="text-align: right">Deployed</th>
            <th style="text-align: right">Available</th>
            <th style="text-align: right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.resources.map(res => `
            <tr>
              <td><strong>${res.category}</strong></td>
              <td style="text-align: right">${res.deployed.toLocaleString()}</td>
              <td style="text-align: right">${res.available.toLocaleString()}</td>
              <td style="text-align: right; font-weight: bold;">${res.total.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <span>Generated by DRIP (Disaster Response Intelligence Platform) &bull; Prepared by: ${data.generatedBy}</span>
      <span class="page-number">Page </span>
    </div>
  </div>
</body>
</html>
  `;
}
