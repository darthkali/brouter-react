import L from 'leaflet';

export class SwapButtonControl extends L.Control {
  private container: HTMLButtonElement | null = null;
  private onSwapPoints: () => void;

  constructor(onSwapPoints: () => void, options?: L.ControlOptions) {
    super(options);
    this.onSwapPoints = onSwapPoints;
  }

  onAdd() {
    this.container = L.DomUtil.create('button', 'leaflet-swap-control') as HTMLButtonElement;
    this.container.style.cssText = `
      background-color: var(--color-primary);
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
    
    this.container.innerHTML = '<i class="fas fa-exchange-alt"></i>';
    
    // Prevent map events when interacting with control
    L.DomEvent.disableClickPropagation(this.container);
    this.container.addEventListener('click', this.onSwapPoints);
    
    return this.container;
  }

  onRemove() {
    // Cleanup if needed
  }
}