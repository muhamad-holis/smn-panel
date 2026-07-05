"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyLinkButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard tidak tersedia, abaikan secara diam-diam
    }
  }

  return (
    <button onClick={handleCopy} className="btn-secondary shrink-0 gap-1.5">
      {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
      {copied ? "Tersalin" : "Salin"}
    </button>
  );
}
