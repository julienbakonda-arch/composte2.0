// Logique de la page Connexion
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('admin-login-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const pass = document.getElementById('admin-pass').value;
    if (pass === '1234admin') {
      setSession({ role: 'admin', name: 'Administrateur', email: 'admin@compostage.local' });
      showToast('Connexion admin réussie.');
      window.location.href = 'admin.html';
      return;
    }
    showToast('Mot de passe admin incorrect.');
  });

  document.getElementById('host-login-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('host-login-email').value.trim().toLowerCase();
    const pass = document.getElementById('host-login-pass').value;
    const users = getUsers();
    const user = users.find(item => item.email.toLowerCase() === email && item.password === pass && item.role === 'host');

    if (!user) {
      showToast('Identifiants hôte introuvables.');
      return;
    }

    setSession({ role: 'host', name: user.name, email: user.email, phone: user.phone || '' });
    showToast('Connexion hôte réussie.');
    window.location.href = 'host.html';
  });

  document.getElementById('host-register-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('host-name').value.trim();
    const email = document.getElementById('host-email').value.trim().toLowerCase();
    const phone = document.getElementById('host-phone').value.trim();
    const password = document.getElementById('host-password').value;

    if (!name || !email || !phone || password.length < 4) {
      showToast('Complétez le formulaire pour créer un compte hôte.');
      return;
    }

    const users = getUsers();
    if (users.some(user => user.email.toLowerCase() === email)) {
      showToast('Cette adresse email est déjà utilisée.');
      return;
    }

    const cleanPhone = phone.replace(/[^\d+]/g, '').replace(/^00/, '+');
    const newUser = { id: Date.now(), name, email, phone: cleanPhone, password, role: 'host' };
    users.push(newUser);
    writeJson(STORAGE_KEYS.users, users);
    setSession({ role: 'host', name, email, phone: cleanPhone });
    document.getElementById('host-register-form').reset();
    showToast('Compte hôte créé et connecté.');
    window.location.href = 'host.html';
  });
});
