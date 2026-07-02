/**
 * Direct-escrow fallback for the Imperial demo proof.
 *
 * The arbiter path failed with NotArbiter: the on-chain arbiter config PDA is shared/global on
 * devnet and was already initialized by someone else with a different arbiter authority, so our
 * locally generated arbiter keypair isn't authorized to release. The base escrow program has no such
 * shared state — deposit/release are seeded by (buyer, reference), fully self-contained per buyer —
 * so it settles cleanly without needing arbiter authority. This is the documented fallback path
 * (see CLAUDE.md: "/api/settle ... falling back to the direct escrow").
 */
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { ProxyAgent, setGlobalDispatcher } from 'undici'
import { Keypair, PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'
import { makeProgram, deposit, release, escrowPda } from '../agent/escrow.js'

const ENV_PATH = process.env.KIT_ENV ?? fileURLToPath(new URL('../../../.env', import.meta.url))

function loadEnv(): void {
  try {
    for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* no .env - rely on shell env */ }
}

function configureProxy(): void {
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY
  if (proxy) setGlobalDispatcher(new ProxyAgent(proxy))
}

function envOr(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback
}

function keypair(name: string): Keypair {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} not set`)
  return Keypair.fromSecretKey(bs58.decode(value))
}

async function main(): Promise<void> {
  loadEnv()
  configureProxy()

  const rpc = envOr('SOLANA_RPC_URL', 'https://api.devnet.solana.com')
  const amountSol = Math.max(0.001, Number(process.argv[2] ?? '0.001'))
  const buyer = keypair('BUYER_KEYPAIR_B58')
  const seller = new PublicKey(envOr('SELLER_WALLET', envOr('WALLET', buyer.publicKey.toBase58())))
  const program = await makeProgram(buyer, rpc)

  const preimage = `imperial-demo-direct:${Date.now()}`
  const reference = new PublicKey(createHash('sha256').update(preimage).digest())
  const depositSig = await deposit(program, buyer, seller, reference, amountSol, 600)
  const releaseSig = await release(program, buyer, seller, reference)

  console.log(JSON.stringify({
    ok: true,
    mode: 'direct-escrow',
    amountSol,
    preimage,
    reference: reference.toBase58(),
    buyer: buyer.publicKey.toBase58(),
    seller: seller.toBase58(),
    escrow: escrowPda(buyer.publicKey, reference).toBase58(),
    deposit: {
      sig: depositSig,
      explorer: `https://explorer.solana.com/tx/${depositSig}?cluster=devnet`,
    },
    release: {
      sig: releaseSig,
      explorer: `https://explorer.solana.com/tx/${releaseSig}?cluster=devnet`,
    },
  }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
