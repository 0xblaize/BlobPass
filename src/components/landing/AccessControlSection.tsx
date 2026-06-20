const steps = [
  {
    number: "01",
    label: "UPLOAD",
    description:
      "Drag and drop any file. It is erasure-coded and distributed across Walrus storage nodes.",
  },
  {
    number: "02",
    label: "STORE",
    description:
      "Your file becomes a durable Walrus blob that stays addressable for gated delivery.",
  },
  {
    number: "03",
    label: "MINT",
    description:
      "A DataAccessPass Move object is minted on Sui — the cryptographic key buyers receive.",
  },
  {
    number: "04",
    label: "LIST",
    description:
      "Set your price in SUI. The access_pass package handles the exchange autonomously.",
  },
  {
    number: "05",
    label: "UNLOCK",
    description:
      "Buyers pay once. The pass is transferred to their wallet, permanently locking access.",
  },
];

export function AccessControlSection() {
  return (
    <section className="shell py-28">
      {/* Header block — asymmetric 8/4 */}
      <div className="mb-20 grid grid-cols-1 items-end gap-8 md:grid-cols-[8fr_4fr]">
        <div>
          <div className="section-num mb-2">01 — PROTOCOL FLOW</div>
          <h2 className="display text-[clamp(40px,6vw,80px)]">
            Streamlined
            <br />
            access control.
          </h2>
        </div>
        <p className="mono max-w-[44ch] text-[13px] leading-7 text-[var(--ink-60)] md:text-right">
          Sui access passes, Tatum RPC verification, and Walrus storage —
          composed without a custom product database.
        </p>
      </div>

      {/* Step grid — 5 columns, all hairline-separated */}
      <div className="grid grid-cols-1 gap-px bg-[var(--ink-16)] md:grid-cols-5">
        {steps.map(({ number, label, description }) => (
          <div
            className="surface surface-interactive group flex flex-col gap-6 bg-[var(--paper)] p-6 md:p-7"
            key={number}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="display text-[40px]" style={{ color: "var(--ink)" }}>
                {number}
              </span>
              <span className="mono text-[10px] tracking-[0.18em] text-[var(--signal-deep)]">
                STEP
              </span>
            </div>
            <div className="line-draw text-[var(--signal)]" />
            <div>
              <div className="mono mb-3 text-[12px] font-medium tracking-[0.18em]">
                {label}
              </div>
              <p className="mono text-[12px] leading-7 text-[var(--ink-60)]">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
