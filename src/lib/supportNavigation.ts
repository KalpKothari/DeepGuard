import type { NavigateFunction } from 'react-router-dom';

export const SUPPORT_SECTION_ID = 'support-section';

export const scrollToSupportSection = () => {
  document.getElementById(SUPPORT_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const goToSupportSection = (navigate: NavigateFunction, pathname: string) => {
  if (pathname === '/') {
    scrollToSupportSection();
    return;
  }

  navigate('/', {
    state: { scrollToSupportSection: true },
  });
};