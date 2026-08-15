// Logique de la page Espace hôte
document.addEventListener('DOMContentLoaded', () => {
  const hostMap = L.map('host-map').setView([-3.5, 29.9], 7);
  let hostMarker = null;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(hostMap);

  function setHostPosition(lat, lng) {
    document.getElementById('lat-value').value = lat.toFixed(5);
    document.getElementById('lng-value').value = lng.toFixed(5);

    if (hostMarker) {
      hostMap.removeLayer(hostMarker);
    }

    hostMarker = L.marker([lat, lng]).addTo(hostMap);
    hostMap.setView([lat, lng], 13);
  }

  document.getElementById('host-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lat = Number(document.getElementById('lat-value').value);
    const lng = Number(document.getElementById('lng-value').value);

    if (!lat || !lng) {
      showToast('Cliquez sur la carte pour choisir un point GPS exact.');
      return;
    }

    const session = getSession();
    const phone = session?.phone || getUsers().find(user => user.email?.toLowerCase() === session?.email?.toLowerCase())?.phone || '';

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
      lng,
      phone: phone || ''
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
    showToast('Votre espace hôte a été publié.');
  });

  hostMap.on('click', (event) => setHostPosition(event.latlng.lat, event.latlng.lng));

  setHostPosition(-3.5, 29.9);
  updateSessionBadge();
});
