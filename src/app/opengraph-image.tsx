import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BlobPass Marketplace Preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at top right, rgba(34,211,238,0.22), transparent 32%), linear-gradient(135deg, #020617 0%, #000000 45%, #05252b 100%)",
          color: "white",
          padding: "56px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "28px",
            padding: "40px",
            background: "rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#67e8f9",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                }}
              >
                BlobPass
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: "64px",
                  lineHeight: 1,
                  fontWeight: 800,
                  maxWidth: "700px",
                }}
              >
                <span>Sell Digital Files</span>
                <span style={{ color: "#67e8f9" }}>Stored on Walrus</span>
              </div>
              <div
                style={{
                  display: "flex",
                  maxWidth: "760px",
                  fontSize: "28px",
                  lineHeight: 1.35,
                  color: "#cbd5e1",
                }}
              >
                Native Sui wallet access, marketplace listings, and token-gated downloads in one
                decentralized pipeline.
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                {["Walrus Storage", "Sui Access Passes", "Tatum RPC"].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid rgba(103,232,249,0.35)",
                      background: "rgba(8,145,178,0.14)",
                      borderRadius: "999px",
                      padding: "12px 18px",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#cffafe",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "10px",
                  color: "#a1a1aa",
                  fontSize: "20px",
                }}
              >
                <span>Marketplace</span>
                <span>Upload</span>
                <span>My Library</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
