import L from 'leaflet';

export class EditButtonControl extends L.Control {
  private container: HTMLButtonElement | null = null;
  private onToggleEdit: () => void;
  private isEditingMode: boolean;

  constructor(onToggleEdit: () => void, isEditingMode: boolean, options?: L.ControlOptions) {
    super(options);
    this.onToggleEdit = onToggleEdit;
    this.isEditingMode = isEditingMode;
  }

  onAdd() {
    this.container = L.DomUtil.create('button', 'leaflet-edit-control') as HTMLButtonElement;
    this.updateButton();
    
    // Prevent map events when interacting with control
    L.DomEvent.disableClickPropagation(this.container);
    this.container.addEventListener('click', this.onToggleEdit);
    
    return this.container;
  }

  updateButton() {
    if (!this.container) return;
    
    this.container.style.cssText = `
      background-color: ${this.isEditingMode ? 'var(--color-error)' : 'var(--color-primary)'};
      color: var(--color-text-primary);
      border: none;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: var(--shadow-md);
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 5px;
      transition: all 0.2s ease;
    `;
    
    this.container.innerHTML = `<i class="fas ${this.isEditingMode ? 'fa-stop' : 'fa-edit'}"></i>`;
  }

  updateState(isEditingMode: boolean) {
    this.isEditingMode = isEditingMode;
    this.updateButton();
  }

  onRemove() {
    // Cleanup if needed
  }
}