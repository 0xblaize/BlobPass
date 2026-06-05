"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import {
  ArrowRight,
  CheckCircle,
  Database,
  FileText,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { TransactionSpec, UploadReceipt } from "@/lib/blobpass/types";

type UploadResponse = {
  success: true;
  ok: true;
  source: string;
  previewBlobId: string | null;
  rawFileBlobId: string;
  previewUrl: string | null;
  upload: {
    rawFile: UploadReceipt;
    preview: UploadReceipt | null;
  };
  passDraft: {
    id: string;
    content: {
      fields: {
        walrus_blob_id: string;
      };
    };
  };
  transaction: TransactionSpec;
};

const flow = [
  { label: "Upload", icon: Upload },
  { label: "Metadata", icon: FileText },
  { label: "Walrus Store", icon: Database },
  { label: "Mint & List", icon: CheckCircle },
];

export function UploadWorkflow() {
  const account = useCurrentAccount();
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Digital Asset");
  const [priceSui, setPriceSui] = useState("1");
  const [status, setStatus] = useState<"idle" | "uploading" | "ready" | "error">("idle");
  const [response, setResponse] = useState<UploadResponse | null>(null);
  const [error, setError] = useState("");

  const activeStep = useMemo(() => {
    if (status === "ready") {
      return 3;
    }

    if (status === "uploading") {
      return 2;
    }

    if (assetFile) {
      return 1;
    }

    return 0;
  }, [assetFile, status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!account?.address) {
      setError("Connect a Sui wallet before uploading a protected asset.");
      return;
    }

    if (!assetFile) {
      setError("Select an asset file first.");
      return;
    }

    setStatus("uploading");
    setError("");

    const formData = new FormData();
    formData.append("asset", assetFile);

    if (previewFile) {
      formData.append("preview", previewFile);
    }

    formData.append("title", title || assetFile.name);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("priceSui", priceSui);
    formData.append("sellerAddress", account?.address ?? "");

    try {
      const result = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const payload: unknown = await result.json();

      if (!result.ok) {
        throw new Error(
          payload && typeof payload === "object" && "error" in payload
            ? String(payload.error)
            : "Upload failed",
        );
      }

      setResponse(payload as UploadResponse);
      setStatus("ready");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
      setStatus("error");
    }
  }

  return (
    <section className="mx-auto mt-14 max-w-5xl space-y-10">
      <div className="grid gap-4 md:grid-cols-4">
        {flow.map((step, index) => {
          const Icon = step.icon;
          const complete = index < activeStep || status === "ready";
          const active = index === activeStep && status !== "ready";

          return (
            <div className="relative text-center" key={step.label}>
              <div
                className={`mx-auto grid h-12 w-12 place-items-center rounded-full border ${
                  complete || active
                    ? "border-cyan-300 bg-cyan-300/12 text-cyan-300"
                    : "border-white/20 bg-black text-zinc-400"
                }`}
              >
                <Icon size={22} />
              </div>
              <div
                className={`mt-4 text-sm font-black uppercase ${
                  complete || active ? "text-cyan-300" : "text-zinc-400"
                }`}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      <form className="panel rounded-xl" onSubmit={submit}>
        <div className="flex items-center justify-between border-b border-white/10 p-8">
          <div>
            <h2 className="title text-2xl">Create Access Pass</h2>
            <p className="mt-2 text-zinc-400">Store the asset on Walrus and produce the Sui kiosk transaction.</p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-full border border-cyan-300/40 bg-cyan-300/10 text-cyan-300">
            {activeStep + 1}
          </div>
        </div>

        <div className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <label className="grid min-h-[240px] cursor-pointer place-items-center rounded-xl border border-dashed border-white/18 bg-white/[0.02] p-8 text-center hover:border-cyan-300/60">
              <input
                className="sr-only"
                onChange={(event) => setAssetFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <div>
                <div className="mx-auto mb-8 grid h-20 w-20 place-items-center rounded-full bg-cyan-300/12 text-cyan-300">
                  <Upload size={34} />
                </div>
                <h3 className="title text-2xl">{assetFile ? assetFile.name : "Select Digital Asset"}</h3>
                <p className="mx-auto mt-4 max-w-md leading-7 text-zinc-400">
                  ZIP, PDF, MP4, datasets, code archives, prompt packs, and 3D models.
                </p>
              </div>
            </label>

            <label className="grid gap-3 text-sm font-bold text-zinc-300">
              Public Preview Image
              <input
                accept="image/*"
                className="rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 text-zinc-300"
                onChange={(event) => setPreviewFile(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>

            <div className="flex gap-4 rounded-lg border border-white/10 bg-zinc-950 p-5 text-sm leading-6 text-zinc-400">
              <ShieldCheck className="shrink-0 text-cyan-300" size={22} />
              <p>
                The raw asset is stored as a hidden blob. The marketplace receives only public metadata and preview data.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <label className="grid gap-3 text-sm font-bold text-zinc-300">
              Title
              <input
                className="rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 text-white"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Premium 3D Blender Pack"
                value={title}
              />
            </label>

            <label className="grid gap-3 text-sm font-bold text-zinc-300">
              Description
              <textarea
                className="min-h-32 rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 text-white"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="High-fidelity assets for rendering engines."
                value={description}
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-3 text-sm font-bold text-zinc-300">
                Category
                <select
                  className="rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 text-white"
                  onChange={(event) => setCategory(event.target.value)}
                  value={category}
                >
                  {["Digital Asset", "Datasets", "Video", "Source Code", "Documents", "AI Models"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-3 text-sm font-bold text-zinc-300">
                Price
                <input
                  className="rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 text-white"
                  min="0"
                  onChange={(event) => setPriceSui(event.target.value)}
                  step="0.000000001"
                  type="number"
                  value={priceSui}
                />
              </label>
            </div>

            <button className="button-primary min-h-14 w-full text-base" disabled={status === "uploading"} type="submit">
              {status === "uploading" ? "Uploading..." : "Store, Mint & List"}
              <ArrowRight size={20} />
            </button>

            {!account?.address ? (
              <p className="text-sm font-bold text-amber-300">
                Connect a Sui wallet to stamp the seller address into the upload payload.
              </p>
            ) : null}

            {error ? <p className="text-sm font-bold text-red-300">{error}</p> : null}

            {response ? (
              <div className="rounded-lg border border-cyan-300/25 bg-cyan-300/8 p-5 text-sm text-zinc-300">
                <div className="mb-3 font-black text-cyan-300">Pass Ready</div>
                <div className="grid gap-2">
                  <span>Object: {response.passDraft.id}</span>
                  <span>Hidden blob: {response.rawFileBlobId}</span>
                  <span>Preview blob: {response.previewBlobId ?? "none"}</span>
                  <span>PTB calls: {response.transaction.calls.length}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </form>
    </section>
  );
}
