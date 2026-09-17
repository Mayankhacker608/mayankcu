document.addEventListener('DOMContentLoaded', async () => {
  const tableBody = document.getElementById('accounts-table-body');
  const form = document.getElementById('account-form');
  const modal = document.getElementById('account-modal');
  const statusFilter = document.getElementById('status-filter');
  const typeFilter = document.getElementById('account-type-filter');
  const searchInput = document.getElementById('search-input');
  const newAccountButton = document.getElementById('new-account-button');
  const applyFiltersButton = document.getElementById('apply-filters');
  const customerSelect = document.getElementById('account-customer');

  const fetchCustomers = async () => {
    const customers = await api.get('/customers');
    if (!customerSelect) return;
    customerSelect.innerHTML = '<option value="">Select customer</option>' + customers.map((customer) => `<option value="${customer._id}">${customer.fullName}</option>`).join('');
  };

  const render = (accounts) => {
    if (!tableBody) return;
    if (!accounts.length) {
      tableBody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-500">No accounts found.</td></tr>';
      return;
    }

    tableBody.innerHTML = accounts.map((account) => `
      <tr class="border-t border-slate-100">
        <td class="py-4 font-semibold text-slate-800">${account.accountNumber}</td>
        <td class="py-4 text-slate-600">${account.customer?.fullName || '—'}</td>
        <td class="py-4 text-slate-600">${account.accountType}</td>
        <td class="py-4 font-semibold text-slate-800">$${Number(account.balance || 0).toLocaleString()}</td>
        <td class="py-4"><span class="rounded-full ${account.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : account.status === 'Suspended' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'} px-2 py-1 text-xs font-medium">${account.status}</span></td>
        <td class="py-4">
          <div class="flex gap-2">
            <button data-action="view" data-id="${account._id}" class="rounded-lg bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">View</button>
            <button data-action="edit" data-id="${account._id}" class="rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">Edit</button>
            <button data-action="delete" data-id="${account._id}" class="rounded-lg bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  const fetchAccounts = async () => {
    const params = new URLSearchParams();
    if (statusFilter.value) params.set('status', statusFilter.value);
    if (typeFilter.value) params.set('accountType', typeFilter.value);
    if (searchInput.value.trim()) params.set('q', searchInput.value.trim());

    const accounts = await api.get(`/accounts?${params.toString()}`);
    render(Array.isArray(accounts) ? accounts : []);
  };

  const openModal = () => {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    form.reset();
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.balance = Number(payload.balance || 0);
    try {
      await api.post('/accounts', payload);
      closeModal();
      await fetchAccounts();
    } catch (error) {
      alert(error.message || 'Unable to create account.');
    }
  });

  tableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const id = button.getAttribute('data-id');
    const action = button.getAttribute('data-action');

    if (action === 'delete') {
      if (!confirm('Delete this account?')) return;
      await api.delete(`/accounts/${id}`);
      await fetchAccounts();
    }

    if (action === 'view') {
      window.location.href = `account-details.html?id=${id}`;
    }

    if (action === 'edit') {
      alert('Edit account action is available in the detailed page.');
      window.location.href = `account-details.html?id=${id}`;
    }
  });

  newAccountButton.addEventListener('click', openModal);
  applyFiltersButton.addEventListener('click', fetchAccounts);
  document.getElementById('close-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-account').addEventListener('click', closeModal);

  await fetchCustomers();
  await fetchAccounts();
});
