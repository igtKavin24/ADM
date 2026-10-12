export function landingPage() {
  const div = document.createElement('div');
  div.style.minHeight = '100vh';
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'center';
  div.style.textAlign = 'center';
  div.style.background = 'radial-gradient(ellipse at 50% 40%, var(--color-bg-surface) 0%, var(--color-bg-primary) 75%)';
  div.style.position = 'relative';
  div.style.padding = 'var(--spacing-32) var(--spacing-20)';

  // Geometric blueprint grid overlay
  const bg = document.createElement('div');
  bg.style.position = 'absolute';
  bg.style.inset = '0';
  bg.style.opacity = '0.04';
  bg.style.backgroundImage = 'linear-gradient(var(--color-accent-gold) 1px, transparent 1px), linear-gradient(90deg, var(--color-accent-gold) 1px, transparent 1px)';
  bg.style.backgroundSize = '48px 48px';
  bg.style.pointerEvents = 'none';
  div.appendChild(bg);

  const content = document.createElement('div');
  content.style.position = 'relative';
  content.style.zIndex = '1';
  content.style.maxWidth = '840px';
  content.style.margin = '0 auto';

  content.innerHTML = `
    <div style="display:inline-flex; align-items:center; gap:8px; background:rgba(201,168,76,0.1); border:1px solid var(--color-border); padding:6px 14px; border-radius:20px; font-size:0.78rem; color:var(--color-accent-gold); font-weight:600; text-transform:uppercase; letter-spacing:1px; margin-bottom:var(--spacing-24);">
      <span>⚡</span> Predictive Power-Grid Resilience Engine
    </div>

    <h1 class="brand-font" style="font-size: clamp(2.5rem, 6vw, 4.2rem); margin-bottom: var(--spacing-16); color: var(--color-accent-gold); letter-spacing: 3px; line-height: 1.1; text-shadow: 0 0 28px rgba(201,168,76,0.25);">
      JARASANDHA
    </h1>

    <h2 style="font-size: clamp(1.1rem, 2.5vw, 1.45rem); margin-bottom: var(--spacing-20); color: var(--color-text-primary); font-weight: 400; line-height: 1.4;">
      Identify decisive vulnerabilities. Allocate finite protection strategically.
    </h2>

    <p style="font-size: 1.05rem; color: var(--color-text-secondary); max-width: 640px; margin: 0 auto var(--spacing-32); line-height: 1.6;">
      An explainable research prototype combining grid failure-risk forecasting, structural topology consequence analysis, and budget-constrained intervention planning.
    </p>

    <!-- Prominent Honest Scientific Notice -->
    <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--color-border); border-radius: var(--radius-btn); padding: 12px 20px; margin-bottom: var(--spacing-32); text-align: left; display: flex; align-items: center; gap: 12px; font-size: 0.86rem; color: var(--color-text-secondary);">
      <span style="color:var(--color-accent-gold); font-size:1.2rem;">ⓘ</span>
      <span>
        <strong>Academic Demonstration:</strong> Built on a synthetic IEEE 14-bus test system. Demonstrates decision-support logic—not connected to live utility feeds or electrical AC power flow.
      </span>
    </div>

    <!-- Primary Actions -->
    <div style="display:flex; gap:var(--spacing-16); justify-content:center; flex-wrap:wrap; margin-bottom: var(--spacing-48);">
      <a href="#overview" class="btn btn-primary" style="padding: 12px 28px; font-size: 1rem; letter-spacing: 0.5px;">
        Explore Demo →
      </a>
      <a href="#howitworks" class="btn btn-secondary" style="padding: 12px 24px; font-size: 1rem;">
        How It Works
      </a>
    </div>

    <!-- Strategic Principle Quote -->
    <div style="max-width: 720px; margin: 0 auto; color: var(--color-text-muted); font-size: 0.88rem; font-style: italic; border-top: 1px solid var(--color-border); padding-top: var(--spacing-20); line-height: 1.5;">
      "Inspired by the epic principle of identifying the decisive structural vulnerability and concentrating finite resilience where it delivers the highest system-wide preservation."
    </div>
  `;

  div.appendChild(content);
  return div;
}
