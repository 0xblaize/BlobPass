'use client';

import { useEffect, useRef, useState } from 'react';

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const STEPS = [
  {
    num: '01',
    label: 'Store the file',
    tag: 'WALRUS STORAGE',
    tagColor: '#00f0ff',
    title: 'Upload.',
    italic: 'Walrus keeps it.',
    body: 'Your file becomes a certified blob across 200+ storage nodes. 2-of-N erasure coded. No server. No AWS.',
    filename: 'walrus — bash',
    lines: [
      { delay: 0,    text: '$ walrus upload market-data-q2.csv',       color: '#ECEAE4' },
      { delay: 600,  text: '  ↑ uploading 45 MB → publisher node…',    color: '#888880' },
      { delay: 1200, text: '  ✓ blob certified  —  2-of-N redundancy', color: '#00f0ff' },
      { delay: 1800, text: '  blobId  bAEOPR7xk2Bt6mY8wQ5nS4hJ3iG…',  color: '#D4A853' },
      { delay: 2400, text: '  size    45 MB   epochs  5   nodes  200+',color: '#888880' },
      { delay: 3000, text: '  url     aggregator.walrus-testnet.wa…',  color: '#888880' },
    ],
  },
  {
    num: '02',
    label: 'List on Sui',
    tag: 'SUI KIOSK',
    tagColor: '#4F9FFF',
    title: 'Price it.',
    italic: 'Sui holds the lock.',
    body: 'A Kiosk object goes on-chain with your price in SUI. Buyers who pay receive a KioskOwnerCap — on-chain proof of access.',
    filename: 'sui — bash',
    lines: [
      { delay: 0,    text: '$ sui kiosk create \\',                      color: '#ECEAE4' },
      { delay: 0,    text: '    --blob bAEOPR7xk2Bt6mY8wQ5nS4hJ3…',    color: '#888880' },
      { delay: 0,    text: '    --price 15 SUI',                         color: '#888880' },
      { delay: 600,  text: '  ✓ KioskOwnerCap minted',                  color: '#00f0ff' },
      { delay: 1200, text: '  objectId   0x9f2e8d1c3a5b7e4f62a1b9…',   color: '#D4A853' },
      { delay: 1800, text: '  seller     0x4a21…9e3f',                  color: '#888880' },
      { delay: 2400, text: '  price      15 SUI',                        color: '#888880' },
      { delay: 3000, text: '  ✓ listing live  →  blobpass.vercel',      color: '#00f0ff' },
    ],
  },
  {
    num: '03',
    label: 'Buyer gets access',
    tag: 'TATUM RPC',
    tagColor: '#D4A853',
    title: 'Pay once.',
    italic: 'Tatum confirms it.',
    body: "Buyer pays. Tatum's Sui RPC verifies the KioskOwnerCap transfer. Access granted. File retrieved from Walrus. Done.",
    filename: 'tatum rpc — verify',
    lines: [
      { delay: 0,    text: '$ tatum sui getObject 0x9f2e8d1c3a5b…',    color: '#ECEAE4' },
      { delay: 600,  text: '  objectId   0x9f2e8d1c3a5b7e4f62a1b9…',   color: '#888880' },
      { delay: 1200, text: '  owner      0x4a21…9e3f  ← buyer wallet', color: '#D4A853' },
      { delay: 1800, text: '  ✓ ownership verified  —  access granted',color: '#00f0ff' },
      { delay: 2400, text: '$ walrus download bAEOPR7xk2Bt6mY8wQ5…',   color: '#ECEAE4' },
      { delay: 3000, text: '  ↓ fetching from aggregator…',             color: '#888880' },
      { delay: 3600, text: '  ✓ market-data-q2.csv  →  ./downloads/', color: '#00f0ff' },
    ],
  },
];

/* Inner animated content — only mounts when active, so state always starts at 0 */
function TerminalLines({ step }: { step: typeof STEPS[0] }) {
  const [shown, setShown] = useState(0);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    const timers = step.lines.map((l, i) =>
      setTimeout(() => setShown(i + 1), l.delay + 200)
    );
    const blink = setInterval(() => setCursor(c => !c), 530);
    return () => { timers.forEach(clearTimeout); clearInterval(blink); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = shown >= step.lines.length;

  return (
    <>
      {step.lines.slice(0, shown).map((l, i) => (
        <div
          key={i}
          style={{
            fontSize: 13,
            color: l.color,
            lineHeight: 1.85,
            animation: 'termFadeUp 0.22s cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          {l.text}
          {i === shown - 1 && !done && (
            <span style={{
              display: 'inline-block', width: 5, height: 11,
              background: '#ECEAE4', marginLeft: 3,
              opacity: cursor ? 1 : 0,
              verticalAlign: 'text-bottom',
            }} />
          )}
        </div>
      ))}
      {done && (
        <div style={{ fontSize: 13, color: '#ECEAE4', lineHeight: 1.85 }}>
          $ <span style={{
            display: 'inline-block', width: 5, height: 11,
            background: '#ECEAE4', marginLeft: 3,
            opacity: cursor ? 1 : 0,
            verticalAlign: 'text-bottom',
          }} />
        </div>
      )}
    </>
  );
}

function TerminalWindow({ step, active }: { step: typeof STEPS[0]; active: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        background: '#0a0c0e',
        border: `1px solid ${active ? step.tagColor + '40' : 'rgba(255,255,255,0.07)'}`,
        borderTop: `2px solid ${active ? step.tagColor : 'transparent'}`,
        borderRadius: 10,
        overflow: 'hidden',
        fontFamily: "'Space Mono', monospace",
        transition: 'border-color 0.3s',
      }}
    >
      {/* window chrome */}
      <div style={{
        padding: '9px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {['#C0392B', '#D4A853', '#2A9460'].map(c => (
            <div key={c} style={{
              width: 9, height: 9, borderRadius: '50%',
              background: c, opacity: active ? 0.9 : 0.35,
            }} />
          ))}
          <span style={{ fontSize: 10, color: '#666660', marginLeft: 6, letterSpacing: '0.06em' }}>
            {step.filename}
          </span>
        </div>
        <span style={{
          fontSize: 9,
          letterSpacing: '0.12em',
          color: active ? step.tagColor : '#333330',
          border: `1px solid ${active ? step.tagColor + '50' : '#333330'}`,
          borderRadius: 4,
          padding: '2px 7px',
          transition: 'all 0.3s',
          fontFamily: "'Space Mono', monospace",
        }}>
          {step.tag}
        </span>
      </div>

      {/* terminal lines */}
      <div style={{ padding: '14px 18px', minHeight: 152, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {active
          ? <TerminalLines key={step.num} step={step} />
          : <div style={{ color: '#2A2A28', fontSize: 13, lineHeight: 1.85 }}>{step.lines[0].text}</div>
        }
      </div>
    </div>
  );
}

export function TerminalSection() {
  const { ref, visible } = useInView(0.08);
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const DURATIONS = [4000, 4500, 5000];
    let current = 0;
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      current = (current + 1) % 3;
      setActive(current);
      timer = setTimeout(loop, DURATIONS[current]);
    };
    timer = setTimeout(loop, DURATIONS[0]);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <>
      <style>{`
        @keyframes termFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .term-pill-row::-webkit-scrollbar { display: none; }
        .term-pill-row { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      <section
        ref={ref as React.RefObject<HTMLElement>}
        id="how"
        className="shell py-28 space-y-8"
      >
        {/* heading */}
        <div>
          <span className="chip mb-4 text-[10px] px-3 py-1 font-bold tracking-wider">
            HOW IT WORKS
          </span>
          <h2 className="title text-[clamp(28px,4vw,48px)] leading-tight mt-3">
            Three steps.<br />
            <span className="text-cyan-300">Zero middlemen.</span>
          </h2>
        </div>

        {/* step tab pills */}
        <div
          className="term-pill-row"
          style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: 4 }}
        >
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
                background: active === i ? 'rgba(0,240,255,0.06)' : 'transparent',
                border: `1px solid ${active === i ? s.tagColor + '55' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 8, padding: '6px 13px', cursor: 'pointer',
                fontFamily: "'Space Mono', monospace", transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 10, color: active === i ? s.tagColor : '#444440' }}>{s.num}</span>
              <span style={{ fontSize: 11, color: active === i ? '#ECEAE4' : '#555550', whiteSpace: 'nowrap' }}>{s.label}</span>
            </button>
          ))}
        </div>

        {/* terminals */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '0.875rem',
            alignItems: 'stretch',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {isMobile ? (
            <TerminalWindow step={STEPS[active]} active={true} />
          ) : (
            STEPS.map((s, i) => (
              <TerminalWindow key={i} step={s} active={active === i} />
            ))
          )}
        </div>

        {/* progress dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, maxWidth: 260 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div
                onClick={() => setActive(i)}
                style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                  background: active === i ? s.tagColor : '#333330',
                  transition: 'background 0.3s',
                }}
              />
              {i < 2 && (
                <div style={{ flex: 1, height: 1, background: '#333330', position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: STEPS[i].tagColor,
                    transform: active > i ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)',
                  }} />
                </div>
              )}
            </div>
          ))}
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10, color: '#555550',
            marginLeft: 10, whiteSpace: 'nowrap',
          }}>
            {STEPS[active].label}
          </span>
        </div>

        {/* step description cards */}
        <div
          style={{
            display: isMobile ? 'block' : 'grid',
            gridTemplateColumns: isMobile ? undefined : 'repeat(3,1fr)',
            gap: '0.75rem',
          }}
        >
          {STEPS.map((s, i) => (
            <div
              key={i}
              style={{
                padding: isMobile && active !== i ? 0 : '1rem',
                maxHeight: isMobile && active !== i ? 0 : 200,
                overflow: 'hidden',
                borderRadius: 10,
                background: active === i ? 'rgba(255,255,255,0.03)' : 'transparent',
                border: `1px solid ${active === i ? s.tagColor + '25' : 'transparent'}`,
                transition: 'all 0.35s',
                opacity: active === i ? 1 : isMobile ? 0 : 0.28,
              }}
            >
              {(!isMobile || active === i) && (
                <>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11, color: s.tagColor,
                    letterSpacing: '0.1em', marginBottom: '0.4rem', fontWeight: 500,
                  }}>
                    {s.num} — {s.tag}
                  </div>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: isMobile ? 18 : 16,
                    fontWeight: 700, color: '#ECEAE4',
                    lineHeight: 1.3, marginBottom: '0.4rem',
                  }}>
                    {s.title} <em style={{ color: s.tagColor, fontStyle: 'italic' }}>{s.italic}</em>
                  </div>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 12, color: '#AAAAAA', lineHeight: 1.7,
                  }}>
                    {s.body}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
