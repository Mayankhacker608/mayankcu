document.addEventListener('DOMContentLoaded', async () => {
  const profileForm = document.getElementById('profile-form');
  const passwordForm = document.getElementById('password-form');
  const nameInput = document.getElementById('profile-name');
  const phoneInput = document.getElementById('profile-phone');
  const emailInput = document.getElementById('profile-email');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (nameInput) nameInput.value = user.fullName || '';
  if (phoneInput) phoneInput.value = user.phone || '';
  if (emailInput) emailInput.value = user.email || '';

  profileForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      fullName: nameInput.value,
      phone: phoneInput.value,
    };
    try {
      const result = await api.put('/auth/profile', payload);
      localStorage.setItem('user', JSON.stringify(result.user));
      alert('Profile updated successfully.');
    } catch (error) {
      alert(error.message || 'Profile update failed.');
    }
  });

  passwordForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(passwordForm).entries());
    try {
      await api.put('/auth/change-password', payload);
      passwordForm.reset();
      alert('Password updated successfully.');
    } catch (error) {
      alert(error.message || 'Password update failed.');
    }
  });
});
