import type { NavigateFunction } from 'react-router-dom';

export const SUPPORT_SECTION_ID = 'support';

export const scrollToSupportSection = () => {
  const supportSection = document.getElementById(SUPPORT_SECTION_ID) ?? document.getElementById('support-section');

  supportSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const goToSupportSection = (navigate: NavigateFunction, pathname: string) => {
  if (pathname === '/') {
    window.requestAnimationFrame(scrollToSupportSection);
    return;
  }

  navigate(`/#${SUPPORT_SECTION_ID}`);
};