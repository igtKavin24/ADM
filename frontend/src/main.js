import { createNav, createMobileTopbar } from './components/nav.js';
import { landingPage } from './pages/landing.js';
import { overviewPage } from './pages/overview.js';
import { forecastPage } from './pages/forecast.js';
import { networkPage } from './pages/network.js';
import { investigatePage } from './pages/investigate.js';
import { whatIfPage } from './pages/whatif.js';
import { intervenePage } from './pages/intervene.js';
import { comparePage } from './pages/compare.js';
import { experimentPage } from './pages/experiment.js';
import { methodologyPage } from './pages/methodology.js';
import { howItWorksPage } from './pages/howItWorks.js';
import { state } from './state.js';

const routes = {
  '#landing': landingPage,
  '#overview': overviewPage,
  '#forecast': forecastPage,
  '#network': networkPage,
  '#investigate': investigatePage,
  '#whatif': whatIfPage,
  '#intervene': intervenePage,
  '#compare': comparePage,
  '#experiment': experimentPage,
  '#methodology': methodologyPage,
  '#howitworks': howItWorksPage
};

async function renderApp() {
  // Initialize shared state metadata from backend provenance once
  await state.init();

  const hash = window.location.hash || '#landing';
  const app = document.getElementById('app');
  app.innerHTML = '';

  if (hash === '#landing') {
    app.appendChild(landingPage());
    return;
  }

  // Mobile Topbar
  const topbar = createMobileTopbar();
  
  // App Sidebar
  const nav = createNav(hash);
  app.appendChild(nav);

  // Main Wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'main-wrapper';
  wrapper.appendChild(topbar);

  // Wire mobile menu toggle
  const toggleBtn = topbar.querySelector('#mobile-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  const main = document.createElement('main');
  main.className = 'main-content page-enter';

  const pageFactory = routes[hash] || overviewPage;
  const pageEl = pageFactory();
  main.appendChild(pageEl);

  wrapper.appendChild(main);
  app.appendChild(wrapper);

  // Animation trigger
  void main.offsetWidth;
  main.classList.add('page-enter-active');
  main.classList.remove('page-enter');
}

window.addEventListener('hashchange', () => {
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

renderApp();
