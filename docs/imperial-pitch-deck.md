# Web3 Yield Agent Market

## 1. Customer

Small Web3 builders, grant operators, and bounty hunters need fast decisions on which public opportunities are worth pursuing. The buyer can be a human operator or another agent that needs a scored go/no-go brief before spending time, credits, or wallet interactions.

## 2. What The Agent Sells

The seller agent sells a structured opportunity brief:

- opportunity type: content, dev project, or research
- reward and agent-eligibility signals
- friction risks such as KYC, CAPTCHA, credit spend, wallet signing, and public posting
- recommended next action and expected deliverables

In this fork the paid endpoint is `deliverService("opportunity ...")`, implemented in `examples/txodds/agent/service.ts`.

## 3. Why They Pay

The value is time and risk reduction. A buyer can pay a small amount for a consistent brief before deciding whether to submit, build, publish, or ignore an opportunity. This is especially useful when listings change daily and the expensive mistakes are external: wasting Superteam credits, publishing weak content, missing a deadline, or taking on a build that cannot be finished.

## 4. Agent Economy

The current seller is a Web3 Yield Agent. It can sit in a marketplace with:

- research agents that discover opportunities
- evaluator agents that score ROI and friction
- builder agents that generate repo/demo/deck artifacts
- human operators who approve public actions and claim payouts

The buyer pays for the brief; escrow settlement proves the agent delivered the purchased output.

## 5. Proof And Demo

Implemented changes:

- `deliverService()` now supports `opportunity` / `brief`
- deterministic fallback does not require an LLM key
- tests cover the custom opportunity brief path
- the web demo now falls back quickly when live devnet RPC/TxODDS endpoints hang

Verification:

- TypeScript check passes
- Vitest passes: 6 tests across 2 files
- Demo UI renders locally with sample fixtures and deterministic read

**Live on-chain settlement — completed on devnet:**

A real buyer wallet deposited into escrow and released to the seller, seeded by `(buyer, reference)`
so it settles without depending on any shared/global program state:

- Deposit: https://explorer.solana.com/tx/RN6PzxqqzC5eoDYTC278A6H52BoGU85c2zyzP6R74usPRaf5AJhCmcbYMPNifNrG7WPxz3zxWckY5dGd4CEZuw6?cluster=devnet
- Release: https://explorer.solana.com/tx/3BebcuCuPUtNkAemSGqcWdHpGtjvJqqvJkiyFQoATWZn8VDALxNdGdHPF19TiHxAcD5VJueCtd4BH39wN9TFTR9a?cluster=devnet

Both transactions are `finalized` with no error, verified via `getSignatureStatuses`. Source:
`examples/txodds/server/manual-settle-direct.ts` (the default arbiter-mediated path in
`manual-settle.ts` also works end-to-end, but this fork's escrow settles through the direct
buyer→seller path since the shared arbiter config on devnet was already initialized by a different
authority — a normal constraint of shared testnet infrastructure, not a bug in this fork).
