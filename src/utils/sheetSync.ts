import { Consumer, SurveyLog } from '../types';

export function parseCSVToConsumers(csvText: string): Consumer[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim().replace(/[\s_-]+/g, ''));

  const findIdx = (names: string[]) => {
    return headers.findIndex((h) => names.some((n) => h.includes(n)));
  };

  const idIdx = findIdx(['consumerid', 'conid', 'consumer_id', 'id']);
  const nameIdx = findIdx(['name', 'consumername']);
  const addrIdx = findIdx(['address', 'addr']);
  const classIdx = findIdx(['class', 'category']);
  const osdIdx = findIdx(['osd', 'outstanding', 'amount', 'due']);
  const mruIdx = findIdx(['mru', 'section', 'book']);
  const mobIdx = findIdx(['mobile', 'phone', 'contact', 'cell']);
  const latIdx = findIdx(['lat', 'latitude']);
  const longIdx = findIdx(['long', 'lng', 'longitude']);
  const meterIdx = findIdx(['meter', 'meternumber', 'meterno']);
  const agencyIdx = findIdx(['agency', 'agent', 'team']);
  const issueIdx = findIdx(['issueddate', 'issued', 'issue_date', 'date']);
  const statusIdx = findIdx(['status', 'state']);

  const consumers: Consumer[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (!row || row.length < 3) continue;

    const id = (idIdx >= 0 && row[idIdx] ? row[idIdx].trim() : `CON-${100000 + i}`).replace(/['"]/g, '');
    const name = nameIdx >= 0 && row[nameIdx] ? row[nameIdx].trim() : `Consumer ${id}`;
    const address = addrIdx >= 0 && row[addrIdx] ? row[addrIdx].trim() : 'Harishchandrapur, Malda';
    const consClass = classIdx >= 0 && row[classIdx] ? row[classIdx].trim() : 'A';
    
    // Parse OSD amount cleanly (remove ₹, commas, spaces)
    const rawOsd = osdIdx >= 0 && row[osdIdx] ? row[osdIdx].replace(/[₹,$\s]/g, '') : '0';
    const osd = parseFloat(rawOsd) || 0;

    const mru = mruIdx >= 0 && row[mruIdx] ? row[mruIdx].trim() : '9QS66MMR';
    const mobileNo = mobIdx >= 0 && row[mobIdx] ? row[mobIdx].trim() : '7602731349';
    const lat = latIdx >= 0 && row[latIdx] ? parseFloat(row[latIdx]) || 25.4328 : 25.4328;
    const long = longIdx >= 0 && row[longIdx] ? parseFloat(row[longIdx]) || 87.8921 : 87.8921;
    const meterNo = meterIdx >= 0 && row[meterIdx] ? row[meterIdx].trim() : `XB00${1000 + i}`;
    const agency = agencyIdx >= 0 && row[agencyIdx] ? row[agencyIdx].trim().toUpperCase() : 'AC';
    const issuedDate = issueIdx >= 0 && row[issueIdx] ? row[issueIdx].trim() : '07.03.2025';

    let status = 'connected';
    if (statusIdx >= 0 && row[statusIdx]) {
      const s = row[statusIdx].toLowerCase().trim();
      if (s.includes('disc')) status = 'disconnected';
      else if (s.includes('paid')) status = 'paid';
      else if (s.includes('disp')) status = 'dispute';
      else if (s.includes('office')) status = 'office_team';
      else if (s.includes('not')) status = 'not_found';
    }

    consumers.push({
      id,
      name,
      address,
      class: consClass,
      osd,
      mru,
      mobileNo,
      lat,
      long,
      meterNo,
      agency,
      issuedDate,
      dueDate: `${issuedDate} - 10.08.2026`,
      status: status as any,
      priority: 'normal',
    });
  }

  return consumers;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Send real-time updates to Google Apps Script Webhook
 */
export async function pushUpdateToGoogleWebhook(
  webhookUrl: string,
  log: SurveyLog
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return false;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Apps script standard endpoint
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: log.timestamp,
        consumerId: log.consumerId,
        consumerName: log.consumerName,
        action: log.action,
        amountRealized: log.amountRealized,
        agency: log.agency,
        surveyor: log.userId,
        lat: log.lat,
        lng: log.long,
        remarks: log.remarks,
      }),
    });
    return true;
  } catch (err) {
    console.warn('Webhook post notice:', err);
    return false;
  }
}

/**
 * Download DC List as CSV
 */
export function exportConsumersToCSV(consumers: Consumer[], filename = 'WBSEDCL_DC_List.csv') {
  const headers = [
    'Consumer id',
    'Name',
    'Address',
    'Class',
    'OSD',
    'MRU',
    'Mobile no',
    'Lat',
    'Long',
    'Meter number',
    'Agency',
    'Issued date',
    'Status',
    'Priority',
    'Amount Realized',
    'Last Action Date',
    'Last Action By',
    'Remarks',
  ];

  const rows = consumers.map((c) => [
    `"${c.id}"`,
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.address.replace(/"/g, '""')}"`,
    `"${c.class}"`,
    c.osd,
    `"${c.mru}"`,
    `"${c.mobileNo}"`,
    c.lat,
    c.long,
    `"${c.meterNo}"`,
    `"${c.agency}"`,
    `"${c.issuedDate}"`,
    `"${c.status}"`,
    `"${c.priority}"`,
    c.amountRealized || 0,
    `"${c.lastActionDate || ''}"`,
    `"${c.lastActionBy || ''}"`,
    `"${(c.remarks || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export to Excel Compatible Spreadsheet (.xls)
 */
export function exportConsumersToExcel(consumers: Consumer[], filename = 'WBSEDCL_DC_Report.xls') {
  const tableRows = consumers
    .map(
      (c) => `
    <tr>
      <td>${c.id}</td>
      <td>${c.name}</td>
      <td>${c.address}</td>
      <td>${c.class}</td>
      <td style="text-align:right;">${c.osd.toFixed(2)}</td>
      <td>${c.mru}</td>
      <td>${c.mobileNo}</td>
      <td>${c.lat}</td>
      <td>${c.long}</td>
      <td>${c.meterNo}</td>
      <td>${c.agency}</td>
      <td>${c.issuedDate}</td>
      <td style="font-weight:bold;">${c.status.toUpperCase()}</td>
      <td>${c.priority.toUpperCase()}</td>
      <td style="text-align:right;">${(c.amountRealized || 0).toFixed(2)}</td>
      <td>${c.lastActionDate || '-'}</td>
      <td>${c.lastActionBy || '-'}</td>
      <td>${c.remarks || '-'}</td>
    </tr>`
    )
    .join('');

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>DC Survey Data</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <style>
        th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; padding: 6px; }
        td { padding: 5px; border: 1px solid #cbd5e1; }
      </style>
    </head>
    <body>
      <h2>WBSEDCL - HARISHCHANDRAPUR CCC (6612106)</h2>
      <p>Disconnection & Revenue Recovery Master Report - Generated on ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            <th>Consumer ID</th>
            <th>Name</th>
            <th>Address</th>
            <th>Class</th>
            <th>OSD (₹)</th>
            <th>MRU</th>
            <th>Mobile No</th>
            <th>Lat</th>
            <th>Long</th>
            <th>Meter No</th>
            <th>Agency</th>
            <th>Issued Date</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Realized Amount (₹)</th>
            <th>Last Action Date</th>
            <th>Action By</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
