"use client";

// Tiny client island that copies a string to the clipboard and shows a
// transient "Copied" confirmation.

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({
  value,
  label = "Copy link",
  copiedLabel = "Copied",
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard API can fail on insecure contexts. Fall back to prompt.
          window.prompt("Copy this link", value);
        }
      }}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}
