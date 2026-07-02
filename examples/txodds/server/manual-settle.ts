/**
 * Minimal Imperial demo settlement proof.
 *
 * This bypasses the TxODDS fixture feed and settles a fixed order reference on devnet, so the
 * hackathon proof is not blocked by upstream odds/API availability. It still uses the same arbiter
 * wrapper: payer opens the order, neutral arbiter releases to the seller.
 */
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { ProxyAgent, setGlobalDispatcher } from 'undici'
import { Keypair, PublicKey, Connection, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import bs58 from 'bs58'
import {
  makeArbiter, initConfig, open, arbitrateRelease, configPda, vaultPda, arbitratedEscrowPda,
} from '../agent/arbiter.js'

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
  const arbiter = keypair('ARBITER_KEYPAIR_B58')
  const seller = new PublicKey(envOr('SELLER_WALLET', envOr('WALLET', buyer.publicKey.toBase58())))
  const connection = new Connection(rpc, 'confirmed')

  const adminProgram = makeArbiter(buyer, rpc)
  try {
    await (adminProgram.account as any).config.fetch(configPda())
  } catch {
    await initConfig(adminProgram, buyer, arbiter.publicKey)
  }

  if ((await connection.getBalance(arbiter.publicKey)) < 0.01 * LAMPORTS_PER_SOL) {
    const tx = new Transaction().add(SystemProgram.transfer({
      fromPubkey: buyer.publicKey,
      toPubkey: arbiter.publicKey,
      lamports: Math.round(0.02 * LAMPORTS_PER_SOL),
    }))
    await sendAndConfirmTransaction(connection, tx, [buyer])
  }

  const preimage = `imperial-demo:${Date.now()}`
  const reference = new PublicKey(createHash('sha256').update(preimage).digest())
  const openSig = await open(adminProgram, buyer, seller, reference, amountSol, 600)
  const releaseSig = await arbitrateRelease(makeArbiter(arbiter, rpc), arbiter, seller, reference)
  const vault = vaultPda(reference)
  const escrow = arbitratedEscrowPda(vault, reference)

  console.log(JSON.stringify({
    ok: true,
    mode: 'arbiter',
    amountSol,
    preimage,
    reference: reference.toBase58(),
    buyer: buyer.publicKey.toBase58(),
    seller: seller.toBase58(),
    arbiter: arbiter.publicKey.toBase58(),
    vault: vault.toBase58(),
    escrow: escrow.toBase58(),
    open: {
      sig: openSig,
      explorer: `https://explorer.solana.com/tx/${openSig}?cluster=devnet`,
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
