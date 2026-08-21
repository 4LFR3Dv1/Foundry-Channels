# Foundry Channels

Public beta application for persistent, funded stablecoin payment channels.

> Open a channel. Share a link. Send as often as you want.

This repository is the product/runtime surface of Foundry Channels. It is intentionally separate from:

- [`4LFR3Dv1/Foundry-Pay`](https://github.com/4LFR3Dv1/Foundry-Pay) — protocol, economic authority, ChannelVault contracts and evidence;
- [`4LFR3Dv1/Solana-Agent`](https://github.com/4LFR3Dv1/Solana-Agent) — network-specific preparation, execution, status and recovery.

## Beta contract

The beta is a real application, not a fixture or demo. Consumer-visible Channel state must come from persisted application state reconciled with an authorized ChannelVault deployment. The UI must never fabricate a balance, settlement, activation, recovery state, transaction or network observation.

Initial environment: **Solana devnet**.

`beta` describes product maturity. It does not mean mocked execution.

Mainnet, real-value production claims and custody are separate future gates.

## Product language

Primary consumer terms:

- Channel
- Available
- Sent
- Received
- Ready to receive
- Choose wallet
- Transfer
- Recovering
- Close channel

Protocol terminology belongs behind verification/details surfaces.

## Runtime invariant

The application fails closed when required production configuration is absent. In particular, no Channel screen may become operational without an explicit ChannelVault Program ID, Solana RPC configuration and durable persistence.

## Status

Bootstrap in progress. No operational ChannelVault deployment is claimed by this repository yet.
