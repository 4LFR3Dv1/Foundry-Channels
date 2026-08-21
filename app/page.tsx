import { ChannelLookup } from "@/components/channel-lookup";
import { runtimeConfigurationState } from "@/lib/config";
import { databaseReady } from "@/lib/db";
import { channelVaultProgramReady } from "@/lib/solana/read-channel";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const config = runtimeConfigurationState();
  const [dbReady, programReady] = config.configured
    ? await Promise.all([databaseReady(), channelVaultProgramReady()])
    : [false, false];
  const operational = config.configured && dbReady && programReady;

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">F</span>
          <span>Foundry Channels</span>
        </a>
        <span className="beta-pill">Beta · Solana devnet</span>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">Persistent stablecoin channels</p>
          <h1>Send more.<br />Settle less.</h1>
        </div>
        <div className="hero-copy">
          <p>
            Fund a relationship once, share a channel, then increase one cumulative amount without asking for a wallet every time.
          </p>
          <ChannelLookup disabled={!operational} />
        </div>
      </section>

      <section className="runtime-card" aria-live="polite">
        <div>
          <h2>{operational ? "Beta runtime is live" : "Beta runtime is not yet authorized"}</h2>
          <p>
            {operational
              ? "Channel views resolve from the configured ChannelVault program and durable application state."
              : "No mock state is shown. Channel access stays closed until Postgres, Solana RPC and an executable authorized ChannelVault Program ID are configured."}
          </p>
        </div>
        <span className={`status-pill ${operational ? "runtime-ok" : "runtime-wait"}`}>
          <span className="dot" />
          {operational ? "Operational" : "Fail-closed"}
        </span>
      </section>

      <footer className="footer">
        <span>Foundry Channels · public beta</span>
        <span>No custody · no fabricated balances · mainnet not authorized</span>
      </footer>
    </main>
  );
}
