// Fichier partagé pour toutes les pages
// Contient les données et les fonctions utilitaires

const defaultHosts = [
  { id: 1, name: 'Bac - Centre', lat: -3.38, lng: 29.36, status: 'Disponible', type: 'Balcon', capacity: 25, phone: '+25768800001' },
  { id: 2, name: 'Bac - Gitega', lat: -3.43, lng: 29.93, status: 'Presque plein', type: 'Jardin', capacity: 40, phone: '+25768800002' },
  { id: 3, name: 'Bac - Ngozi', lat: -2.91, lng: 29.83, status: 'Plein / En maturation', type: 'Cour', capacity: 60, phone: '+25768800003' }
];

const defaultResources = [
  {
    id: 1,
    title: 'Guide pratique du compostage urbain',
    description: 'Méthode courte, claire et adaptée aux petites surfaces.',
    category: 'Guide',
    cover: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80',
    content: 'https://example.com/guide-compostage',
    status: 'approuvée'
  },
  {
    id: 2,
    title: 'Vidéo: les bases du compost',
    description: 'Un tour d\'horizon rapide pour démarrer sans erreur.',
    category: 'Vidéo',
    cover: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
    content: 'https://example.com/video-compost',
    status: 'approuvée'
  }
];

const defaultUsers = [
  { id: 1, name: 'Hôte Demo', email: 'hote@demo.com', password: 'demo123', role: 'host', phone: '+25768000000' }
];

const STORAGE_KEYS = {
  hosts: 'compostage_hosts_v3',
  reports: 'compostage_reports_v3',
  resources: 'compostage_resources_v3',
  users: 'compostage_users_v3',
  session: 'compostage_session_v3'
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initSeedData() {
  if (!localStorage.getItem(STORAGE_KEYS.hosts)) {
    writeJson(STORAGE_KEYS.hosts, defaultHosts);
  }
  if (!localStorage.getItem(STORAGE_KEYS.reports)) {
    writeJson(STORAGE_KEYS.reports, [{ id: 1, hostId: 2, reason: 'Informations incorrectes', details: 'Le bac a été déplacé sans mise à jour.', count: 2 }]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.resources)) {
    writeJson(STORAGE_KEYS.resources, defaultResources);
  }
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    writeJson(STORAGE_KEYS.users, defaultUsers);
  }
  if (!localStorage.getItem(STORAGE_KEYS.session)) {
    writeJson(STORAGE_KEYS.session, null);
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => toast.classList.remove('show'), 2400);
}

function getHosts() {
  const hosts = readJson(STORAGE_KEYS.hosts, defaultHosts);
  return hosts.filter(host => host && !host.suspended);
}

function getReports() {
  return readJson(STORAGE_KEYS.reports, []);
}

function getResources() {
  return readJson(STORAGE_KEYS.resources, defaultResources);
}

function getUsers() {
  return readJson(STORAGE_KEYS.users, defaultUsers);
}

function getSession() {
  return readJson(STORAGE_KEYS.session, null);
}

function setSession(session) {
  writeJson(STORAGE_KEYS.session, session);
  updateSessionBadge();
}

function updateSessionBadge() {
  const session = getSession();
  const badge = document.getElementById('host-session-state');
  if (!badge) return;

  if (!session) {
    badge.textContent = 'Visiteur';
    return;
  }

  badge.textContent = session.role === 'admin' ? 'Admin connecté' : `Hôte : ${session.name}`;
}

function getHostById(id) {
  return getHosts().find(host => Number(host.id) === Number(id));
}

function statusTone(status) {
  if (status === 'Disponible') return 'success';
  if (status === 'Presque plein') return 'warning';
  return 'danger';
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Impossible de lire le fichier'));
    reader.readAsDataURL(file);
  });
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
  initSeedData();

  // Gestion des modales
  document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', () => closeModal(button.dataset.close));
  });

  // Fermer modal en cliquant sur le fond
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal(modal.id);
    });
  });

  // Gestion des onglets généraux
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.admin-panel-section').forEach(panel => panel.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(`${button.dataset.tab}-panel`)?.classList.add('active');
    });
  });

  // Gestion des onglets de connexion
  document.querySelectorAll('.auth-tab').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
      button.classList.add('active');

      const targetId = button.dataset.authTab === 'register' ? 'host-register-form' : `${button.dataset.authTab}-login-form`;
      const targetForm = document.getElementById(targetId);
      if (targetForm) {
        targetForm.classList.add('active');
      }
    });
  });
});
