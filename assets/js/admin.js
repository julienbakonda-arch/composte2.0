// Logique de la page Admin
document.addEventListener('DOMContentLoaded', () => {
  // Vérifier la session
  const session = getSession();
  if (!session || session.role !== 'admin') {
    showToast('Accès réservé aux administrateurs.');
    window.location.href = 'connexion.html';
    return;
  }

  function renderAdminHosts() {
    const list = document.getElementById('admin-hosts-list');
    const hosts = getHosts();

    if (!list) return;

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

    if (!list) return;

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

    if (!list) return;

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

  function refreshAdmin() {
    renderAdminHosts();
    renderAdminReports();
    renderAdminLibrary();
  }

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    writeJson(STORAGE_KEYS.session, null);
    showToast('Vous avez été déconnecté.');
    window.location.href = 'index.html';
  });

  document.body.addEventListener('click', (event) => {
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
      refreshAdmin();
      showToast('Statut du bac mis à jour.');
      return;
    }

    const hostDeleteButton = event.target.closest('[data-host-delete]');
    if (hostDeleteButton) {
      const hosts = readJson(STORAGE_KEYS.hosts, defaultHosts).filter(item => Number(item.id) !== Number(hostDeleteButton.dataset.hostDelete));
      writeJson(STORAGE_KEYS.hosts, hosts);
      refreshAdmin();
      showToast('Hôte supprimé.');
      return;
    }

    const reportRehabilitateButton = event.target.closest('[data-report-rehabilitate]');
    if (reportRehabilitateButton) {
      const reports = getReports().filter(item => Number(item.id) !== Number(reportRehabilitateButton.dataset.reportRehabilitate));
      writeJson(STORAGE_KEYS.reports, reports);
      refreshAdmin();
      showToast('Signalement réhabilité.');
      return;
    }

    const reportDeleteButton = event.target.closest('[data-report-delete]');
    if (reportDeleteButton) {
      const reports = getReports().filter(item => Number(item.id) !== Number(reportDeleteButton.dataset.reportDelete));
      writeJson(STORAGE_KEYS.reports, reports);
      refreshAdmin();
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
      refreshAdmin();
      showToast('Ressource approuvée.');
      return;
    }

    const libraryReject = event.target.closest('[data-library-reject]');
    if (libraryReject) {
      const resources = getResources().filter(item => Number(item.id) !== Number(libraryReject.dataset.libraryReject));
      writeJson(STORAGE_KEYS.resources, resources);
      refreshAdmin();
      showToast('Ressource rejetée.');
    }
  });

  refreshAdmin();
});
