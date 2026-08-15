// Logique de la page Carte
document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map').setView([-3.5, 29.9], 8);
  let mapMarkers = [];

  function buildWhatsAppLink(host) {
    const cleanPhone = String(host?.phone || '').replace(/[^\d+]/g, '').replace(/^00/, '+');
    const message = encodeURIComponent(`Bonjour, je voudrais visiter le bac ${host?.name || 'compostage'}`);
    return cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;
  }

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

  function renderMap() {
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = [];

    const hosts = getHosts();

    hosts.forEach(host => {
      const marker = L.marker([host.lat, host.lng]).addTo(map).bindPopup(`
        <strong>${host.name}</strong><br>
        ${host.status}<br>
        <a href="${buildWhatsAppLink(host)}" target="_blank" rel="noreferrer">WhatsApp</a>
      `);
      mapMarkers.push(marker);
    });

    const hostList = document.getElementById('host-list');
    if (hostList) {
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
            <a class="btn btn-secondary btn-small" href="${buildWhatsAppLink(host)}" target="_blank" rel="noreferrer">WhatsApp</a>
            <button type="button" class="btn btn-warning btn-small" data-report-host="${host.id}">Signaler</button>
          </div>
        `;
        hostList.appendChild(card);
      });

      // Ajouter les events de signalement
      hostList.addEventListener('click', (event) => {
        const reportButton = event.target.closest('[data-report-host]');
        if (reportButton) {
          const select = document.getElementById('report-host-select');
          if (select) select.value = reportButton.dataset.reportHost;
          openModal('report-modal');
        }
      });
    }

    const reportSelect = document.getElementById('report-host-select');
    if (reportSelect) {
      reportSelect.innerHTML = hosts.map(host => `<option value="${host.id}">${host.name}</option>`).join('') || '<option value="">Aucun bac</option>';
    }
  }

  document.getElementById('locate-btn')?.addEventListener('click', () => {
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
    }, () => showToast('Impossible d\'obtenir votre position.'));
  });

  document.getElementById('report-btn')?.addEventListener('click', () => {
    const hosts = getHosts();
    if (!hosts.length) {
      showToast('Aucun bac disponible pour le moment.');
      return;
    }
    openModal('report-modal');
  });

  document.getElementById('report-form')?.addEventListener('submit', (event) => {
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
    renderMap();
  });

  renderMap();
});
