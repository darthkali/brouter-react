import L from 'leaflet';

export class ClearButtonControl extends L.Control {
  private container: HTMLButtonElement | null = null;
  private onClearRoute: () => void;

  constructor(onClearRoute: () => void, options?: L.ControlOptions) {
    super(options);
    this.onClearRoute = onClearRoute;
  }

  onAdd() {
    this.container = L.DomUtil.create('button', 'leaflet-clear-control') as HTMLButtonElement;
    this.container.style.cssText = `
      background-color: var(--color-warning);
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
      transition: all 0.2s ease;
    `;
    
    this.container.innerHTML = '<i class="fas fa-trash"></i>';
    
    // Prevent map events when interacting with control
    L.DomEvent.disableClickPropagation(this.container);
    this.container.addEventListener('click', this.onClearRoute);
    
    return this.container;
  }

  onRemove() {
    // Cleanup if needed
  }
}