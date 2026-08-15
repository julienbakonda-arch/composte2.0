// Logique de la page Bibliothèque
document.addEventListener('DOMContentLoaded', () => {
  function renderLibrary() {
    const libraryGrid = document.getElementById('library-grid');
    const resources = getResources().filter(resource => resource.status === 'approuvée');

    if (!libraryGrid) return;

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

  document.getElementById('add-resource')?.addEventListener('click', () => openModal('resource-modal'));

  document.getElementById('resource-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const coverUrl = String(form.get('coverUrl') || '').trim();
    const contentLink = String(form.get('contentLink') || '').trim();
    const contentFile = event.currentTarget.elements.contentFile?.files[0];
    const coverFile = event.currentTarget.elements.coverFile?.files[0];

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
    renderLibrary();
    showToast('Ressource soumise et en attente de modération.');
  });

  renderLibrary();
});
