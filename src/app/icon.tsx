import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * Brutalist favicon: ink-black square, paper "BP" wordmark, signal-green
 * corner accent + underline. No gradients, no rounded corners — matches
 * the rest of the site's Technical Brutalism design system.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#0e0e0e",
          color: "#fafaf7",
          fontFamily: "monospace",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* hairline frame */}
        <div
          style={{
            position: "absolute",
            inset: 4,
            border: "1px solid rgba(250,247,240,0.35)",
            display: "flex",
          }}
        />
        {/* signal-green corner mark (top-left) */}
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            width: 10,
            height: 10,
            borderTop: "2px solid #00c853",
            borderLeft: "2px solid #00c853",
            display: "flex",
          }}
        />
        {/* signal-green corner mark (bottom-right) */}
        <div
          style={{
            position: "absolute",
            bottom: 4,
            right: 4,
            width: 10,
            height: 10,
            borderBottom: "2px solid #00c853",
            borderRight: "2px solid #00c853",
            display: "flex",
          }}
        />
        {/* BP wordmark */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "0.04em",
            color: "#fafaf7",
            lineHeight: 1,
          }}
        >
          BP
        </div>
      </div>
    ),
    size,
  );
}
