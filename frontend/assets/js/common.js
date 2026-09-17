document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const pathName = window.location.pathname.split('/').pop() || 'index.html';

  if (pathName !== 'index.html' && pathName !== 'login.html' && pathName !== 'register.html' && !localStorage.getItem('token')) {
    window.location.href = '/login.html';
    return;
  }

  const notificationList = document.getElementById('notification-list');
  const userNameEl = document.getElementById('user-name');
  const userRoleEl = document.getElementById('user-role');
  const searchInput = document.getElementById('global-search');

  if (userNameEl) userNameEl.textContent = user ? user.fullName : 'Guest';
  if (userRoleEl) userRoleEl.textContent = user ? user.role : 'Visitor';

  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
    });
  }

  const renderNotificationList = async () => {
    if (!notificationList) return;

    try {
      const notifications = await api.get('/notifications');
      if (!Array.isArray(notifications) || !notifications.length) {
        notificationList.innerHTML = '<div class="p-3 text-sm text-gray-500">No notifications</div>';
        return;
      }

      notificationList.innerHTML = notifications.slice(0, 4).map((item) => `
        <div class="border-b border-slate-200 px-3 py-2 last:border-b-0">
          <div class="flex justify-between gap-3">
            <p class="font-medium text-slate-800">${item.title}</p>
            <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">${item.type}</span>
          </div>
          <p class="mt-1 text-xs text-slate-600">${item.message}</p>
        </div>
      `).join('');
    } catch (error) {
      notificationList.innerHTML = '<div class="p-3 text-sm text-red-500">Unable to load alerts</div>';
    }
  };

  renderNotificationList();

  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', (event) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        const query = event.target.value.trim();
        if (!query) {
          const panel = document.getElementById('search-results');
          if (panel) panel.classList.add('hidden');
          return;
        }

        try {
          const customers = await api.get(`/customers?q=${encodeURIComponent(query)}`);
          const accounts = await api.get(`/accounts?q=${encodeURIComponent(query)}`);
          const transactions = await api.get(`/transactions?q=${encodeURIComponent(query)}`);
          const payments = await api.get(`/payments?q=${encodeURIComponent(query)}`);
          const items = [
            ...customers.slice(0, 3).map((customer) => ({ type: 'Customer', label: customer.fullName, link: `customers.html?id=${customer._id}` })),
            ...accounts.slice(0, 3).map((account) => ({ type: 'Account', label: account.accountNumber, link: `account-details.html?id=${account._id}` })),
            ...transactions.slice(0, 3).map((transaction) => ({ type: 'Transaction', label: transaction.transactionId, link: `transactions.html` })),
            ...payments.slice(0, 3).map((payment) => ({ type: 'Payment', label: payment.paymentId, link: `payments.html` })),
          ];

          const panel = document.getElementById('search-results');
          const list = document.getElementById('search-results-list');
          if (!panel || !list) return;

          if (!items.length) {
            list.innerHTML = '<div class="px-3 py-2 text-sm text-slate-500">No matching results found.</div>';
            panel.classList.remove('hidden');
            return;
          }

          list.innerHTML = items.map((item) => `
            <a href="${item.link}" class="block border-b border-slate-200 px-3 py-2 last:border-b-0 hover:bg-slate-50">
              <div class="flex justify-between text-xs uppercase tracking-wide text-slate-500">
                <span>${item.type}</span>
              </div>
              <div class="mt-1 text-sm font-medium text-slate-700">${item.label}</div>
            </a>
          `).join('');

          panel.classList.remove('hidden');
        } catch (error) {
          console.error(error);
        }
      }, 350);
    });
  }

  const navItems = document.querySelectorAll('[data-page]');
  navItems.forEach((item) => {
    const page = item.getAttribute('data-page');
    if (page === pathName) {
      item.classList.add('bg-sky-50', 'text-sky-700');
    }
  });
});
