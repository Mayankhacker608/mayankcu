document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const accountId = params.get('id');

  if (!accountId) {
    alert('Account id is missing.');
    window.location.href = '/accounts';
    return;
  }

  const form = document.getElementById('account-details-form');
  const customerSelect = document.getElementById('account-customer');
  const transactionsBody = document.getElementById('account-transactions-body');
  const accountNumberEl = document.getElementById('summary-account-number');
  const customerEl = document.getElementById('summary-customer');
  const balanceEl = document.getElementById('summary-balance');

  const formatCurrency = (value) => `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const customerOptions = await api.get('/customers');
  if (customerSelect) {
    customerSelect.innerHTML = customerOptions.map((customer) => `<option value="${customer._id}">${customer.fullName}</option>`).join('');
  }

  const account = await api.get(`/accounts/${accountId}`);
  const accountTransactions = await api.get(`/transactions?account=${accountId}`);

  if (!account) {
    window.location.href = '/accounts';
    return;
  }

  if (form) {
    Array.from(form.elements).forEach((field) => {
      if (!field.name) return;
      if (field.name === 'customer') return;
      const value = account[field.name];
      if (value !== undefined && field.tagName !== 'SELECT') {
        field.value = value;
      }
      if (field.tagName === 'SELECT' && field.name in account) {
        field.value = account[field.name];
      }
    });

    if (customerSelect) {
      customerSelect.value = typeof account.customer === 'object' ? account.customer._id : account.customer;
    }
  }

  if (accountNumberEl) accountNumberEl.textContent = account.accountNumber || '—';
  if (customerEl) customerEl.textContent = account.customer?.fullName || '—';
  if (balanceEl) balanceEl.textContent = formatCurrency(account.balance);

  if (transactionsBody) {
    const rows = Array.isArray(accountTransactions) ? accountTransactions : [];
    transactionsBody.innerHTML = rows.length
      ? rows.slice(0, 8).map((transaction) => `
          <tr class="border-t border-slate-100">
            <td class="px-3 py-3"><span class="rounded-full ${transaction.type === 'Credit' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'} px-2 py-1 text-xs font-medium">${transaction.type}</span></td>
            <td class="px-3 py-3 font-semibold text-slate-800">${formatCurrency(transaction.amount)}</td>
            <td class="px-3 py-3 text-slate-600">${new Date(transaction.createdAt).toLocaleDateString()}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="3" class="px-3 py-6 text-center text-slate-500">No transactions yet.</td></tr>';
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.balance = Number(payload.balance || 0);

    try {
      await api.put(`/accounts/${accountId}`, payload);
      alert('Account updated successfully.');
      window.location.reload();
    } catch (error) {
      alert(error.message || 'Unable to update account.');
    }
  });

  document.getElementById('delete-account')?.addEventListener('click', async () => {
    if (!confirm('Delete this account?')) return;
    try {
      await api.delete(`/accounts/${accountId}`);
      window.location.href = '/accounts';
    } catch (error) {
      alert(error.message || 'Unable to delete account.');
    }
  });
});
