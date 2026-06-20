import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BlobPass — files certified, access permanent.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/**
 * Brutalist OG image — ink-on-paper Swiss-grid composition with mono type,
 * ASCII rules, bracket tags, and one signal-green accent. Matches the
 * landing page's Technical Brutalism visual identity. No gradients, no
 * cyan, no rounded corners.
 */
export default function OpenGraphImage() {
  const ink = "#0e0e0e";
  const paper = "#fafaf7";
  const signal = "#00c853";
  const ink60 = "rgba(14,14,14,0.6)";
  const ink40 = "rgba(14,14,14,0.4)";
  const ink16 = "rgba(14,14,14,0.16)";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: paper,
          color: ink,
          fontFamily: "monospace",
          padding: 56,
          position: "relative",
        }}
      >
        {/* Hairline outer frame */}
        <div
          style={{
            position: "absolute",
            inset: 32,
            border: `1px solid ${ink16}`,
            display: "flex",
          }}
        />

        {/* Corner marks (signal green) */}
        {[
          { top: 32, left: 32, b: "Top", b2: "Left" },
          { top: 32, right: 32, b: "Top", b2: "Right" },
          { bottom: 32, left: 32, b: "Bottom", b2: "Left" },
          { bottom: 32, right: 32, b: "Bottom", b2: "Right" },
        ].map((m, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: m.top,
              bottom: m.bottom,
              left: m.left,
              right: m.right,
              width: 22,
              height: 22,
              [`border${m.b}`]: `2px solid ${signal}`,
              [`border${m.b2}`]: `2px solid ${signal}`,
              display: "flex",
            }}
          />
        ))}

        {/* Main content stack */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            paddingLeft: 28,
            paddingRight: 28,
            paddingTop: 28,
            paddingBottom: 28,
          }}
        >
          {/* Top row: logo + version */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 16,
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "0.20em",
                  color: ink,
                }}
              >
                [BP]
              </span>
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: "0.28em",
                  color: ink,
                }}
              >
                BLOBPASS
              </span>
              <span
                style={{
                  fontSize: 16,
                  letterSpacing: "0.18em",
                  color: signal,
                }}
              >
                v0.1
              </span>
            </div>
            <span
              style={{
                fontSize: 14,
                letterSpacing: "0.24em",
                color: ink40,
              }}
            >
              01 — ACCESS LEDGER
            </span>
          </div>

          {/* Centerpiece headline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxWidth: 980,
            }}
          >
            <span
              style={{
                fontSize: 96,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 0.95,
                color: ink,
              }}
            >
              Files,
            </span>
            <span
              style={{
                fontSize: 96,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 0.95,
                color: signal,
              }}
            >
              certified.
            </span>
            <span
              style={{
                fontSize: 96,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 0.95,
                color: ink,
              }}
            >
              Access, permanent.
            </span>
          </div>

          {/* Bottom row: stack pills + meta */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 14,
              }}
            >
              {[
                { label: "WALRUS", accent: true },
                { label: "SUI", accent: false },
                { label: "TATUM", accent: false },
              ].map((p) => (
                <div
                  key={p.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: `1px solid ${p.accent ? signal : ink40}`,
                    color: p.accent ? signal : ink,
                    padding: "8px 16px",
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: "0.20em",
                  }}
                >
                  [ {p.label} ]
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
                fontSize: 14,
                letterSpacing: "0.18em",
                color: ink60,
              }}
            >
              <span>STORAGE / WALRUS</span>
              <span>CHAIN / SUI · TESTNET</span>
              <span style={{ color: signal }}>● ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
