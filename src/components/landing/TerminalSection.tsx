'use client';

import { useEffect, useRef, useState } from 'react';

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLElement | null>(null);
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
    tag: '[ WALRUS STORAGE ]',
    tagColor: '#00c853',
    title: 'Upload.',
    italic: 'Walrus keeps it.',
    body: 'Your file becomes a certified blob across 200+ storage nodes. 2-of-N erasure coded. No server. No AWS.',
    filename: 'walrus — bash',
    lines: [
      { delay: 0,    text: '$ walrus upload market-data-q2.csv',       color: '#ECEAE4' },
      { delay: 600,  text: '  ↑ uploading 45 MB → publisher node…',    color: '#888880' },
      { delay: 1200, text: '  ✓ blob certified  —  2-of-N redundancy', color: '#00c853' },
      { delay: 1800, text: '  blobId  bAEOPR7xk2Bt6mY8wQ5nS4hJ3iG…',  color: '#D4A853' },
      { delay: 2400, text: '  size    45 MB   epochs  5   nodes  200+',color: '#888880' },
      { delay: 3000, text: '  url     aggregator.walrus-testnet.wa…',  color: '#888880' },
    ],
  },
  {
    num: '02',
    label: 'List on Sui',
    tag: '[ ACCESS LEDGER ]',
    tagColor: '#fafaf7',
    title: 'Price it.',
    italic: 'Sui holds the lock.',
    body: 'A DataAccessPass is minted and a Listing is published through the custom access_pass package. The blob is registered once in the shared BlobRegistry — buyers receive the pass object as on-chain proof of access.',
    filename: 'sui — bash',
    lines: [
      { delay: 0,    text: '$ sui client call \\',                       color: '#ECEAE4' },
      { delay: 0,    text: '    --module access_pass \\',                color: '#888880' },
      { delay: 0,    text: '    --function create_registered_listing',   color: '#888880' },
      { delay: 600,  text: '  ✓ DataAccessPass minted',                  color: '#00c853' },
      { delay: 1200, text: '  passId     0x9f2e8d1c3a5b7e4f62a1b9…',    color: '#D4A853' },
      { delay: 1800, text: '  seller     0x4a21…9e3f',                  color: '#888880' },
      { delay: 2400, text: '  price      15 SUI',                        color: '#888880' },
      { delay: 3000, text: '  ✓ registry indexed  →  Listing shared',   color: '#00c853' },
    ],
  },
  {
    num: '03',
    label: 'Buyer gets access',
    tag: '[ TATUM RPC ]',
    tagColor: '#fafaf7',
    title: 'Pay once.',
    italic: 'Tatum confirms it.',
    body: "Buyer pays. Tatum's Sui RPC verifies the DataAccessPass transfer. Access granted. File retrieved from Walrus. Done.",
    filename: 'tatum rpc — verify',
    lines: [
      { delay: 0,    text: '$ tatum sui getObject 0x9f2e8d1c3a5b…',    color: '#ECEAE4' },
      { delay: 600,  text: '  objectId   0x9f2e8d1c3a5b7e4f62a1b9…',   color: '#888880' },
      { delay: 1200, text: '  owner      0x4a21…9e3f  ← buyer wallet', color: '#D4A853' },
      { delay: 1800, text: '  ✓ ownership verified  —  access granted',color: '#00c853' },
      { delay: 2400, text: '$ walrus download bAEOPR7xk2Bt6mY8wQ5…',   color: '#ECEAE4' },
      { delay: 3000, text: '  ↓ fetching from aggregator…',             color: '#888880' },
      { delay: 3600, text: '  ✓ market-data-q2.csv  →  ./downloads/', color: '#00c853' },
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
        border: `1px solid ${active ? 'var(--signal)' : 'rgba(250,247,240,0.12)'}`,
        borderTop: `2px solid ${active ? 'var(--signal)' : 'rgba(250,247,240,0.12)'}`,
        borderRadius: 0,
        overflow: 'hidden',
        fontFamily: 'var(--font-mono)',
        transition: 'border-color 0.3s',
      }}
    >
      {/* window chrome — brutalist: no traffic lights, hairline divider */}
      <div style={{
        padding: '9px 14px',
        borderBottom: '1px solid rgba(250,247,240,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)',
      }}>
        <span style={{
          fontSize: 10,
          color: active ? '#ECEAE4' : '#666660',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          {step.filename}
        </span>
        <span style={{
          fontSize: 9,
          letterSpacing: '0.16em',
          color: active ? 'var(--signal)' : '#333330',
          transition: 'color 0.3s',
          fontFamily: 'var(--font-mono)',
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
  const currentRef = useRef(0);

  const handleSelect = (i: number) => {
    currentRef.current = i;
    setActive(i);
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const DURATIONS = [4000, 4500, 5000];
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      const next = (currentRef.current + 1) % 3;
      currentRef.current = next;
      setActive(next);
      timer = setTimeout(loop, DURATIONS[next]);
    };
    timer = setTimeout(loop, DURATIONS[currentRef.current]);
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
        ref={ref}
        id="how"
        className="shell py-28 space-y-8"
      >
        {/* heading */}
        <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-[8fr_4fr]">
          <div>
            <div className="section-num mb-3" style={{ color: 'rgba(250,247,240,0.4)' }}>02 — RUNTIME</div>
            <h2 className="display text-[clamp(40px,6vw,80px)]" style={{ color: 'var(--paper)' }}>
              Three steps.<br />
              <span style={{ color: 'var(--signal)' }}>Zero middlemen.</span>
            </h2>
          </div>
          <p className="mono max-w-[40ch] text-[13px] leading-7" style={{ color: 'var(--paper-60)' }}>
            Watch the protocol speak. Each tab is a real CLI transcript — what
            actually runs when a file is uploaded, listed, and unlocked.
          </p>
        </div>

        {/* step tab pills */}
        <div
          className="term-pill-row"
          style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: 4 }}
        >
          {STEPS.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
                background: 'transparent',
                border: `1px solid ${active === i ? 'var(--signal)' : 'rgba(250,247,240,0.16)'}`,
                borderRadius: 0, padding: '6px 13px', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 10, color: active === i ? 'var(--signal)' : '#444440', letterSpacing: '0.12em' }}>{s.num}</span>
              <span style={{ fontSize: 11, color: active === i ? '#ECEAE4' : '#555550', whiteSpace: 'nowrap', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</span>
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
              <button
                type="button"
                onClick={() => handleSelect(i)}
                aria-label={`Go to step ${i + 1}: ${s.label}`}
                style={{
                  width: 8, height: 8, borderRadius: 0, flexShrink: 0, cursor: 'pointer',
                  background: active === i ? 'var(--signal)' : 'transparent',
                  border: `1px solid ${active === i ? 'var(--signal)' : '#444440'}`,
                  transition: 'all 0.3s',
                  padding: 0,
                }}
              />
              {i < 2 && (
                <div style={{ flex: 1, height: 1, background: '#333330', position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'var(--signal)',
                    transform: active > i ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)',
                  }} />
                </div>
              )}
            </div>
          ))}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10, color: '#888880',
            letterSpacing: '0.16em', textTransform: 'uppercase',
            marginLeft: 12, whiteSpace: 'nowrap',
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
                borderRadius: 0,
                background: 'transparent',
                borderTop: `1px solid ${active === i ? 'var(--signal)' : 'rgba(250,247,240,0.10)'}`,
                transition: 'all 0.35s',
                opacity: active === i ? 1 : isMobile ? 0 : 0.32,
              }}
            >
              {(!isMobile || active === i) && (
                <>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10, color: active === i ? 'var(--signal)' : '#888880',
                    letterSpacing: '0.16em', marginBottom: '0.6rem', fontWeight: 500,
                    textTransform: 'uppercase',
                  }}>
                    {s.num} · {s.tag}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: isMobile ? 16 : 14,
                    fontWeight: 700, color: '#ECEAE4',
                    lineHeight: 1.4, marginBottom: '0.4rem',
                    letterSpacing: '0.01em',
                  }}>
                    {s.title} <span style={{ color: 'var(--signal)' }}>{s.italic}</span>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12, color: '#AAAAAA', lineHeight: 1.75,
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
