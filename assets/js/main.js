document.addEventListener('DOMContentLoaded', () => {
  const defaultHosts = [
    { id: 1, name: 'Bac - Centre', lat: -3.38, lng: 29.36, status: 'Disponible', type: 'Balcon', capacity: 25 },
    { id: 2, name: 'Bac - Gitega', lat: -3.43, lng: 29.93, status: 'Presque plein', type: 'Jardin', capacity: 40 },
    { id: 3, name: 'Bac - Ngozi', lat: -2.91, lng: 29.83, status: 'Plein / En maturation', type: 'Cour', capacity: 60 }
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
      description: 'Un tour d’horizon rapide pour démarrer sans erreur.',
      category: 'Vidéo',
      cover: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
      content: 'https://example.com/video-compost',
      status: 'approuvée'
    }
  ];

  const defaultUsers = [
    { id: 1, name: 'Hôte Demo', email: 'hote@demo.com', password: 'demo123', role: 'host' }
  ];

  const STORAGE_KEYS = {
    hosts: 'compostage_hosts_v2',
    reports: 'compostage_reports_v2',
    resources: 'compostage_resources_v2',
    users: 'compostage_users_v2',
    session: 'compostage_session_v2'
  };

  const toast = document.getElementById('toast');
  const map = L.map('map').setView([-3.5, 29.9], 8);
  const hostMap = L.map('host-map').setView([-3.5, 29.9], 7);
  let mapMarkers = [];
  let hostMarker = null;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(hostMap);

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

  function renderPublicMap() {
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = [];

    const hosts = getHosts();

    hosts.forEach(host => {
      const marker = L.marker([host.lat, host.lng]).addTo(map).bindPopup(`
        <strong>${host.name}</strong><br>
        ${host.status}<br>
        <a href="https://wa.me/?text=${encodeURIComponent('Bonjour, je souhaite voir le bac de compostage: ' + host.name + ' (' + host.lat + ', ' + host.lng + ')')}" target="_blank" rel="noreferrer">WhatsApp</a>
      `);
      mapMarkers.push(marker);
    });

    const hostList = document.getElementById('host-list');
    hostList.innerHTML = '';

    hosts.forEach(host => {
      const card = document.createElement('article');
      card.className = 'host-item';
      card.innerHTML = `
        <div class="host-item-top">
          <h3>${host.name}</h3>
          <span class="status-pill ${statusTone(host.status)}">${host.status}</span>
        </div>
        <p>Type : ${host.type || 'Non renseigné'}</p>
        <p>Capacité : ${host.capacity || 0} kg</p>
        <p>${host.lat}, ${host.lng}</p>
        <div class="host-item-actions">
          <a class="btn btn-secondary btn-small" href="https://wa.me/?text=${encodeURIComponent('Bonjour, je voudrais visiter le bac ' + host.name)}" target="_blank" rel="noreferrer">WhatsApp</a>
          <button type="button" class="btn btn-warning btn-small" data-report-host="${host.id}">Signaler</button>
        </div>
      `;
      hostList.appendChild(card);
    });

    const reportSelect = document.getElementById('report-host-select');
    if (reportSelect) {
      reportSelect.innerHTML = hosts.map(host => `<option value="${host.id}">${host.name}</option>`).join('') || '<option value="">Aucun bac</option>';
    }
  }

  function renderPublicLibrary() {
    const libraryGrid = document.getElementById('library-grid');
    const resources = getResources().filter(resource => resource.status === 'approuvée');

    if (!resources.length) {
      libraryGrid.innerHTML = '<article class="resource-card"><div class="resource-body"><h3>Aucune ressource publiée</h3><p>La communauté peut soumettre sa première ressource.</p></div></article>';
      return;
    }

    libraryGrid.innerHTML = resources.map(resource => `
      <article class="resource-card">
        <div class="resource-cover" style="background-image: url('${resource.cover || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80'}');"></div>
        <div class="resource-body">
          <span class="resource-tag">${resource.category}</span>
          <h3>${resource.title}</h3>
          <p>${resource.description}</p>
          <div class="resource-links">
            <a href="${resource.content || '#'}" target="_blank" rel="noreferrer">Ouvrir</a>
            <button type="button">Enregistrer</button>
          </div>
        </div>
      </article>
    `).join('');
  }

  function renderAdminHosts() {
    const list = document.getElementById('admin-hosts-list');
    const hosts = getHosts();

    list.innerHTML = hosts.map(host => `
      <article class="admin-item">
        <div class="admin-item-head">
          <h3>${host.name}</h3>
          <span class="status-pill ${statusTone(host.status)}">${host.status}</span>
        </div>
        <p>Type : ${host.type || 'Non renseigné'} • Capacité : ${host.capacity || 0}</p>
        <p>Coordonnées : ${host.lat}, ${host.lng}</p>
        <div class="admin-actions">
          <button type="button" data-host-status="${host.id}">Modifier le statut</button>
          <button type="button" data-host-delete="${host.id}">Supprimer</button>
        </div>
      </article>
    `).join('');
  }

  function renderAdminReports() {
    const list = document.getElementById('admin-reports-list');
    const reports = getReports();

    if (!reports.length) {
      list.innerHTML = '<div class="admin-item"><p>Aucun signalement actif.</p></div>';
      return;
    }

    list.innerHTML = reports.map(report => {
      const host = getHostById(report.hostId) || { name: 'Hôte inconnu' };
      return `
        <article class="admin-item">
          <div class="admin-item-head">
            <h3>${host.name}</h3>
            <span class="status-pill danger">${report.reason}</span>
          </div>
          <p>${report.details}</p>
          <div class="admin-actions">
            <button type="button" class="approve" data-report-rehabilitate="${report.id}">Réhabiliter</button>
            <button type="button" class="reject" data-report-delete="${report.id}">Supprimer & bannir</button>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderAdminLibrary() {
    const list = document.getElementById('admin-library-list');
    const resources = getResources().filter(resource => resource.status !== 'approuvée');

    if (!resources.length) {
      list.innerHTML = '<div class="admin-item"><p>Aucune ressource en attente.</p></div>';
      return;
    }

    list.innerHTML = resources.map(resource => `
      <article class="admin-item">
        <div class="admin-item-head">
          <h3>${resource.title}</h3>
          <span class="status-pill warning">${resource.status === 'en_attente' ? 'En attente' : resource.status}</span>
        </div>
        <p>Catégorie : ${resource.category}</p>
        <p>${resource.description}</p>
        <img src="${resource.cover}" alt="Couverture" style="width:100%;max-height:180px;object-fit:cover;border-radius:0.8rem;margin:0.8rem 0;" />
        <a href="${resource.content || '#'}" target="_blank" rel="noreferrer">Voir le contenu</a>
        <div class="admin-actions">
          <button type="button" class="approve" data-library-approve="${resource.id}">Approuver</button>
          <button type="button" class="reject" data-library-reject="${resource.id}">Rejeter</button>
        </div>
      </article>
    `).join('');
  }

  function renderAdmin() {
    renderAdminHosts();
    renderAdminReports();
    renderAdminLibrary();
  }

  function refreshAll() {
    renderPublicMap();
    renderPublicLibrary();
    renderAdmin();
    updateSessionBadge();
  }

  function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
  }

  function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
  }

  function setHostPosition(lat, lng) {
    document.getElementById('lat-value').value = lat.toFixed(5);
    document.getElementById('lng-value').value = lng.toFixed(5);

    if (hostMarker) {
      hostMap.removeLayer(hostMarker);
    }

    hostMarker = L.marker([lat, lng]).addTo(hostMap);
    hostMap.setView([lat, lng], 13);
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Impossible de lire le fichier'));
      reader.readAsDataURL(file);
    });
  }

  document.getElementById('quick-login-btn').addEventListener('click', () => {
    document.getElementById('connexion').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('open-host-form').addEventListener('click', () => {
    document.getElementById('host-space').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('locate-btn').addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('Géolocalisation non prise en charge.');
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      map.setView([lat, lng], 14);
      L.circleMarker([lat, lng], { radius: 8, color: '#2d7a49' }).addTo(map);
      showToast('Position actuelle ajoutée à la carte.');
    }, () => showToast('Impossible d’obtenir votre position.'));
  });

  document.getElementById('report-btn').addEventListener('click', () => {
    const hosts = getHosts();
    if (!hosts.length) {
      showToast('Aucun bac disponible pour le moment.');
      return;
    }
    openModal('report-modal');
  });

  document.getElementById('resource-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const coverUrl = String(form.get('coverUrl') || '').trim();
    const contentLink = String(form.get('contentLink') || '').trim();
    const contentFile = event.currentTarget.elements.contentFile.files[0];
    const coverFile = event.currentTarget.elements.coverFile.files[0];

    const title = String(form.get('title') || '').trim();
    const description = String(form.get('description') || '').trim();
    const category = String(form.get('category') || 'Guide');

    if (!title || !description) {
      showToast('Complétez le titre et la description.');
      return;
    }

    const resources = getResources();
    let coverValue = coverUrl || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80';
    let contentValue = contentLink || (contentFile ? contentFile.name : 'https://example.com');

    try {
      if (coverFile) {
        coverValue = await readFileAsDataURL(coverFile);
      }
      if (contentFile) {
        contentValue = contentFile.name;
      }
    } catch (error) {
      showToast('Le fichier sélectionné est invalide.');
      return;
    }

    resources.unshift({
      id: Date.now(),
      title,
      description,
      category,
      cover: coverValue,
      content: contentValue,
      status: 'en_attente'
    });

    writeJson(STORAGE_KEYS.resources, resources);
    event.currentTarget.reset();
    closeModal('resource-modal');
    refreshAll();
    showToast('Ressource soumise et en attente de modération.');
  });

  document.getElementById('add-resource').addEventListener('click', () => openModal('resource-modal'));

  document.getElementById('report-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const hostId = Number(form.get('hostId'));
    const details = String(form.get('details') || '').trim();
    const reason = String(form.get('reason') || 'Autre');

    if (!hostId || !details) {
      showToast('Sélectionnez un bac et précisez le motif.');
      return;
    }

    const reports = getReports();
    reports.unshift({ id: Date.now(), hostId, reason, details, count: 1 });
    writeJson(STORAGE_KEYS.reports, reports);

    const hostList = getHosts();
    const host = hostList.find(item => Number(item.id) === Number(hostId));
    if (host) {
      const count = reports.filter(report => Number(report.hostId) === Number(hostId)).length;
      if (count >= 3) {
        const hosts = readJson(STORAGE_KEYS.hosts, defaultHosts);
        const target = hosts.find(item => Number(item.id) === Number(hostId));
        if (target) {
          target.status = 'Suspendu';
          target.suspended = true;
          writeJson(STORAGE_KEYS.hosts, hosts);
          showToast('Le bac a été suspendu après plusieurs signalements.');
        }
      } else {
        showToast('Signalement enregistré.');
      }
    }

    event.currentTarget.reset();
    closeModal('report-modal');
    refreshAll();
  });

  document.getElementById('host-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lat = Number(document.getElementById('lat-value').value);
    const lng = Number(document.getElementById('lng-value').value);

    if (!lat || !lng) {
      showToast('Cliquez sur la carte pour choisir un point GPS exact.');
      return;
    }

    const hosts = readJson(STORAGE_KEYS.hosts, defaultHosts);
    const host = {
      id: Date.now(),
      name: String(form.get('hostName') || '').trim(),
      type: String(form.get('spaceType') || 'Non renseigné'),
      experience: String(form.get('experience') || 'Débutant'),
      material: String(form.get('material') || 'Non renseigné'),
      capacity: Number(form.get('capacity') || 0),
      status: String(form.get('status') || 'Disponible'),
      lat,
      lng
    };

    hosts.unshift(host);
    writeJson(STORAGE_KEYS.hosts, hosts);
    event.currentTarget.reset();
    document.getElementById('lat-value').value = '';
    document.getElementById('lng-value').value = '';
    if (hostMarker) {
      hostMap.removeLayer(hostMarker);
      hostMarker = null;
    }
    refreshAll();
    showToast('Votre espace hôte a été publié.');
  });

  document.getElementById('admin-login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const pass = document.getElementById('admin-pass').value;
    if (pass === '1234admin') {
      setSession({ role: 'admin', name: 'Administrateur', email: 'admin@compostage.local' });
      showToast('Connexion admin réussie.');
      document.getElementById('admin').scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('admin-pass').value = '';
      return;
    }
    showToast('Mot de passe admin incorrect.');
  });

  document.getElementById('host-login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('host-login-email').value.trim().toLowerCase();
    const pass = document.getElementById('host-login-pass').value;
    const users = getUsers();
    const user = users.find(item => item.email.toLowerCase() === email && item.password === pass && item.role === 'host');

    if (!user) {
      showToast('Identifiants hôte introuvables.');
      return;
    }

    setSession({ role: 'host', name: user.name, email: user.email });
    showToast('Connexion hôte réussie.');
    document.getElementById('host-space').scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('host-login-pass').value = '';
  });

  document.getElementById('host-register-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('host-name').value.trim();
    const email = document.getElementById('host-email').value.trim().toLowerCase();
    const password = document.getElementById('host-password').value;

    if (!name || !email || password.length < 4) {
      showToast('Complétez le formulaire pour créer un compte hôte.');
      return;
    }

    const users = getUsers();
    if (users.some(user => user.email.toLowerCase() === email)) {
      showToast('Cette adresse email est déjà utilisée.');
      return;
    }

    const newUser = { id: Date.now(), name, email, password, role: 'host' };
    users.push(newUser);
    writeJson(STORAGE_KEYS.users, users);
    setSession({ role: 'host', name, email });
    document.getElementById('host-register-form').reset();
    showToast('Compte hôte créé et connecté.');
    document.getElementById('host-space').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

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

  document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', () => closeModal(button.dataset.close));
  });

  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.admin-panel-section').forEach(panel => panel.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(`${button.dataset.tab}-panel`).classList.add('active');
    });
  });

  document.body.addEventListener('click', (event) => {
    const reportButton = event.target.closest('[data-report-host]');
    if (reportButton) {
      const select = document.getElementById('report-host-select');
      select.value = reportButton.dataset.reportHost;
      openModal('report-modal');
      return;
    }

    const hostStatusButton = event.target.closest('[data-host-status]');
    if (hostStatusButton) {
      const hosts = readJson(STORAGE_KEYS.hosts, defaultHosts);
      const host = hosts.find(item => Number(item.id) === Number(hostStatusButton.dataset.hostStatus));
      if (!host) return;
      const order = ['Disponible', 'Presque plein', 'Plein / En maturation', 'Suspendu'];
      const index = order.indexOf(host.status);
      host.status = order[(index + 1) % order.length];
      if (host.status === 'Suspendu') host.suspended = true;
      writeJson(STORAGE_KEYS.hosts, hosts);
      refreshAll();
      showToast('Statut du bac mis à jour.');
      return;
    }

    const hostDeleteButton = event.target.closest('[data-host-delete]');
    if (hostDeleteButton) {
      const hosts = readJson(STORAGE_KEYS.hosts, defaultHosts).filter(item => Number(item.id) !== Number(hostDeleteButton.dataset.hostDelete));
      writeJson(STORAGE_KEYS.hosts, hosts);
      refreshAll();
      showToast('Hôte supprimé.');
      return;
    }

    const reportRehabilitateButton = event.target.closest('[data-report-rehabilitate]');
    if (reportRehabilitateButton) {
      const reports = getReports().filter(item => Number(item.id) !== Number(reportRehabilitateButton.dataset.reportRehabilitate));
      writeJson(STORAGE_KEYS.reports, reports);
      refreshAll();
      showToast('Signalement réhabilité.');
      return;
    }

    const reportDeleteButton = event.target.closest('[data-report-delete]');
    if (reportDeleteButton) {
      const reports = getReports().filter(item => Number(item.id) !== Number(reportDeleteButton.dataset.reportDelete));
      writeJson(STORAGE_KEYS.reports, reports);
      refreshAll();
      showToast('Signalement supprimé.');
      return;
    }

    const libraryApprove = event.target.closest('[data-library-approve]');
    if (libraryApprove) {
      const resources = getResources();
      const resource = resources.find(item => Number(item.id) === Number(libraryApprove.dataset.libraryApprove));
      if (resource) {
        resource.status = 'approuvée';
        writeJson(STORAGE_KEYS.resources, resources);
      }
      refreshAll();
      showToast('Ressource approuvée.');
      return;
    }

    const libraryReject = event.target.closest('[data-library-reject]');
    if (libraryReject) {
      const resources = getResources().filter(item => Number(item.id) !== Number(libraryReject.dataset.libraryReject));
      writeJson(STORAGE_KEYS.resources, resources);
      refreshAll();
      showToast('Ressource rejetée.');
    }
  });

  document.getElementById('report-modal').addEventListener('click', (event) => {
    if (event.target.id === 'report-modal') closeModal('report-modal');
  });

  document.getElementById('resource-modal').addEventListener('click', (event) => {
    if (event.target.id === 'resource-modal') closeModal('resource-modal');
  });

  hostMap.on('click', (event) => setHostPosition(event.latlng.lat, event.latlng.lng));
  initSeedData();
  updateSessionBadge();
  refreshAll();
  setHostPosition(-3.5, 29.9);
});
