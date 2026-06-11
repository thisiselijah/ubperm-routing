import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';
import { useSlidePageNumber } from '@open-slide/core';
import { useEffect, useRef } from 'react';

import chartFull from './assets/chart-full.png';
import chartAllAlgos from './assets/chart-all-algos.png';
import barChart from './assets/bar-chart.png';
import image from './assets/image.png';
import bg from './assets/bg.png';
import qrcodeImg from './assets/qrcode.png';
import distributionChart from './assets/distribution.png';



export const design: DesignSystem = {
  palette: { bg: '#ffffff', text: '#111111', accent: '#444444' },
  fonts: {
    display: 'Georgia, "Times New Roman", serif',
    body: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  typeScale: { hero: 160, body: 36 },
  radius: 4,
};

// ─── Extra constants outside the DesignSystem shape ───────────────────────────
const muted = '#737373';
const accentLight = '#f5f5f5';
const accentDark = '#262626';
const dividerColor = '#e5e5e5';
const codeBg = '#111111';

const fill: React.CSSProperties = {
  width: '100%',
  height: '100%',
  fontFamily: 'var(--osd-font-body)',
  background: `url(${bg}) center / cover no-repeat`,
  color: 'var(--osd-text)',
};

const PAD_H = 120; // horizontal padding
const PAD_V = 100; // vertical padding

// ─── Shared components ────────────────────────────────────────────────────────

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: 'var(--osd-font-body)',
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'var(--osd-accent)',
      marginBottom: 24,
    }}
  >
    {children}
  </div>
);

const Divider = () => (
  <div
    style={{
      width: 64,
      height: 3,
      background: 'var(--osd-accent)',
      borderRadius: 2,
      margin: '32px 0',
    }}
  />
);

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 44,
        left: PAD_H,
        right: PAD_H,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'var(--osd-font-body)',
        fontSize: 20,
        color: muted,
        letterSpacing: '0.06em',
      }}
    >
      <span style={{ fontWeight: 600, color: 'var(--osd-accent)' }}>ubperm-routing</span>
      <span>
        {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  );
};

// ─── KaTeX CDN loader (runs once per page mount) ─────────────────────────────
const KATEX_VERSION = '0.16.11';
const KATEX_CSS = `https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.css`;
const KATEX_JS  = `https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.js`;

declare global {
  interface Window {
    katex?: {
      renderToString(tex: string, opts?: { displayMode?: boolean; throwOnError?: boolean }): string;
    };
  }
}

function ensureKatex(): Promise<void> {
  if (window.katex) return Promise.resolve();
  // CSS
  if (!document.querySelector(`link[href="${KATEX_CSS}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = KATEX_CSS;
    document.head.appendChild(link);
  }
  // JS
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${KATEX_JS}"]`)) {
      // script already injected but not yet loaded — poll
      const id = setInterval(() => {
        if (window.katex) { clearInterval(id); resolve(); }
      }, 30);
      return;
    }
    const script = document.createElement('script');
    script.src = KATEX_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ─── Math formula component (KaTeX, display mode) ────────────────────────────
const Katex = ({ tex, display = true, noBackground = false }: { tex: string; display?: boolean; noBackground?: boolean }) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let cancelled = false;
    ensureKatex().then(() => {
      if (cancelled || !ref.current || !window.katex) return;
      ref.current.innerHTML = window.katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
      });
    });
    return () => { cancelled = true; };
  }, [tex, display]);

  return (
    <span
      ref={ref}
      style={{
        display: display ? 'block' : 'inline-block',
        background: 'transparent',
        padding: display ? '18px 36px' : '4px 16px',
        borderRadius: 6,
        margin: display ? '12px 0' : '0 4px',
        fontSize: 32,
        lineHeight: 1.6,
        // placeholder text shown before KaTeX loads
        fontFamily: '"Courier New", monospace',
        color: '#94a3b8',
      }}
    >
      {tex}
    </span>
  );
};

// ─── Bullet item ──────────────────────────────────────────────────────────────
const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li
    style={{
      fontSize: 34,
      lineHeight: 1.55,
      marginBottom: 20,
      color: 'var(--osd-text)',
      fontFamily: 'var(--osd-font-body)',
    }}
  >
    {children}
  </li>
);

// ─── Accent highlight span ────────────────────────────────────────────────────
const Accent = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: 'var(--osd-accent)', fontWeight: 700 }}>{children}</span>
);

// ─── Algorithm badge pill ─────────────────────────────────────────────────────
const Badge = ({
  label,
  color,
  textColor = '#fff',
}: {
  label: string;
  color: string;
  textColor?: string;
}) => (
  <span
    style={{
      display: 'inline-block',
      background: color,
      color: textColor,
      fontFamily: 'var(--osd-font-body)',
      fontSize: 22,
      fontWeight: 700,
      padding: '6px 20px',
      borderRadius: 20,
      letterSpacing: '0.06em',
    }}
  >
    {label}
  </span>
);

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) => (
  <div
    style={{
      flex: 1,
      background: '#fff',
      border: `1.5px solid ${dividerColor}`,
      borderTop: `4px solid ${accent}`,
      borderRadius: 8,
      padding: '36px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}
  >
    <div style={{ fontSize: 20, fontWeight: 700, color: muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      {label}
    </div>
    <div style={{ fontSize: 64, fontWeight: 900, color: accent, lineHeight: 1.1, fontFamily: 'var(--osd-font-display)' }}>
      {value}
    </div>
    <div style={{ fontSize: 24, color: muted }}>{sub}</div>
  </div>
);

// ─── Page 01: Cover ───────────────────────────────────────────────────────────
const Cover: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `${PAD_V}px ${PAD_H}px`,
      overflow: 'hidden',
    }}
  >
    {/* Background geometric accent — hypercube wireframe suggestion */}
    <div
      style={{
        position: 'absolute',
        right: 80,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 560,
        height: 560,
        opacity: 0.06,
        border: `2px solid ${accentDark}`,
        borderRadius: 4,
      }}
    />
    <div
      style={{
        position: 'absolute',
        right: 160,
        top: '50%',
        transform: 'translateY(-50%) rotate(15deg)',
        width: 380,
        height: 380,
        opacity: 0.07,
        border: `2px solid ${accentDark}`,
        borderRadius: 4,
      }}
    />
    {/* Thin top border stripe */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />

    <Eyebrow>Final Project Presentation · Advanced Algorithms</Eyebrow>
    <h1
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 108,
        fontWeight: 900,
        lineHeight: 1.05,
        color: 'var(--osd-text)',
        margin: 0,
        maxWidth: 1300,
        letterSpacing: '-0.02em',
      }}
    >
      Unbuffered Permutation{' '}
      <span style={{ color: 'var(--osd-accent)' }}>Routing</span>
      <br />
      on Hypercubes
    </h1>
    <div style={{ height: 40 }} />
    <p
      style={{
        fontSize: 36,
        color: muted,
        maxWidth: 960,
        lineHeight: 1.55,
        margin: 0,
        fontFamily: 'var(--osd-font-body)',
      }}
    >
      Algorithms, Theory, and Experimental Evaluation
      <br />
      of A*, Entropy-Cycle, and Stochastic Search
    </p>

    <div style={{ height: 40 }} />
    <div style={{ fontSize: 24, color: muted, fontWeight: 500, lineHeight: 1.6 }}>
      <strong>Team Members:</strong>{' 許朝琳、吳柏仁、張晉嘉、黃冠傑、詹皓元'}
    </div>

    <div
      style={{
        position: 'absolute',
        bottom: PAD_V,
        left: PAD_H,
        right: PAD_H,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}
    >
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Badge label="C++" color="var(--osd-text)" />
        <Badge label="Three.js" color="var(--osd-text)" />
        <Badge label="Gemini 3.1 Pro" color="var(--osd-text)" />
        <Badge label="Antigravity" color="var(--osd-text)" />
      </div>
      <span style={{ fontSize: 20, color: muted, letterSpacing: '0.08em' }}>
        ubperm-routing
      </span>
    </div>
  </div>
);

// ─── Page 02: Agenda ──────────────────────────────────────────────────────────
const Agenda: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      padding: `${PAD_V}px ${PAD_H}px`,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <div style={{ flex: 1 }}>
      <Eyebrow>Contents</Eyebrow>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 72,
          fontWeight: 800,
          margin: '0 0 48px 0',
          lineHeight: 1.1,
        }}
      >
        What We'll Cover
      </h2>

      {/* Agenda items as numbered rows */}
      {[
        { n: '01', title: 'Problem Definition', desc: 'Hypercube topology and the permutation routing challenge' },
        { n: '02', title: 'The Algorithms', desc: 'A* Search · Entropy-Cycle · Beam Search · Stochastic · Bitonic Merge' },
        { n: '03', title: 'Theoretical Foundations', desc: 'Heuristics, group theory, and information theory' },
        { n: '04', title: 'Experiment Results', desc: 'Performance and step-count distributions for N=16' },
        { n: '05', title: 'Summary', desc: 'Trade-offs, scalability, and future directions' },
        { n: '06', title: 'Visualization', desc: 'Interactive web-based hypercube routing demo' },
      ].map(({ n, title, desc }) => (
        <div
          key={n}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 36,
            padding: '20px 0',
            borderBottom: `1px solid ${dividerColor}`,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 28,
              fontWeight: 900,
              color: 'var(--osd-accent)',
              minWidth: 48,
            }}
          >
            {n}
          </span>
          <div>
            <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--osd-text)', lineHeight: 1.2 }}>{title}</div>
            <div style={{ fontSize: 24, color: muted, marginTop: 4 }}>{desc}</div>
          </div>
        </div>
      ))}
    </div>
    <Footer />
  </div>
);

// ─── Page 03: Problem Definition ──────────────────────────────────────────────
const ProblemDef: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `${PAD_V}px ${PAD_H}px`,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <Eyebrow>Problem Definition</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 800,
        margin: '0 0 8px 0',
        lineHeight: 1.1,
      }}
    >
      Hypercube Permutation Routing
    </h2>
    <Divider />
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <Bullet>
        An <Accent>n-dimensional hypercube</Accent> has N = 2ⁿ nodes; two nodes share an edge iff their addresses differ in exactly one bit.
      </Bullet>
      <Bullet>
        Each node holds one packet addressed to a <Accent>unique destination</Accent> — the initial state is an arbitrary permutation of N packets.
      </Bullet>
      <Bullet>
        At each step, adjacent nodes may <Accent>swap their packets</Accent> along a shared edge (deflection routing — no buffers, no queuing).
      </Bullet>
      <Bullet>
        <Accent>Goal:</Accent> reach the identity permutation (packet i is at node i) in the fewest total swaps.
      </Bullet>
    </ul>
    <Footer />
  </div>
);

// ─── Page 04: Hypercube Topology ──────────────────────────────────────────────
const HypercubeTopology: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      padding: `${PAD_V}px ${PAD_H}px`,
      gap: 80,
      alignItems: 'center',
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />

    {/* Left column — text */}
    <div style={{ flex: 1 }}>
      <Eyebrow>Topology</Eyebrow>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 68,
          fontWeight: 800,
          margin: '0 0 8px 0',
          lineHeight: 1.1,
        }}
      >
        The n-Cube Network
      </h2>
      <Divider />
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        <Bullet>
          <Accent>n=3 (3-cube):</Accent> 8 nodes, 12 edges. Used for exhaustive experiment (8! = 40,320 permutations).
        </Bullet>
        <Bullet>
          <Accent>n=4 (4-cube):</Accent> 16 nodes, 32 edges. Partial sampling used.
        </Bullet>
        <Bullet>
          Swap along edge (u, v) moves <Accent>both packets simultaneously</Accent> — one step regardless of direction.
        </Bullet>
        <Bullet>
          State space grows as <Accent>N!</Accent> — intractable for BFS beyond N=8.
        </Bullet>
      </ul>
    </div>

    {/* Right column — SVG 3-cube diagram */}
    <div
      style={{
        width: 480,
        height: 480,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="440" height="440" viewBox="0 0 440 440" fill="none">
        {/* Edges — back face */}
        <line x1="80" y1="80" x2="200" y2="80" stroke="black" strokeWidth="2.5" />
        <line x1="80" y1="80" x2="80" y2="200" stroke="black" strokeWidth="2.5" />
        <line x1="200" y1="80" x2="200" y2="200" stroke="black" strokeWidth="2.5" />
        <line x1="80" y1="200" x2="200" y2="200" stroke="black" strokeWidth="2.5" />
        {/* Diagonal connecting edges */}
        <line x1="80" y1="80" x2="200" y2="220" stroke="black" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
        <line x1="200" y1="80" x2="360" y2="220" stroke="black" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
        <line x1="80" y1="200" x2="200" y2="360" stroke="black" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
        <line x1="200" y1="200" x2="360" y2="360" stroke="black" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
        {/* Edges — front face */}
        <line x1="200" y1="220" x2="360" y2="220" stroke="black" strokeWidth="3" />
        <line x1="200" y1="220" x2="200" y2="360" stroke="black" strokeWidth="3" />
        <line x1="360" y1="220" x2="360" y2="360" stroke="black" strokeWidth="3" />
        <line x1="200" y1="360" x2="360" y2="360" stroke="black" strokeWidth="3" />
        {/* Back nodes */}
        <circle cx="80" cy="80" r="14" fill="#f5f4f0" stroke={muted} strokeWidth="2.5" />
        <circle cx="200" cy="80" r="14" fill="#f5f4f0" stroke={muted} strokeWidth="2.5" />
        <circle cx="80" cy="200" r="14" fill="#f5f4f0" stroke={muted} strokeWidth="2.5" />
        <circle cx="200" cy="200" r="14" fill="#f5f4f0" stroke={muted} strokeWidth="2.5" />
        {/* Front nodes */}
        <circle cx="200" cy="220" r="16" fill="black" />
        <circle cx="360" cy="220" r="16" fill="black" />
        <circle cx="200" cy="360" r="16" fill="black" />
        <circle cx="360" cy="360" r="16" fill="black" />
        {/* Labels */}
        <text x="200" y="225" textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="#fff" fontWeight="bold">000</text>
        <text x="360" y="225" textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="#fff" fontWeight="bold">001</text>
        <text x="200" y="365" textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="#fff" fontWeight="bold">010</text>
        <text x="360" y="365" textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="#fff" fontWeight="bold">011</text>
        <text x="80" y="84" textAnchor="middle" dominantBaseline="middle" fontSize="12" fill={muted}>100</text>
        <text x="200" y="84" textAnchor="middle" dominantBaseline="middle" fontSize="12" fill={muted}>101</text>
        <text x="80" y="204" textAnchor="middle" dominantBaseline="middle" fontSize="12" fill={muted}>110</text>
        <text x="200" y="204" textAnchor="middle" dominantBaseline="middle" fontSize="12" fill={muted}>111</text>
      </svg>
    </div>
    <Footer />
  </div>
);

// ─── Page 05: Section Divider — The Algorithms ────────────────────────────────
const AlgosDivider: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: `${PAD_V}px ${PAD_H}px`,
      background: codeBg,
      color: '#f1f5f9',
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <div
      style={{
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: '#a3a3a3',
        marginBottom: 32,
        fontFamily: 'var(--osd-font-body)',
      }}
    >
      Part 01
    </div>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 120,
        fontWeight: 900,
        color: '#f1f5f9',
        margin: 0,
        lineHeight: 1.0,
        letterSpacing: '-0.02em',
      }}
    >
      The{' '}
      <span style={{ color: '#ffffff' }}>Algorithms</span>
    </h2>
    <div style={{ height: 48 }} />
    <p
      style={{
        fontSize: 34,
        color: '#94a3b8',
        maxWidth: 900,
        lineHeight: 1.5,
        margin: 0,
        fontFamily: 'var(--osd-font-body)',
      }}
    >
      Three distinct search strategies — from informed heuristics to algebraic theory to probabilistic sampling.
    </p>
    <div
      style={{
        position: 'absolute',
        bottom: PAD_V,
        left: PAD_H,
        fontSize: 20,
        color: '#475569',
        letterSpacing: '0.06em',
        fontFamily: 'var(--osd-font-body)',
      }}
    >
      ubperm-routing
    </div>
  </div>
);

// ─── Page 06: A* Search Overview ─────────────────────────────────────────────
const AStarOverview: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `${PAD_V}px ${PAD_H}px`,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <Eyebrow>Algorithm 01 · A* Search</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 800,
        margin: '0 0 8px 0',
        lineHeight: 1.1,
      }}
    >
      Informed Search with Hamming Heuristic
    </h2>
    <Divider />
    <div style={{ marginBottom: 28 }}>
      <Katex tex={String.raw`f(n) = g(n) + h(n)`} noBackground />
    </div>
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <Bullet>
        <Accent>g(n):</Accent> actual swap cost from initial state to current state n.
      </Bullet>
      <Bullet>
        <Accent>h(n) = Hamming heuristic:</Accent> for each packet, count bits still wrong via{' '}
        <code style={{ background: accentLight, padding: '2px 8px', borderRadius: 4, fontSize: 30, color: accentDark }}>
          popcount(current XOR target)
        </code>
        ; divide sum by 2 (each swap corrects 2 packets).
      </Bullet>
      <Bullet>
        Heuristic is <Accent>admissible</Accent> — never overestimates, guaranteeing optimal path length.
      </Bullet>
      <Bullet>
        Expands exponentially fewer states than BFS; priority queue over f(n) prunes unpromising branches.
      </Bullet>
    </ul>
    <Footer />
  </div>
);

// ─── Page 07: A* Complexity & BFS Comparison ─────────────────────────────────
const AStarVsBFS: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      padding: `${PAD_V}px ${PAD_H}px`,
      gap: 80,
      alignItems: 'stretch',
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />

    {/* Left: BFS */}
    <div style={{ flex: 1, borderRight: `1px solid ${dividerColor}`, paddingRight: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--osd-text)', marginBottom: 20 }}>
        BFS (Baseline)
      </div>
      <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--osd-text)', fontFamily: 'var(--osd-font-display)', marginBottom: 24 }}><Katex tex={String.raw`\mathcal{O}(b^D) \approx \mathcal{O}(N!)`} display={false} /></div>
      <ul style={{ listStyle: 'disc', margin: 0, padding: '0 0 0 36px' }}>
        <li style={{ fontSize: 30, lineHeight: 1.6, marginBottom: 16, color: 'var(--osd-text)' }}>Explores uniformly in all directions</li>
        <li style={{ fontSize: 30, lineHeight: 1.6, marginBottom: 16, color: 'var(--osd-text)' }}>Guarantees absolute optimal path</li>
        <li style={{ fontSize: 30, lineHeight: 1.6, marginBottom: 16, color: 'var(--osd-text)' }}>Infeasible beyond N=8 — state space explodes</li>
        <li style={{ fontSize: 30, lineHeight: 1.6, color: 'var(--osd-text)' }}>Memory: <Katex tex={String.raw`\mathcal{O}(N!)`} display={false} /> — stores all visited states</li>
      </ul>
    </div>

    {/* Right: A* */}
    <div style={{ flex: 1, paddingLeft: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--osd-text)', marginBottom: 20 }}>
        A* Search
      </div>
      <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--osd-text)', fontFamily: 'var(--osd-font-display)', marginBottom: 24 }}>
        <Katex tex={String.raw`\mathcal{O}(b^D)`} display={false} /> worst-case
      </div>
      <ul style={{ listStyle: 'disc', margin: 0, padding: '0 0 0 36px' }}>
        <li style={{ fontSize: 30, lineHeight: 1.6, marginBottom: 16, color: 'var(--osd-text)' }}>Guided by f(n) = g(n) + h(n) priority queue</li>
        <li style={{ fontSize: 30, lineHeight: 1.6, marginBottom: 16, color: 'var(--osd-text)' }}>Prunes millions of unpromising branches</li>
        <li style={{ fontSize: 30, lineHeight: 1.6, marginBottom: 16, color: 'var(--osd-text)' }}>Matches BFS optimal paths in practice (N=8)</li>
        <li style={{ fontSize: 30, lineHeight: 1.6, color: 'var(--osd-text)' }}>Memory: <Katex tex={String.raw`\mathcal{O}(b^D)`} display={false} /> — still grows large for <Katex tex={String.raw`N > 8`} display={false} /></li>
      </ul>
    </div>
    <Footer />
  </div>
);

// ─── Page 08: Entropy-Cycle — Group Theory ────────────────────────────────────
const EntropyCycleGroupTheory: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `${PAD_V}px ${PAD_H}px`,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <Eyebrow>Algorithm 02 · Entropy-Cycle Search — Part A</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 68,
        fontWeight: 800,
        margin: '0 0 8px 0',
        lineHeight: 1.1,
      }}
    >
      Group Theory: Cycle Decomposition
    </h2>
    <Divider />
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <Bullet>
        The routing state is viewed as a <Accent>mathematical permutation</Accent>; any permutation decomposes uniquely into disjoint cycles.
      </Bullet>
      <Bullet>
        Swapping packets <Accent>within the same cycle</Accent> fractures it into two smaller cycles (progress).
        Swapping <Accent>across cycles</Accent> merges them (regression).
      </Bullet>
      <Bullet>
        Minimum transpositions to fully sort from C cycles:{' '}
        <Katex tex={String.raw`\text{min\_swaps} = N - C`} display={false} />
      </Bullet>
      <Bullet>
        Algorithm greedily prefers swaps that <Accent>increase C</Accent> — maximally fracturing large cycles.
      </Bullet>
    </ul>
    <Footer />
  </div>
);

// ─── Page 09: Entropy-Cycle — Information Theory ──────────────────────────────
const EntropyCycleInfoTheory: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `${PAD_V}px ${PAD_H}px`,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <Eyebrow>Algorithm 02 · Entropy-Cycle Search — Part B</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 68,
        fontWeight: 800,
        margin: '0 0 8px 0',
        lineHeight: 1.1,
      }}
    >
      Information Theory: Shannon Entropy Tie-Breaking
    </h2>
    <Divider />
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <Bullet>
        When multiple swaps tie on cycle-count gain, a <Accent>Shannon entropy penalty</Accent> breaks ties.
      </Bullet>
      <Bullet>
        Entropy is computed over the <Accent>displacement error distribution</Accent> across bit dimensions — high entropy = chaotic scattering.
      </Bullet>
      <Bullet>
        Combined heuristic:{' '}
        <Katex tex={String.raw`h = (N - C) + 0.1 \times H`} display={false} />
        {' '}where H is the dimensional entropy of residual errors.
      </Bullet>
      <Bullet>
        <Accent>Synergy:</Accent> cycle decomposition unknots permutations algebraically; entropy organises the network dimension-by-dimension.
      </Bullet>
    </ul>
    <Footer />
  </div>
);

// ─── Page 10: Stochastic Search ───────────────────────────────────────────────
const StochasticSearch: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `${PAD_V}px ${PAD_H}px`,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <Eyebrow>Algorithm 03 · Stochastic Search</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 800,
        margin: '0 0 8px 0',
        lineHeight: 1.1,
      }}
    >
      Algebraic + Probabilistic Sampling
    </h2>
    <Divider />
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <Bullet>
        Combines the <Accent>Entropy-Cycle heuristic</Accent> with{' '}
        <Accent>Softmax (Gibbs/Simulated Annealing)</Accent> probabilistic selection over candidate swaps.
      </Bullet>
      <Bullet>
        <Accent>Memory footprint: <Katex tex={String.raw`\mathcal{O}(1)`} display={false} /></Accent> — no priority queue, no closed-set; walks a single path with probabilistic restarts.
      </Bullet>
      <Bullet>
        Scales to <Accent><Katex tex={String.raw`N=64, N=256`} display={false} /></Accent> and beyond — elegantly sidesteps the curse of dimensionality.
      </Bullet>
      <Bullet>
        Trade-off: slight long-tail deviation in path length compared to exact search; excellent for massive networks where optimal search is infeasible.
      </Bullet>
    </ul>
    <Footer />
  </div>
);

// ─── Page 10.5: Beam Search ──────────────────────────────────────────────────
const BeamSearch: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `${PAD_V}px ${PAD_H}px`,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <Eyebrow>Algorithm 04 · Beam Search</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 800,
        margin: '0 0 8px 0',
        lineHeight: 1.1,
      }}
    >
      Heuristic Path Pruning
    </h2>
    <Divider />
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <Bullet>
        <Accent>Beam Width (k):</Accent> keeps only the top k most promising states at each depth.
      </Bullet>
      <Bullet>
        Uses the <Accent>Hamming heuristic</Accent> to evaluate state promise without expanding the full frontier.
      </Bullet>
      <Bullet>
        Trades <Accent>optimality</Accent> for <Accent>memory efficiency</Accent> — no guarantees of shortest path, but finds a valid routing fast.
      </Bullet>
      <Bullet>
        Avoids the exponential memory blowup of A* while outperforming pure greedy descent.
      </Bullet>
    </ul>
    <Footer />
  </div>
);

// ─── Page 11: Algorithm Summary Table ────────────────────────────────────────
const AlgoSummaryTable: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `${PAD_V}px ${PAD_H}px`,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <Eyebrow>Algorithms · Side by Side</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 68,
        fontWeight: 800,
        margin: '0 0 36px 0',
        lineHeight: 1.1,
      }}
    >
      Complexity & Scalability
    </h2>

    {/* Table */}
    <div style={{ width: '100%', border: `1.5px solid ${dividerColor}`, borderRadius: 8, overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr 0.9fr 1.2fr',
          background: codeBg,
          color: '#f1f5f9',
          padding: '18px 28px',
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          gap: 16,
        }}
      >
        <div>Algorithm</div>
        <div>Time Complexity</div>
        <div>Memory</div>
        <div>Optimal Path?</div>
      </div>
      {/* Rows */}
      {[
        { name: 'A* Search', time: <><Katex tex={String.raw`\mathcal{O}(b^D)`} display={false} /> — heuristic pruned</>, mem: <Katex tex={String.raw`\mathcal{O}(b^D)`} display={false} />, opt: '✓ Guaranteed', color: 'var(--osd-text)', isO1: false },
        { name: 'Entropy-Cycle', time: <><Katex tex={String.raw`\mathcal{O}(b^D)`} display={false} /> — aggressively pruned</>, mem: <Katex tex={String.raw`\mathcal{O}(b^D)`} display={false} />, opt: '≈ Near-optimal', color: 'var(--osd-text)', isO1: false },
        { name: 'Beam Search', time: <><Katex tex={String.raw`\mathcal{O}(k \cdot b)`} display={false} /> — bounded by width</>, mem: <Katex tex={String.raw`\mathcal{O}(k \cdot D)`} display={false} />, opt: 'Fast, not optimal', color: 'var(--osd-text)', isO1: false },
        { name: 'Stochastic', time: 'Near-polynomial empirically', mem: <Katex tex={String.raw`\mathcal{O}(1)`} display={false} />, opt: '~ Close, not exact', color: 'var(--osd-text)', isO1: true },
      ].map((row, i) => (
        <div
          key={row.name}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.4fr 0.9fr 1.2fr',
            padding: '20px 28px',
            gap: 16,
            background: i % 2 === 0 ? '#fff' : '#f8fafc',
            borderTop: `1px solid ${dividerColor}`,
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: row.color }}>{row.name}</div>
          <div style={{ fontSize: 26, color: 'var(--osd-text)' }}>{row.time}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: row.isO1 ? 'var(--osd-text)' : muted }}>{row.mem}</div>
          <div style={{ fontSize: 26, color: 'var(--osd-text)' }}>{row.opt}</div>
        </div>
      ))}
    </div>
    <Footer />
  </div>
);

// ─── Page 12: Section Divider — Results ──────────────────────────────────────
const ResultsDivider: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: `${PAD_V}px ${PAD_H}px`,
      background: codeBg,
      color: '#f1f5f9',
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <div
      style={{
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: '#a3a3a3',
        marginBottom: 32,
        fontFamily: 'var(--osd-font-body)',
      }}
    >
      Part 02
    </div>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 120,
        fontWeight: 900,
        color: '#f1f5f9',
        margin: 0,
        lineHeight: 1.0,
        letterSpacing: '-0.02em',
      }}
    >
      Experiment{' '}
      <span style={{ color: '#ffffff' }}>Results</span>
    </h2>
    <div style={{ height: 48 }} />
    <p
      style={{
        fontSize: 34,
        color: '#94a3b8',
        maxWidth: 900,
        lineHeight: 1.5,
        margin: 0,
        fontFamily: 'var(--osd-font-body)',
      }}
    >Exhaustive evaluation on all 40,320 permutations of the 3-cube and selected cases for 4-cube, and higher dimension.</p>
    <div
      style={{
        position: 'absolute',
        bottom: PAD_V,
        left: PAD_H,
        fontSize: 20,
        color: '#475569',
        letterSpacing: '0.06em',
        fontFamily: 'var(--osd-font-body)',
      }}
    >
      ubperm-routing
    </div>
  </div>
);

// ─── Page 13: Experimental Setup ─────────────────────────────────────────────
const ExperimentSetup: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `${PAD_V}px ${PAD_H}px`,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <Eyebrow>Experimental Setup</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 800,
        margin: '0 0 8px 0',
        lineHeight: 1.1,
      }}
    >
      Evaluation Protocol
    </h2>
    <Divider />
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <Bullet>
        <Accent>Network:</Accent> 3-cube (n=3), N=8 nodes, 12 edges.
      </Bullet>
      <Bullet>
        <Accent>Coverage:</Accent> All 8! = 40,320 distinct initial permutations evaluated exhaustively via the{' '}
        <code style={{ background: accentLight, padding: '2px 8px', borderRadius: 4, fontSize: 30, color: accentDark }}>test.py</code>{' '}
        batch script with multithreading.
      </Bullet>
      <Bullet>
        <Accent>Metric:</Accent> number of edge-swap steps (lower = better path quality).
      </Bullet>
      <Bullet>
        <Accent>Algorithms compared:</Accent> A* Search, Entropy-Cycle Search, Stochastic Search, and Beam Search.
        BFS serves as the optimal baseline; Bitonic Merge Sort as the deterministic non-search baseline.
      </Bullet>
    </ul>
    <Footer />
  </div>
);

// ─── Page 14: Step Distribution Chart ────────────────────────────────────────
const ResultsChart: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      padding: `${PAD_V}px ${PAD_H}px`,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <Eyebrow>Results · Step Distributions</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 60,
        fontWeight: 800,
        margin: '0 0 24px 0',
        lineHeight: 1.1,
      }}
    >
      Hypercube Permutation Routing — All Algorithms (N=8)
    </h2>
    <div
      style={{
        height: 660,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={barChart}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          borderRadius: 8,
          border: `1px solid ${dividerColor}`,
          background: '#fff',
        }}
        alt="Step distribution histograms and comparison curves for all algorithms on 3-cube"
      />
    </div>
    <Footer />
  </div>
);

// ─── Page 15: Full Algorithm Comparison Chart ─────────────────────────────────
const ResultsChartAll: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      padding: `${PAD_V}px ${PAD_H}px`,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <Eyebrow>Results · Extended Comparison</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 52,
        fontWeight: 800,
        margin: '0 0 16px 0',
        lineHeight: 1.1,
      }}
    >All Algorithms Swap Steps (N=8)</h2>

    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <img
        src={barChart}
        style={{
          width: '100%',
          height: '100%',
          maxHeight: 700,
          objectFit: 'contain',
        }}
        alt="Bar chart showing swap steps for all algorithms"
      />
    </div>

    <Footer />
  </div>
);

// ─── Page 16: Step Distribution ──────────────────────────────────────────────────
const DistributionChart: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      padding: `${PAD_V}px ${PAD_H}px`,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <Eyebrow>Results · Step Distribution</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 52,
        fontWeight: 800,
        margin: '0 0 16px 0',
        lineHeight: 1.1,
      }}
    >Step-Count Distributions</h2>

    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <img
        src={distributionChart}
        style={{
          width: '100%',
          height: '100%',
          maxHeight: 700,
          objectFit: 'contain',
        }}
        alt="Distribution chart showing swap steps for algorithms"
      />
    </div>

    <Footer />
  </div>
);

// ─── Page 17: Key Stats ────────────────────────────────────────────────────────
const KeyStats: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `${PAD_V}px ${PAD_H}px`,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <Eyebrow>Results · Key Statistics · N=16</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 68,
        fontWeight: 800,
        margin: '0 0 40px 0',
        lineHeight: 1.1,
      }}
    >
      Algorithm Performance at a Glance
    </h2>

    <div style={{ display: 'flex', gap: 20, marginBottom: 32 }}>
      <StatCard label="Bitonic Merge" value="37.5" sub="mean steps" accent="var(--osd-text)" />
      <StatCard label="Stochastic" value="23.6" sub="mean steps" accent="var(--osd-text)" />
      <StatCard label="Entropy-Cycle" value="15.5" sub="mean steps" accent="var(--osd-text)" />
      <StatCard label="A* (optimal)" value="15.0" sub="mean steps" accent="var(--osd-text)" />
      <StatCard label="Beam Search" value="14.5" sub="mean steps" accent="var(--osd-text)" />
    </div>

    <div
      style={{
        background: accentLight,
        border: `1.5px solid ${dividerColor}`,
        borderRadius: 8,
        padding: '20px 28px',
        fontSize: 30,
        color: accentDark,
        lineHeight: 1.5,
      }}
    >
      <strong>Key insight:</strong> A* and Entropy-Cycle both achieve near-BFS-optimal step counts.
      Stochastic trades slight path overhead for <Katex tex={String.raw`\mathcal{O}(1)`} display={false} /> memory and massive scalability.
    </div>
    <Footer />
  </div>
);

// ─── Page 17: Closing ─────────────────────────────────────────────────────────
const Closing: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `${PAD_V}px ${PAD_H}px`,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <Eyebrow>Summary & Future Work</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 800,
        margin: '0 0 8px 0',
        lineHeight: 1.1,
      }}
    >
      Takeaways
    </h2>
    <Divider />
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <Bullet>
        <Accent>A* Search</Accent> delivers provably optimal routing on N≤8 with dramatic speedup over BFS.
      </Bullet>
      <Bullet>
        <Accent>Entropy-Cycle Search</Accent> marries group theory and information theory for near-optimal, near-polynomial empirical runtime.
      </Bullet>
      <Bullet>
        <Accent>Stochastic Search</Accent> breaks the memory barrier — <Katex tex={String.raw`\mathcal{O}(1)`} display={false} /> footprint enables <Katex tex={String.raw`N=256`} display={false} /> and beyond.
      </Bullet>
      <Bullet>
        <Accent>Future work:</Accent> adaptive temperature schedules for stochastic; multi-step lookahead for entropy-cycle; GPU-parallelised beam search.
      </Bullet>
    </ul>

    <Footer />
  </div>
);

// ─── Page 18: Higher Dimensions ───────────────────────────────────────────────
const HigherDimSituation: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `${PAD_V}px ${PAD_H}px`,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <Eyebrow>Future Directions · Higher Dimensions</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 800,
        margin: '0 0 8px 0',
        lineHeight: 1.1,
      }}
    >
      The Curse of Dimensionality
    </h2>
    <Divider />
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <Bullet>
        For <Accent><Katex tex={String.raw`N \ge 64`} display={false} /></Accent> hypercubes, the state space reaches astronomically large numbers — making exact BFS or A* Search entirely intractable.
      </Bullet>
      <Bullet>
        <Accent>Memory bounds</Accent> are the primary bottleneck, as optimal path algorithms like A* queue up exponentially growing frontiers.
      </Bullet>
    </ul>

    {/* Survival Tractability Graph */}
    <div style={{ marginTop: 56, background: codeBg, borderRadius: 8, padding: '48px 48px 32px 48px', border: `1px solid ${muted}` }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 48 }}>
        Algorithm Tractability Horizon (Surviving = Executed in &lt; 1 min)
      </div>
      <div style={{ position: 'relative', width: '100%', height: 120 }}>
        {/* Horizontal Track */}
        <div style={{ position: 'absolute', top: 20, left: '10%', right: '10%', height: 8, background: '#333', borderRadius: 4, transform: 'translateY(-4px)' }} />
        
        {/* Markers */}
        <div style={{ position: 'absolute', top: 0, left: '10%', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateX(-50%)' }}>
          <div style={{ width: 24, height: 24, borderRadius: 12, background: '#fff', border: `4px solid ${codeBg}`, zIndex: 2, transform: 'translateY(8px)' }} />
          <div style={{ marginTop: 24, fontSize: 32, fontWeight: 800, color: '#fff' }}>N=4</div>
          <div style={{ fontSize: 20, color: '#a3a3a3', fontWeight: 600 }}>BFS, A*</div>
        </div>

        <div style={{ position: 'absolute', top: 0, left: '30%', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateX(-50%)' }}>
          <div style={{ width: 24, height: 24, borderRadius: 12, background: '#fff', border: `4px solid ${codeBg}`, zIndex: 2, transform: 'translateY(8px)' }} />
          <div style={{ marginTop: 24, fontSize: 32, fontWeight: 800, color: '#fff' }}>N=7</div>
          <div style={{ fontSize: 20, color: '#a3a3a3', fontWeight: 600 }}>Entropy-Cycle</div>
        </div>

        <div style={{ position: 'absolute', top: 0, left: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateX(-50%)' }}>
          <div style={{ width: 24, height: 24, borderRadius: 12, background: '#fff', border: `4px solid ${codeBg}`, zIndex: 2, transform: 'translateY(8px)' }} />
          <div style={{ marginTop: 24, fontSize: 32, fontWeight: 800, color: '#fff' }}>N=8</div>
          <div style={{ fontSize: 20, color: '#a3a3a3', fontWeight: 600 }}>Beam Search</div>
        </div>

        <div style={{ position: 'absolute', top: 0, left: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateX(-50%)' }}>
          <div style={{ width: 24, height: 24, borderRadius: 12, background: '#fff', border: `4px solid ${codeBg}`, zIndex: 2, transform: 'translateY(8px)' }} />
          <div style={{ marginTop: 24, fontSize: 32, fontWeight: 800, color: '#fff' }}>Luck</div>
          <div style={{ fontSize: 20, color: '#a3a3a3', fontWeight: 600 }}>Stochastic</div>
        </div>

        <div style={{ position: 'absolute', top: 0, left: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateX(-50%)' }}>
          <div style={{ width: 24, height: 24, borderRadius: 12, background: '#fff', border: `4px solid ${codeBg}`, zIndex: 2, transform: 'translateY(8px)' }} />
          <div style={{ marginTop: 24, fontSize: 32, fontWeight: 800, color: '#fff' }}>N &gt;&gt; 64</div>
          <div style={{ fontSize: 20, color: '#a3a3a3', fontWeight: 600 }}>Bitonic Merge</div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

// ─── Page 19: Visualization Demo ──────────────────────────────────────────────
const VisualizationDemo: Page = () => (
  <div
    style={{
      ...fill,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: `${PAD_V}px ${PAD_H}px`,
      textAlign: 'center',
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 800,
        margin: '0 0 24px 0',
        lineHeight: 1.1,
      }}
    >
      Live Visualization
    </h2>
    <p style={{ fontSize: 36, color: muted, marginBottom: 64, maxWidth: 800 }}>
      Scan the QR code below to visit the interactive website for visualizing hypercube permutation routing.
    </p>
    <div
      style={{
        background: '#fff',
        padding: 32,
        borderRadius: 24,
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        border: `1px solid ${dividerColor}`,
      }}
    >
      <img
        src={qrcodeImg}
        alt="QR Code for visualization website"
        style={{
          width: 400,
          height: 400,
          objectFit: 'contain',
        }}
      />
      <div style={{ marginTop: 24, fontSize: 24, fontFamily: 'var(--osd-font-body)', fontWeight: 600 }}>
        <a href="https://thisiselijah.github.io/ubperm-routing/" target="_blank" rel="noreferrer" style={{ color: 'var(--osd-accent)', textDecoration: 'none' }}>
          thisiselijah.github.io/ubperm-routing/
        </a>
      </div>
    </div>
    <Footer />
  </div>
);

// ─── Page 14.5: Key Stats N=8 ────────────────────────────────────────────────
const KeyStatsN8: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `${PAD_V}px ${PAD_H}px`,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--osd-accent)' }} />
    <Eyebrow>Results · Key Statistics · N=8</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 68,
        fontWeight: 800,
        margin: '0 0 40px 0',
        lineHeight: 1.1,
      }}
    >
      Average Steps on 3-Cube
    </h2>

    <div style={{ display: 'flex', gap: 20, marginBottom: 32 }}>
      <StatCard label="Merge" value="12.0" sub="mean steps" accent="var(--osd-text)" />
      <StatCard label="Stochastic" value="7.32" sub="mean steps" accent="var(--osd-text)" />
      <StatCard label="Entropy-Cycle" value="6.77" sub="mean steps" accent="var(--osd-text)" />
      <StatCard label="A*" value="6.62" sub="mean steps" accent="var(--osd-text)" />
      <StatCard label="Beam Search" value="6.61" sub="mean steps" accent="var(--osd-text)" />
      <StatCard label="BFS (optimal)" value="6.61" sub="mean steps" accent="var(--osd-text)" />
    </div>

    <div
      style={{
        background: accentLight,
        border: `1.5px solid ${dividerColor}`,
        borderRadius: 8,
        padding: '20px 28px',
        fontSize: 30,
        color: accentDark,
        lineHeight: 1.5,
      }}
    >
      <strong>Key insight:</strong> A*, Beam Search, and Entropy-Cycle produce path lengths virtually identical to the BFS optimal baseline for N=8.
    </div>
    <Footer />
  </div>
);

// ─── Exports ──────────────────────────────────────────────────────────────────
export const meta: SlideMeta = {
  title: 'Unbuffered Permutation Routing on Hypercubes',
  createdAt: '2026-06-11T07:19:14.494Z',
};

export default [
  Cover,
  Agenda,
  ProblemDef,
  HypercubeTopology,
  AlgosDivider,
  AStarOverview,
  AStarVsBFS,
  EntropyCycleGroupTheory,
  EntropyCycleInfoTheory,
  StochasticSearch,
  BeamSearch,
  AlgoSummaryTable,
  ResultsDivider,
  ExperimentSetup,
  KeyStatsN8,
  ResultsChartAll,
  DistributionChart,
  KeyStats,
  HigherDimSituation,
  Closing,
  VisualizationDemo,
] satisfies Page[];
