import {
  CheckCircle,
  Database,
  Wallet,
} from "lucide-react";
import { Footer, Header, StackPills } from "@/components/chrome";
import { UploadWorkflow } from "@/components/upload/UploadWorkflow";

export default function UploadPage() {
  return (
    <>
      <Header active="upload" />
      <main className="shell py-16">
        <section className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <h1 className="title text-5xl md:text-6xl">
              List New <span className="text-cyan-300">Asset</span>
            </h1>
            <p className="mt-4 text-xl text-zinc-400">
              Three steps. Zero middlemen. Your files, your profit.
            </p>
          </div>
          <StackPills />
        </section>

        <UploadWorkflow />

        <section className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
          {[
            { icon: Database, title: "Permanent Storage", text: "Walrus ensures files remain available even if centralized servers go down." },
            { icon: CheckCircle, title: "Sui Verification", text: "Ownership and access rights are transparently managed by the Sui blockchain." },
            { icon: Wallet, title: "Direct Payments", text: "Sellers receive SUI directly into their wallets after every purchase." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div className="panel rounded-lg p-7" key={item.title}>
                <Icon className="mb-6 text-cyan-300" size={28} />
                <h3 className="title text-lg">{item.title}</h3>
                <p className="mt-4 leading-7 text-zinc-400">{item.text}</p>
              </div>
            );
          })}
        </section>
      </main>
      <Footer />
    </>
  );
}
