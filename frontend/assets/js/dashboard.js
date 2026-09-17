document.addEventListener('DOMContentLoaded', async () => {
  const formatCurrency = (value) => `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const updateStat = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const renderTransactions = (items) => {
    const body = document.getElementById('recent-transactions-body');
    if (!body) return;
    if (!items.length) {
      body.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-slate-500">No recent activity.</td></tr>';
      return;
    }

    body.innerHTML = items.slice(0, 6).map((item) => `
      <tr class="border-t border-slate-100">
        <td class="py-3 font-medium text-slate-700">${item.transactionId || item._id}</td>
        <td class="py-3"><span class="rounded-full ${item.type === 'Credit' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'} px-2 py-1 text-xs font-medium">${item.type}</span></td>
        <td class="py-3 font-semibold text-slate-800">${item.type === 'Credit' ? '+' : '-'}${formatCurrency(item.amount)}</td>
        <td class="py-3 text-slate-600">${item.status || 'Completed'}</td>
      </tr>
    `).join('');
  };

  const renderActivity = (items) => {
    const body = document.getElementById('recent-activity-body');
    if (!body) return;
    if (!items.length) {
      body.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-slate-500">No activity recorded yet.</td></tr>';
      return;
    }

    body.innerHTML = items.slice(0, 8).map((item) => `
      <tr class="border-t border-slate-100">
        <td class="py-3 font-medium text-slate-700">${item.user?.fullName || 'System'}</td>
        <td class="py-3"><span class="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-medium text-sky-700 uppercase tracking-wide">${item.action}</span></td>
        <td class="py-3 text-slate-600">${item.description}</td>
        <td class="py-3 text-slate-500">${new Date(item.timestamp || item.createdAt).toLocaleString()}</td>
      </tr>
    `).join('');
  };

  try {
    const stats = await api.get('/dashboard/stats');
    const transactions = await api.get('/dashboard/transactions');
    const activities = await api.get('/dashboard/activities');

    updateStat('stat-customers', Number(stats.totalCustomers || 0).toLocaleString());
    updateStat('stat-accounts', Number(stats.totalAccounts || 0).toLocaleString());
    updateStat('stat-balance', formatCurrency(stats.totalBalance));
    updateStat('stat-transactions', Number(stats.totalTransactions || 0).toLocaleString());
    updateStat('stat-payments', Number(stats.pendingPayments || 0).toLocaleString());
    updateStat('stat-revenue', formatCurrency(stats.monthlyRevenue));
    renderTransactions(Array.isArray(transactions) ? transactions : []);
    renderActivity(Array.isArray(activities) ? activities : []);

    const balanceTrendData = [32, 35, 40, 45, 48, 52, 56, 60];
    const accountTypes = Array.isArray(stats.accountTypeBreakdown) && stats.accountTypeBreakdown.length ? stats.accountTypeBreakdown : [
      { _id: 'Savings', count: 0 },
      { _id: 'Current', count: 0 },
      { _id: 'Business', count: 0 },
      { _id: 'Corporate', count: 0 },
    ];
    const paymentStatus = Array.isArray(stats.paymentStatusBreakdown) && stats.paymentStatusBreakdown.length ? stats.paymentStatusBreakdown : [
      { _id: 'Pending', count: 0 },
      { _id: 'Completed', count: 0 },
      { _id: 'Failed', count: 0 },
    ];

    const creditDebitData = {
      labels: ['Credits', 'Debits'],
      datasets: [{ data: [stats.monthlyRevenue || 0, stats.totalBalance || 0], backgroundColor: ['#22c55e', '#f59e0b'] }],
    };

    new Chart(document.getElementById('balanceTrendChart'), {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [{ label: 'Balance', data: balanceTrendData, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)', fill: true, tension: 0.35 }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    });

    new Chart(document.getElementById('creditDebitChart'), {
      type: 'doughnut',
      data: creditDebitData,
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
    });

    new Chart(document.getElementById('paymentStatusChart'), {
      type: 'bar',
      data: {
        labels: paymentStatus.map((item) => item._id),
        datasets: [{ data: paymentStatus.map((item) => item.count), backgroundColor: ['#f59e0b', '#22c55e', '#ef4444', '#60a5fa'] }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    });

    new Chart(document.getElementById('customerGrowthChart'), {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{ data: [15, 22, 26, 31, 41, 48], borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)', fill: true, tension: 0.4 }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    });

    new Chart(document.getElementById('accountTypeChart'), {
      type: 'polarArea',
      data: {
        labels: accountTypes.map((item) => item._id),
        datasets: [{ data: accountTypes.map((item) => item.count), backgroundColor: ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f472b6'] }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
    });

    const rangeSelect = document.getElementById('chart-range');
    if (rangeSelect) {
      rangeSelect.addEventListener('change', () => {
        const value = Number(rangeSelect.value || 30);
        const updated = balanceTrendData.map((point, index) => Math.max(10, point + (index + 1) * (value / 25)));
        const chart = Chart.getChart(document.getElementById('balanceTrendChart'));
        if (chart) chart.data.datasets[0].data = updated;
        if (chart) chart.update();
      });
    }
  } catch (error) {
    console.error(error);
  }
});
