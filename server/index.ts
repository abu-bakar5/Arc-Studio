/**
 * Agent payment server — Express + Circle Gateway x402 Nanopayments.
 *
 * Every POST /api/summarize requires a $0.01 USDC nanopayment on Arc Testnet.
 * The seller address is read from VITE_AGENT_SELLER_ADDRESS in .env.
 *
 * Start: bun run server/index.ts
 */

import express from 'express'
import { createGatewayMiddleware } from '@circle-fin/x402-batching/server'

const app = express()
app.use(express.json())

const sellerAddress = process.env.VITE_AGENT_SELLER_ADDRESS
if (!sellerAddress) {
  console.error('[x402] VITE_AGENT_SELLER_ADDRESS is not set — set it in .env and restart.')
  process.exit(1)
}

const gateway = createGatewayMiddleware({
  sellerAddress: sellerAddress as `0x${string}`,
})

// ---------------------------------------------------------------------------
// Paid endpoint: summarize an onchain topic
// POST /api/summarize  { topic: string }
// ---------------------------------------------------------------------------
app.post('/summarize', gateway.require('$0.01'), (req, res) => {
  const { topic } = req.body as { topic?: string }
  const safe = String(topic ?? 'general').slice(0, 200)
  res.json({
    summary: `[Paid result] Onchain summary for "${safe}": Arc Testnet is Circle's USDC-native L2 — gas is paid in USDC and finality is sub-second. This endpoint returned a result because your agent paid $0.01 via x402 Gateway Nanopayments.`,
    paidAt: new Date().toISOString(),
    endpoint: '/api/summarize',
  })
})

// ---------------------------------------------------------------------------
// Health / 402 probe
// GET /api/health
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', x402: true, chain: 'Arc Testnet', price: '$0.01 per /summarize call' })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`[x402] Agent payment server running on :${PORT}`)
  console.log(`[x402] Seller address: ${sellerAddress}`)
})
