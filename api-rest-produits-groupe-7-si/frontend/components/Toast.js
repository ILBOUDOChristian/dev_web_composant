export function showToast(message, tone = 'default') {
  const existing = document.querySelector('.notice-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `notice-toast ${tone === 'error' ? 'tone-danger' : ''}`;
  toast.textContent = message;

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('active'));

  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}
