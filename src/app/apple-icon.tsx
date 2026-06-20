import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon — same brutalist BP wordmark as the favicon, scaled up
 * so the [BP] · BLOBPASS lockup reads clearly when pinned to a home screen.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#0e0e0e",
          color: "#fafaf7",
          fontFamily: "monospace",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          padding: 18,
        }}
      >
        {/* hairline inner frame */}
        <div
          style={{
            position: "absolute",
            inset: 12,
            border: "1px solid rgba(250,247,240,0.35)",
            display: "flex",
          }}
        />
        {/* corner marks */}
        {[
          { top: 12, left: 12, b: "Top", b2: "Left" },
          { top: 12, right: 12, b: "Top", b2: "Right" },
          { bottom: 12, left: 12, b: "Bottom", b2: "Left" },
          { bottom: 12, right: 12, b: "Bottom", b2: "Right" },
        ].map((mark, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: mark.top,
              bottom: mark.bottom,
              left: mark.left,
              right: mark.right,
              width: 16,
              height: 16,
              [`border${mark.b}`]: "2px solid #00c853",
              [`border${mark.b2}`]: "2px solid #00c853",
              display: "flex",
            }}
          />
        ))}

        {/* top tag */}
        <div
          style={{
            display: "flex",
            fontSize: 10,
            letterSpacing: "0.28em",
            color: "#00c853",
            position: "absolute",
            top: 28,
          }}
        >
          [ v0.1 ]
        </div>

        {/* BP wordmark */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: "0.02em",
            color: "#fafaf7",
            lineHeight: 1,
          }}
        >
          BP
        </div>

        {/* bottom wordmark */}
        <div
          style={{
            display: "flex",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.30em",
            color: "rgba(250,247,240,0.6)",
            position: "absolute",
            bottom: 30,
          }}
        >
          BLOBPASS
        </div>
      </div>
    ),
    size,
  );
}
