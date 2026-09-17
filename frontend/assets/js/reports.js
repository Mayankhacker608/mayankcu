document.addEventListener('DOMContentLoaded', async () => {
  const formatCurrency = (value) => `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const tableBody = document.getElementById('reports-table-body');

  try {
    const reportData = await api.get('/reports/summary');
    const transactions = Array.isArray(reportData.recentTransactions) ? reportData.recentTransactions : [];
    const accountBreakdown = Array.isArray(reportData.accountTypeBreakdown) ? reportData.accountTypeBreakdown : [];
    const paymentBreakdown = Array.isArray(reportData.paymentStatusBreakdown) ? reportData.paymentStatusBreakdown : [];

    setText('report-customers', Number(reportData.customerCount || 0).toLocaleString());
    setText('report-accounts', Number(reportData.accountCount || 0).toLocaleString());
    setText('report-transactions', Number(reportData.transactionCount || 0).toLocaleString());
    setText('report-revenue', formatCurrency(reportData.revenue));

    if (tableBody) {
      tableBody.innerHTML = transactions.length
        ? transactions.map((transaction) => `
            <tr class="border-t border-slate-100">
              <td class="py-4 font-semibold text-slate-800">${transaction.transactionId}</td>
              <td class="py-4 text-slate-600">${transaction.customer?.fullName || '—'}</td>
              <td class="py-4"><span class="rounded-full ${transaction.type === 'Credit' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'} px-2 py-1 text-xs font-medium">${transaction.type}</span></td>
              <td class="py-4 font-semibold text-slate-800">${formatCurrency(transaction.amount)}</td>
              <td class="py-4 text-slate-600">${new Date(transaction.createdAt).toLocaleDateString()}</td>
            </tr>
          `).join('')
        : '<tr><td colspan="5" class="py-8 text-center text-slate-500">No transactions reported yet.</td></tr>';
    }

    const summary = document.getElementById('report-summary');
    if (summary) {
      const accountSummary = accountBreakdown.length
        ? accountBreakdown.map((item) => `${item._id}: ${item.count}`).join(' • ')
        : 'No account data yet';
      const paymentSummary = paymentBreakdown.length
        ? paymentBreakdown.map((item) => `${item._id}: ${item.count}`).join(' • ')
        : 'No payment data yet';

      summary.innerHTML = `
        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><span class="font-semibold">Account mix:</span> ${accountSummary}</div>
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><span class="font-semibold">Payment status:</span> ${paymentSummary}</div>
        </div>
      `;
    }

    document.getElementById('export-report')?.addEventListener('click', () => {
      const csv = [
        ['ID', 'Customer', 'Type', 'Amount', 'Date'],
        ...transactions.map((transaction) => [transaction.transactionId, transaction.customer?.fullName || '', transaction.type, transaction.amount, new Date(transaction.createdAt).toISOString()]),
      ].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'banking-report.csv';
      link.click();
      URL.revokeObjectURL(url);
    });
  } catch (error) {
    console.error(error);
  }
});
