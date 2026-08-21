"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PublicKey } from "@solana/web3.js";

export function ChannelLookup({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function openChannel() {
    try {
      const pda = new PublicKey(value.trim()).toBase58();
      setError(null);
      router.push(`/channel/${pda}`);
    } catch {
      setError("Enter a valid Channel address.");
    }
  }

  return (
    <div>
      <div className="lookup">
        <input
          className="input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Channel address"
          aria-label="Channel address"
          disabled={disabled}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !disabled) openChannel();
          }}
        />
        <button className="button" disabled={disabled || !value.trim()} onClick={openChannel}>
          Open channel
        </button>
      </div>
      {error ? <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 10 }}>{error}</p> : null}
    </div>
  );
}
