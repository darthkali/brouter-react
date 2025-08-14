// CSS für bewegte gestrichelte Linie, Pulse-Animation und nummerierte Waypoints
const animatedDashStyle = `
  @keyframes dash {
    0% { stroke-dashoffset: 0; }
    100% { stroke-dashoffset: -20; }
  }
  .animated-dash {
    stroke-dasharray: 10 5;
    animation: dash 1s linear infinite;
  }
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
    100% { opacity: 1; transform: scale(1); }
  }
  .numbered-waypoint-icon {
    background: transparent;
    border: none;
    z-index: 1000 !important;
    position: relative;
  }
  .numbered-waypoint-icon svg {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    cursor: pointer;
  }
  .numbered-waypoint-icon:hover svg {
    transform: scale(1.1);
    transition: transform 0.2s ease;
  }
`;

// Inject CSS into document head
export const injectAnimationStyles = () => {
  if (!document.querySelector('#animated-dash-style')) {
    const style = document.createElement('style');
    style.id = 'animated-dash-style';
    style.textContent = animatedDashStyle;
    document.head.appendChild(style);
  }
};