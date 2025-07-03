import React, { useState } from 'react';

const allPayouts = [
  {
    id: '1',
    driver: 'Driver A',
    amount: 120,
    bank: 'Emirates NBD - 123456789',
    status: 'approved',
    date: '2024-05-01',
  },
  {
    id: '2',
    driver: 'Driver B',
    amount: 90,
    bank: 'ADCB - 654321987',
    status: 'pending',
    date: '2024-05-03',
  },
  {
    id: '3',
    driver: 'Driver C',
    amount: 180,
    bank: 'Mashreq - 1122334455',
    status: 'approved',
    date: '2024-06-05',
  },
];

export default function ReportsScreen() {
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [onlyApproved, setOnlyApproved] = useState(false);

  const filtered = allPayouts.filter((p) => {
    const matchMonth =
      selectedMonth === 'all' || p.date.startsWith(selectedMonth);
    const matchStatus = !onlyApproved || p.status === 'approved';
    return matchMonth && matchStatus;
  });

  const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0);
  const totalCommission = totalAmount * 0.2;
  const totalEarnings = totalAmount - totalCommission;

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Driver',
      'Date',
      'Bank',
      'Status',
      'Amount (AED)',
      'Commission (20%)',
      'Net Earnings (AED)',
    ];

    const rows = filtered.map((p) => {
      const commission = p.amount * 0.2;
      const earnings = p.amount - commission;
      return [
        p.id,
        p.driver,
        p.date,
        p.bank,
        p.status,
        p.amount.toFixed(2),
        commission.toFixed(2),
        earnings.toFixed(2),
      ];
    });

    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hilbu_admin_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📊 HILBU Admin Report</h2>

      <div style={styles.filtersRow}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>🗓 Filter by Month:</label>
          <select
            style={styles.select}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="all">All</option>
            <option value="2024-05">May 2024</option>
            <option value="2024-06">June 2024</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            <input
              type="checkbox"
              checked={onlyApproved}
              onChange={() => setOnlyApproved(!onlyApproved)}
            />{' '}
            ✅ Approved only
          </label>
        </div>
      </div>

      <div style={styles.totalsBox}>
        <p style={styles.totalsText}>📊 Total Requested: AED {totalAmount.toFixed(2)}</p>
        <p style={styles.totalsText}>💼 HILBU Commission (20%): AED {totalCommission.toFixed(2)}</p>
        <p style={styles.totalsText}>💰 Total Earnings (After): AED {totalEarnings.toFixed(2)}</p>
      </div>

      <button style={styles.button} onClick={exportToCSV}>
        ⬇️ Export to Excel
      </button>

      <div style={styles.section}>
        {filtered.map((p) => {
          const commission = p.amount * 0.2;
          const earnings = p.amount - commission;

          return (
            <div key={p.id} style={styles.card}>
              <p style={styles.label}>Driver: {p.driver}</p>
              <p style={styles.label}>Date: {p.date}</p>
              <p style={styles.label}>Bank: {p.bank}</p>
              <p style={styles.label}>Amount: AED {p.amount.toFixed(2)}</p>
              <p style={styles.label}>HILBU Commission (20%): AED {commission.toFixed(2)}</p>
              <p style={styles.label}>Net Earnings: AED {earnings.toFixed(2)}</p>
              <p style={{
                ...styles.status,
                color: p.status === 'approved' ? 'green' : '#cc9900',
              }}>
                {p.status === 'approved' ? '✅ Approved' : '🕓 Pending'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    backgroundColor: '#fff',
    minHeight: '100vh',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  filtersRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  filterGroup: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ddd',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  select: {
    padding: 6,
    marginTop: 4,
    fontSize: 14,
    borderRadius: 6,
  },
  totalsBox: {
    backgroundColor: '#f6f6f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    border: '1px solid #ddd',
    maxWidth: 600,
  },
  totalsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },
  section: {
    width: '100%',
    maxWidth: 600,
  },
  card: {
    backgroundColor: '#FFDC00',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  },
  label: {
    fontSize: 16,
    color: '#000',
    marginBottom: 6,
    fontWeight: 'bold',
  },
  status: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#000',
    color: '#FFDC00',
    padding: '14px 20px',
    borderRadius: 12,
    fontWeight: 'bold',
    fontSize: 16,
    cursor: 'pointer',
    border: 'none',
    marginBottom: 30,
  },
};
