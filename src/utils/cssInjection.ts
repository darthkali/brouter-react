// CSS für bewegte gestrichelte Linie und Pulse-Animation
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