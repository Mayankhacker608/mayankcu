document.addEventListener('DOMContentLoaded', async () => {
  const tableBody = document.getElementById('payments-table-body');
  const modal = document.getElementById('payment-modal');
  const form = document.getElementById('payment-form');
  const customerSelect = document.getElementById('payment-customer');
  const accountSelect = document.getElementById('payment-account');
  const statusFilter = document.getElementById('status-filter');
  const searchInput = document.getElementById('search-input');
  const applyFiltersButton = document.getElementById('apply-filters');
  const newPaymentButton = document.getElementById('new-payment-button');

  const render = (payments) => {
    if (!tableBody) return;
    if (!payments.length) {
      tableBody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-slate-500">No payments found.</td></tr>';
      return;
    }

    tableBody.innerHTML = payments.map((payment) => `
      <tr class="border-t border-slate-100">
        <td class="py-4 font-semibold text-slate-800">${payment.paymentId}</td>
        <td class="py-4 text-slate-600">${payment.customer?.fullName || '—'}</td>
        <td class="py-4 text-slate-600">${payment.account?.accountNumber || '—'}</td>
        <td class="py-4 font-semibold text-slate-800">$${Number(payment.amount || 0).toLocaleString()}</td>
        <td class="py-4"><span class="rounded-full ${payment.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : payment.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'} px-2 py-1 text-xs font-medium">${payment.status}</span></td>
      </tr>
    `).join('');
  };

  const loadOptions = async () => {
    const [customers, accounts] = await Promise.all([api.get('/customers'), api.get('/accounts')]);
    customerSelect.innerHTML = '<option value="">Select customer</option>' + customers.map((customer) => `<option value="${customer._id}">${customer.fullName}</option>`).join('');
    accountSelect.innerHTML = '<option value="">Select account</option>' + accounts.map((account) => `<option value="${account._id}">${account.accountNumber}</option>`).join('');
  };

  const fetchPayments = async () => {
    const params = new URLSearchParams();
    if (statusFilter.value) params.set('status', statusFilter.value);
    if (searchInput.value.trim()) params.set('q', searchInput.value.trim());
    const data = await api.get(`/payments?${params.toString()}`);
    render(Array.isArray(data) ? data : []);
  };

  const openModal = () => { modal.classList.remove('hidden'); modal.classList.add('flex'); };
  const closeModal = () => { modal.classList.add('hidden'); modal.classList.remove('flex'); form.reset(); };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.amount = Number(payload.amount || 0);
    try {
      await api.post('/payments', payload);
      closeModal();
      await fetchPayments();
    } catch (error) {
      alert(error.message || 'Unable to create payment.');
    }
  });

  newPaymentButton.addEventListener('click', openModal);
  document.getElementById('close-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-payment').addEventListener('click', closeModal);
  applyFiltersButton.addEventListener('click', fetchPayments);
  searchInput.addEventListener('input', () => fetchPayments());

  await loadOptions();
  await fetchPayments();
});
