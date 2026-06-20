"use client";

import dynamic from "next/dynamic";

/**
 * Lazy-load the Three.js rabbit scene on the client only so the ~600KB
 * three.js bundle never ships with the initial page chunk. The RabbitScene
 * itself paints its own LOADING · RABBIT.GLB placeholder until it mounts.
 */
export const RabbitSceneLazy = dynamic(
  () => import("./RabbitScene").then((mod) => mod.RabbitScene),
  {
    ssr: false,
    loading: () => (
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              color: "rgba(250,247,240,0.55)",
            }}
          >
            LOADING · RABBIT.GLB
          </div>
          <div
            className="mono mt-2"
            style={{
              fontSize: 9,
              letterSpacing: "0.18em",
              color: "#00c853",
            }}
          >
            4.0 MB · GLTF 2.0
          </div>
        </div>
      </div>
    ),
  },
);
