export function ProductDialog(product = null, onSave) {
  const dialog = document.createElement('dialog');
  dialog.className = 'modal-overlay';

  const isEdit = Boolean(product);

  dialog.innerHTML = `
    <form method="dialog" class="modal-form-wrap">
      <div class="modal-head">
        <h2>${isEdit ? 'Modifier le produit' : 'Nouveau produit'}</h2>
        <button class="btn-dismiss" type="button" aria-label="Fermer">×</button>
      </div>
      <div class="modal-body-content">
        <div class="field-group">
          <label for="dlg-sku">Référence (SKU)</label>
          <input type="text" id="dlg-sku" value="${product?.sku || ''}" placeholder="Ex: PRD-0005" required>
        </div>
        <div class="field-group">
          <label for="dlg-name">Nom du produit</label>
          <input type="text" id="dlg-name" value="${product?.name || ''}" placeholder="Ex: Clavier mécanique" required>
        </div>
        <div class="field-group">
          <label for="dlg-category">Catégorie</label>
          <select id="dlg-category">
            <option value="Périphériques" ${product?.category === 'Périphériques' ? 'selected' : ''}>Périphériques</option>
            <option value="Écrans" ${product?.category === 'Écrans' ? 'selected' : ''}>Écrans</option>
            <option value="Accessoires" ${product?.category === 'Accessoires' ? 'selected' : ''}>Accessoires</option>
          </select>
        </div>
        <div class="field-group">
          <label for="dlg-price">Prix (XOF)</label>
          <input type="number" id="dlg-price" min="0" step="100" value="${product?.price || 15000}" required>
        </div>
        <div class="field-group">
          <label for="dlg-stock">Quantité en stock</label>
          <input type="number" id="dlg-stock" min="0" value="${product?.stock ?? 10}" required>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn-ghost btn-cancel" type="button">Annuler</button>
        <button class="btn-add-item" type="submit">
          ${isEdit ? 'Enregistrer les modifications' : 'Créer le produit'}
        </button>
      </div>
    </form>
  `;

  const form = dialog.querySelector('form');
  const dismissBtn = dialog.querySelector('.btn-dismiss');
  const cancelBtn = dialog.querySelector('.btn-cancel');

  const closeDialog = () => {
    dialog.close();
    dialog.remove();
  };

  dismissBtn.addEventListener('click', closeDialog);
  cancelBtn.addEventListener('click', closeDialog);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      sku: form.querySelector('#dlg-sku').value.trim(),
      name: form.querySelector('#dlg-name').value.trim(),
      category: form.querySelector('#dlg-category').value,
      price: parseFloat(form.querySelector('#dlg-price').value),
      stock: parseInt(form.querySelector('#dlg-stock').value, 10),
      description: product?.description || ''
    };
    onSave(payload, product?.id);
    closeDialog();
  });

  document.body.appendChild(dialog);
  dialog.showModal();
}
