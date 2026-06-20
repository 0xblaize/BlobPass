import { Footer, Header, StackPills } from "@/components/chrome";
import { UploadWorkflow } from "@/components/upload/UploadWorkflow";

export default function UploadPage() {
  return (
    <>
      <Header active="upload" />
      <main className="shell pb-24 pt-16">
        <section className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[7fr_5fr]">
          <div>
            <div className="section-num mb-3">01 — INTAKE</div>
            <h1 className="display text-[clamp(36px,5vw,64px)]">
              List a new
              <br />
              <span style={{ color: "var(--signal-deep)" }}>access pass.</span>
            </h1>
            <p className="mono mt-8 max-w-[52ch] text-[14px] leading-[1.8] text-[var(--ink-60)]">
              Five sections. Hash → metadata → price → storage → editions.
              When you sign, the blob lands on Walrus and the pass mints on
              Sui in one transaction.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <div className="ascii-rule w-full" />
            <div className="section-num">PROTOCOL STACK</div>
            <StackPills />
          </div>
        </section>

        <UploadWorkflow />
      </main>
      <Footer />
    </>
  );
}
