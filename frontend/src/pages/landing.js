
export function landingPage() {
  const div = document.createElement('div');
  div.style.height = '100vh';
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'center';
  div.style.textAlign = 'center';
  div.style.background = 'radial-gradient(circle at center, var(--color-bg-surface), var(--color-bg-primary))';
  div.style.position = 'relative';
  
  const bg = document.createElement('div');
  bg.style.position = 'absolute';
  bg.style.inset = '0';
  bg.style.opacity = '0.05';
  bg.style.backgroundImage = 'linear-gradient(var(--color-accent-gold) 1px, transparent 1px), linear-gradient(90deg, var(--color-accent-gold) 1px, transparent 1px)';
  bg.style.backgroundSize = '40px 40px';
  div.appendChild(bg);

  const content = document.createElement('div');
  content.style.zIndex = '1';
  content.innerHTML = `
    <h1 class="cinzel" style="font-size: 4rem; margin-bottom: var(--spacing-16); color: var(--color-accent-gold); letter-spacing: 4px; text-shadow: 0 0 20px rgba(201,168,76,0.3);">JARASANDHA</h1>
    <h2 class="cinzel" style="font-size: 1.5rem; margin-bottom: var(--spacing-24); color: var(--color-text-primary); font-weight:400;">Strategic Infrastructure Resilience Engine</h2>
    <p style="font-size: 1.1rem; color: var(--color-text-secondary); max-width: 600px; margin: 0 auto var(--spacing-48);">Forecast Risk. Understand Consequence. Prioritize Intervention.</p>
    <div style="display:flex; gap:var(--spacing-16); justify-content:center; margin-bottom: var(--spacing-64);">
      <a href="#overview" class="btn btn-primary" style="text-decoration:none; padding:12px 24px; font-size:1.1rem;">Enter Resilience Lab</a>
      <a href="#howitworks" class="btn btn-secondary" style="text-decoration:none; padding:12px 24px; font-size:1.1rem;">How It Works</a>
    </div>
    <div style="max-width: 800px; margin: 0 auto; color: var(--color-text-dim); font-size: 0.9rem; font-style: italic; border-top: 1px solid var(--color-border); padding-top: var(--spacing-24);">
      "JARASANDHA translates a strategic principle inspired by the Jarāsandha episode into a modern network-resilience problem: identify the decisive vulnerability and concentrate limited resources where they can have the greatest effect."
    </div>
  `;
  div.appendChild(content);
  return div;
}
