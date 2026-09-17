document.addEventListener('DOMContentLoaded', async () => {
  const tableBody = document.getElementById('customers-table-body');
  const modal = document.getElementById('customer-modal');
  const form = document.getElementById('customer-form');
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  const sortFilter = document.getElementById('sort-filter');
  const applyFiltersButton = document.getElementById('apply-filters');
  const newCustomerButton = document.getElementById('new-customer-button');
  const closeModalButton = document.getElementById('close-modal');
  const cancelButton = document.getElementById('cancel-customer');

  const state = {
    customers: [],
    editingId: null,
  };

  const render = (items) => {
    if (!tableBody) return;
    if (!items.length) {
      tableBody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-slate-500">No customers found.</td></tr>';
      return;
    }

    tableBody.innerHTML = items.map((customer) => `
      <tr class="border-t border-slate-100">
        <td class="py-4">
          <div>
            <p class="font-semibold text-slate-800">${customer.fullName}</p>
            <p class="text-xs text-slate-500">${customer.customerId || '—'}</p>
          </div>
        </td>
        <td class="py-4 text-slate-600">${customer.email}</td>
        <td class="py-4 text-slate-600">${customer.phone}</td>
        <td class="py-4"><span class="rounded-full ${customer.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'} px-2 py-1 text-xs font-medium">${customer.status}</span></td>
        <td class="py-4">
          <div class="flex gap-2">
            <button data-action="view" data-id="${customer._id}" class="rounded-lg bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">View</button>
            <button data-action="edit" data-id="${customer._id}" class="rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">Edit</button>
            <button data-action="delete" data-id="${customer._id}" class="rounded-lg bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  const fetchCustomers = async () => {
    const query = searchInput ? searchInput.value.trim() : '';
    const status = statusFilter ? statusFilter.value : '';
    const sort = sortFilter ? sortFilter.value : 'newest';

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (status) params.set('status', status);
    if (sort) params.set('sort', sort);

    const customers = await api.get(`/customers?${params.toString()}`);
    state.customers = Array.isArray(customers) ? customers : [];
    render(state.customers);
  };

  const openModal = (customer = null) => {
    const modalTitle = document.getElementById('modal-title');
    const customerId = document.getElementById('customer-id');
    const customerName = document.getElementById('customer-name');
    const customerEmail = document.getElementById('customer-email');
    const customerPhone = document.getElementById('customer-phone');
    const customerStatus = document.getElementById('customer-status');
    const customerAddress = document.getElementById('customer-address');
    const customerCity = document.getElementById('customer-city');
    const customerState = document.getElementById('customer-state');
    const customerCountry = document.getElementById('customer-country');
    const customerPostal = document.getElementById('customer-postal');

    if (!customer) {
      state.editingId = null;
      customerId.value = '';
      form.reset();
      modalTitle.textContent = 'New customer';
      customerStatus.value = 'Active';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      return;
    }

    state.editingId = customer._id;
    customerId.value = customer._id;
    customerName.value = customer.fullName || '';
    customerEmail.value = customer.email || '';
    customerPhone.value = customer.phone || '';
    customerStatus.value = customer.status || 'Active';
    customerAddress.value = customer.address || '';
    customerCity.value = customer.city || '';
    customerState.value = customer.state || '';
    customerCountry.value = customer.country || '';
    customerPostal.value = customer.postalCode || '';
    modalTitle.textContent = 'Edit customer';
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
    const formData = Object.fromEntries(new FormData(form).entries());

    try {
      if (state.editingId) {
        await api.put(`/customers/${state.editingId}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      closeModal();
      await fetchCustomers();
    } catch (error) {
      alert(error.message || 'Unable to save customer.');
    }
  });

  tableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const id = button.getAttribute('data-id');
    const action = button.getAttribute('data-action');

    if (action === 'delete') {
      if (!confirm('Delete this customer?')) return;
      await api.delete(`/customers/${id}`);
      await fetchCustomers();
    }

    if (action === 'edit') {
      const customer = state.customers.find((item) => item._id === id);
      if (customer) openModal(customer);
    }

    if (action === 'view') {
      const customer = state.customers.find((item) => item._id === id);
      if (customer) {
        const accountUrl = `accounts.html?customerId=${customer._id}`;
        window.location.href = accountUrl;
      }
    }
  });

  newCustomerButton.addEventListener('click', () => openModal());
  closeModalButton.addEventListener('click', closeModal);
  cancelButton.addEventListener('click', closeModal);
  applyFiltersButton.addEventListener('click', fetchCustomers);
  searchInput.addEventListener('input', () => fetchCustomers());

  await fetchCustomers();
});
