
import { createNav } from './components/nav.js';
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

function renderApp() {
  const hash = window.location.hash || '#landing';
  const app = document.getElementById('app');
  app.innerHTML = '';
  
  if (hash === '#landing') {
    app.appendChild(routes[hash]());
    return;
  }
  
  // App Shell
  const nav = createNav(hash);
  app.appendChild(nav);
  
  const main = document.createElement('main');
  main.className = 'main-content page-enter';
  
  const pageFactory = routes[hash] || overviewPage;
  const pageEl = pageFactory();
  main.appendChild(pageEl);
  
  app.appendChild(main);
  
  // Trigger reflow for transition
  void main.offsetWidth;
  main.classList.add('page-enter-active');
  main.classList.remove('page-enter');
}

window.addEventListener('hashchange', renderApp);
renderApp();
