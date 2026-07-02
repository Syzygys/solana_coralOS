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

Known live-chain limitation in this environment:

The local network currently times out against public Solana devnet RPC endpoints, so the UI demonstrates the agent delivery surface and fallback behavior while the live escrow transaction is pending access to a working devnet RPC/faucet.
