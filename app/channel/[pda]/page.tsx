import { PublicKey } from "@solana/web3.js";
import { getRuntimeConfig } from "@/lib/config";
import { formatBaseUnits, percentage } from "@/lib/money";
import { channelEconomics } from "@/lib/solana/channel-state";
import { readChannel } from "@/lib/solana/read-channel";

export const dynamic = "force-dynamic";

function short(value: PublicKey): string {
  const text = value.toBase58();
  return `${text.slice(0, 4)}…${text.slice(-4)}`;
}

export default async function ChannelPage({ params }: { params: Promise<{ pda: string }> }) {
  const { pda: rawPda } = await params;

  let pda: PublicKey;
  try {
    pda = new PublicKey(rawPda);
  } catch {
    return <Failure title="Invalid channel address" detail="The requested address is not a valid Solana public key." />;
  }

  try {
    const observed = await readChannel(pda);
    const config = getRuntimeConfig();
    const state = observed.state;
    const economics = channelEconomics(state);
    const funded = state.fundedTotal;
    const receivedPct = percentage(state.settledTotal, funded);
    const readyPct = percentage(economics.readyToReceive, funded);
    const availablePct = Math.max(0, 100 - receivedPct - readyPct);
    const recipient = state.recipientWallet ?? state.recipientClaimPubkey;

    return (
      <main className="shell">
        <header className="topbar">
          <a className="brand" href="/"><span className="brand-mark">F</span><span>Foundry Channels</span></a>
          <span className="beta-pill">Beta · Solana devnet</span>
        </header>

        <section className="channel-wrap">
          <article className="channel-card">
            <div className="channel-head">
              <div>
                <div className="relationship">{short(state.sender)} → {short(recipient)}</div>
                <div className="asset-line">SPL token · Solana devnet · epoch {state.epoch.toString()}</div>
              </div>
              <span className={`status-pill ${state.status === "needs_recovery" ? "runtime-wait" : "runtime-ok"}`}>
                <span className="dot" />{state.status.replaceAll("_", " ")}
              </span>
            </div>

            <div className="money-hero">
              <div className="money">{formatBaseUnits(economics.readyToReceive, state.decimals)}</div>
              <div className="money-label">ready to receive</div>
            </div>

            <div className="economic-bar" aria-label="Channel economic state">
              <div className="segment segment-received" style={{ width: `${receivedPct}%` }} />
              <div className="segment segment-ready" style={{ width: `${readyPct}%` }} />
              <div className="segment segment-available" style={{ width: `${availablePct}%` }} />
            </div>

            <div className="metrics">
              <div className="metric"><div className="metric-value">{formatBaseUnits(state.settledTotal, state.decimals)}</div><div className="metric-label">Received</div></div>
              <div className="metric"><div className="metric-value">{formatBaseUnits(economics.readyToReceive, state.decimals)}</div><div className="metric-label">Ready</div></div>
              <div className="metric"><div className="metric-value">{formatBaseUnits(economics.available, state.decimals)}</div><div className="metric-label">Available</div></div>
            </div>

            {state.status === "needs_recovery" ? (
              <div className="notice">
                <strong style={{ color: "var(--ink)" }}>Recovering your transfer.</strong><br />
                The channel reports an ambiguous execution state. Foundry must resolve the persisted transaction before another economic attempt is prepared.
              </div>
            ) : null}

            <div className="channel-footer">
              <span>Observed at slot {observed.slot.toLocaleString()}</span>
              <a className="verify-link" href="#verify">Verify channel ↘</a>
            </div>
          </article>

          <section className="verify-card" id="verify">
            <div className="verify-row"><span>Channel</span><span className="mono">{pda.toBase58()}</span></div>
            <div className="verify-row"><span>Program</span><span className="mono">{config.programId.toBase58()}</span></div>
            <div className="verify-row"><span>Sender</span><span className="mono">{state.sender.toBase58()}</span></div>
            <div className="verify-row"><span>Recipient</span><span className="mono">{state.recipientBound && state.recipientWallet ? state.recipientWallet.toBase58() : "Not bound"}</span></div>
            <div className="verify-row"><span>Mint</span><span className="mono">{state.mint.toBase58()}</span></div>
            <div className="verify-row"><span>Vault</span><span className="mono">{state.vaultTokenAccount.toBase58()}</span></div>
            <div className="verify-row"><span>Latest sequence</span><span>{state.latestActivatedSequence.toString()}</span></div>
          </section>
        </section>
      </main>
    );
  } catch (error) {
    return <Failure title="Channel could not be verified" detail={error instanceof Error ? error.message : "Unknown channel read failure"} />;
  }
}

function Failure({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/"><span className="brand-mark">F</span><span>Foundry Channels</span></a>
        <span className="beta-pill">Beta · Solana devnet</span>
      </header>
      <section className="channel-wrap">
        <div className="channel-card">
          <p className="eyebrow">Fail-closed</p>
          <h1 style={{ fontSize: 44, letterSpacing: "-.05em", margin: "0 0 16px" }}>{title}</h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{detail}</p>
        </div>
      </section>
    </main>
  );
}
