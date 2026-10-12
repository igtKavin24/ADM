/**
 * Global Grouped Navigation Component with Mobile Drawer & Clear Route Hierarchy
 */

const NAV_GROUPS = [
  {
    title: 'START',
    items: [
      { id: '#overview', name: 'Overview', num: '01' }
    ]
  },
  {
    title: 'ANALYSE',
    items: [
      { id: '#forecast', name: 'Risk forecast', num: '02' },
      { id: '#network', name: 'Network map', num: '03' },
      { id: '#investigate', name: 'Component ranking', num: '04' }
    ]
  },
  {
    title: 'TEST OPTIONS',
    items: [
      { id: '#whatif', name: 'What-if outage', num: '05' },
      { id: '#intervene', name: 'Intervention planner', num: '06' }
    ]
  },
  {
    title: 'EVALUATE',
    items: [
      { id: '#compare', name: 'Strategy comparison', num: '07' },
      { id: '#experiment', name: 'Experiment lab', num: '08' }
    ]
  },
  {
    title: 'ABOUT THE MODEL',
    items: [
      { id: '#methodology', name: 'Data & methodology', num: '09' },
      { id: '#howitworks', name: 'How JARASANDHA works', num: '10' }
    ]
  }
];

export function createNav(currentHash) {
  const sidebar = document.createElement('nav');
  sidebar.className = 'sidebar';
  sidebar.id = 'app-sidebar';

  // Brand Header
  const brand = document.createElement('div');
  brand.className = 'sidebar-brand';
  brand.innerHTML = `
    <h2 class="brand-font">JARASANDHA</h2>
    <div class="tagline">Grid Resilience Engine</div>
    <div class="sidebar-status-pill">
      <span class="sidebar-status-dot"></span>
      <span>Synthetic IEEE 14-bus</span>
    </div>
  `;
  sidebar.appendChild(brand);

  // Nav Groups
  const groupsUl = document.createElement('ul');
  groupsUl.className = 'nav-groups';

  NAV_GROUPS.forEach(group => {
    const groupLi = document.createElement('li');
    
    const titleEl = document.createElement('div');
    titleEl.className = 'nav-group-title';
    titleEl.textContent = group.title;
    groupLi.appendChild(titleEl);

    const itemsUl = document.createElement('ul');
    itemsUl.style.listStyle = 'none';

    group.items.forEach(item => {
      const itemLi = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.id;
      a.className = `nav-item-link ${currentHash === item.id ? 'active' : ''}`;
      a.innerHTML = `<span class="nav-item-num">${item.num}</span><span>${item.name}</span>`;
      
      // Auto-close sidebar on mobile item tap
      a.addEventListener('click', () => {
        sidebar.classList.remove('open');
      });

      itemLi.appendChild(a);
      itemsUl.appendChild(itemLi);
    });

    groupLi.appendChild(itemsUl);
    groupsUl.appendChild(groupLi);
  });
  sidebar.appendChild(groupsUl);

  // Footer Links
  const footer = document.createElement('div');
  footer.className = 'nav-footer';
  footer.innerHTML = `
    <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-bottom: 8px;">RESEARCH PROTOTYPE</div>
    <a href="#landing" class="nav-footer-link">← Return to welcome</a>
    <a href="#methodology" class="nav-footer-link">Scientific provenance & limits</a>
  `;
  sidebar.appendChild(footer);

  return sidebar;
}

export function createMobileTopbar() {
  const topbar = document.createElement('header');
  topbar.className = 'app-topbar';
  topbar.innerHTML = `
    <button class="mobile-menu-btn" id="mobile-toggle" aria-label="Toggle navigation">
      <span>☰</span> <span>Menu</span>
    </button>
    <div style="font-family:'Cinzel',serif; color:var(--color-accent-gold); font-weight:600; font-size:1.05rem;">
      JARASANDHA
    </div>
    <div style="font-size:0.75rem; color:var(--color-text-muted);">
      IEEE 14-bus
    </div>
  `;
  return topbar;
}
