document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = document.body.dataset.page === 'login';
  const authForm = document.getElementById(isLoginPage ? 'login-form' : 'register-form');

  if (!authForm) return;

  const passwordToggle = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm-password');

  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
      const show = passwordInput.type === 'password';
      passwordInput.type = show ? 'text' : 'password';
      if (confirmInput) confirmInput.type = show ? 'text' : 'password';
    });
  }

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = authForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = isLoginPage ? 'Signing in...' : 'Creating account...';

    try {
      const formData = new FormData(authForm);
      const payload = Object.fromEntries(formData.entries());

      const endpoint = isLoginPage ? '/auth/login' : '/auth/register';
      const response = await api.post(endpoint, payload);

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      window.location.href = '/dashboard.html';
    } catch (error) {
      const messageBox = document.getElementById('auth-message');
      if (messageBox) {
        messageBox.textContent = error.message || 'Authentication failed.';
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = isLoginPage ? 'Sign in' : 'Create account';
    }
  });
});
