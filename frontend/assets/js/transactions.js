document.addEventListener('DOMContentLoaded', async () => {
  const tableBody = document.getElementById('transactions-table-body');
  const modal = document.getElementById('transaction-modal');
  const form = document.getElementById('transaction-form');
  const accountSelect = document.getElementById('transaction-account');
  const searchInput = document.getElementById('search-input');
  const typeFilter = document.getElementById('type-filter');
  const statusFilter = document.getElementById('status-filter');
  const applyFiltersButton = document.getElementById('apply-filters');
  const newTransactionButton = document.getElementById('new-transaction-button');

  const render = (transactions) => {
    if (!tableBody) return;
    if (!transactions.length) {
      tableBody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-500">No transactions found.</td></tr>';
      return;
    }

    tableBody.innerHTML = transactions.map((transaction) => `
      <tr class="border-t border-slate-100">
        <td class="py-4 font-semibold text-slate-800">${transaction.transactionId || transaction._id}</td>
        <td class="py-4 text-slate-600">${transaction.account?.accountNumber || '—'}</td>
        <td class="py-4"><span class="rounded-full ${transaction.type === 'Credit' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'} px-2 py-1 text-xs font-medium">${transaction.type}</span></td>
        <td class="py-4 font-semibold text-slate-800">${transaction.type === 'Credit' ? '+' : '-'}$${Number(transaction.amount || 0).toLocaleString()}</td>
        <td class="py-4"><span class="rounded-full ${transaction.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : transaction.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'} px-2 py-1 text-xs font-medium">${transaction.status || 'Completed'}</span></td>
        <td class="py-4"><button data-id="${transaction._id}" class="rounded-lg bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">View</button></td>
      </tr>
    `).join('');
  };

  const loadAccounts = async () => {
    const accounts = await api.get('/accounts');
    if (!accountSelect) return;
    accountSelect.innerHTML = '<option value="">Select account</option>' + accounts.map((account) => `<option value="${account._id}">${account.accountNumber}</option>`).join('');
  };

  const fetchTransactions = async () => {
    const params = new URLSearchParams();
    if (typeFilter.value) params.set('type', typeFilter.value);
    if (statusFilter.value) params.set('status', statusFilter.value);
    if (searchInput.value.trim()) params.set('q', searchInput.value.trim());

    const data = await api.get(`/transactions?${params.toString()}`);
    render(Array.isArray(data) ? data : []);
  };

  const openModal = () => { if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); } };
  const closeModal = () => { if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); form.reset(); } };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.amount = Number(payload.amount || 0);
    try {
      await api.post('/transactions', payload);
      closeModal();
      await fetchTransactions();
    } catch (error) {
      alert(error.message || 'Unable to create transaction.');
    }
  });

  tableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const id = button.getAttribute('data-id');
    const transaction = (await api.get('/transactions')).find((entry) => entry._id === id);
    if (transaction) {
      alert(`Transaction ${transaction.transactionId || id} - ${transaction.type} ${transaction.amount}`);
    }
  });

  newTransactionButton.addEventListener('click', openModal);
  document.getElementById('close-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-transaction').addEventListener('click', closeModal);
  applyFiltersButton.addEventListener('click', fetchTransactions);
  searchInput.addEventListener('input', () => fetchTransactions());

  await loadAccounts();
  await fetchTransactions();
});
