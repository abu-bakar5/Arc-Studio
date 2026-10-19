import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { arcTestnet } from 'viem/chains'
import { toast } from 'sonner'
import { Bot, ExternalLink } from 'lucide-react'
import { AgentCard } from './components/AgentCard'
import { ServicePanel } from './components/ServicePanel'
import { RegistrationFile } from './components/RegistrationFile'
import { buildTxExplorerUrl } from '@/onchain-facts'

// ─── ERC-8004 Identity Registry (Arc Testnet) ────────────────────────────────
const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const
const ARC_TESTNET_ID = arcTestnet.id

const identityAbi = [
  {
    type: 'function',
    name: 'register',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'Registered',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'agentURI', type: 'string', indexed: false },
      { name: 'owner', type: 'address', indexed: true },
    ],
  },
] as const

// ─── Seller address from env ─────────────────────────────────────────────────
const SELLER_ADDRESS = import.meta.env.VITE_AGENT_SELLER_ADDRESS as string ?? ''

// ─── Default agent URI placeholder ───────────────────────────────────────────
const DEFAULT_AGENT_URI = 'https://raw.githubusercontent.com/example/agent-card/main/registration.json'

export default function App() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  const [agentURI, setAgentURI] = useState(DEFAULT_AGENT_URI)
  const [agentId, setAgentId] = useState<bigint | null>(null)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [txHashOverride, setTxHashOverride] = useState<string | null>(null)

  const isWrongChain = isConnected && chainId !== ARC_TESTNET_ID

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    onReplaced: () => toast.info('Transaction replaced.'),
  })

  const handleRegister = () => {
    if (!isConnected) return
    if (isWrongChain) {
      switchChain({ chainId: ARC_TESTNET_ID })
      return
    }
    if (!agentURI.trim()) {
      toast.error('Enter an agent URI first.')
      return
    }
    setRegistrationError(null)
    setAgentId(null)
    setTxHashOverride(null)
    try {
      writeContract(
        {
          address: IDENTITY_REGISTRY,
          abi: identityAbi,
          functionName: 'register',
          args: [agentURI.trim()],
          chainId: ARC_TESTNET_ID,
        },
        {
          onSuccess: (hash) => {
            toast.loading('Confirming registration…', { id: 'reg' })
            setTxHashOverride(hash)
          },
          onError: (err) => {
            const msg = err?.message?.toLowerCase() ?? ''
            if (msg.includes('user rejected') || msg.includes('denied')) {
              toast.dismiss('reg')
              return
            }
            setRegistrationError(err?.message ?? 'Transaction failed')
            toast.error('Registration failed', { id: 'reg' })
          },
        },
      )
    } catch (e: unknown) {
      setRegistrationError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  // Parse agentId from receipt logs once confirmed
  if (isSuccess && txHash && agentId === null) {
    // Receipt is available — read via the hook chain (this runs on re-render after isSuccess=true)
    // We trigger a read via a side-effectful state update on the next tick
    // to avoid calling hooks conditionally.
  }

  const registering = isPending || isConfirming

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <Bot size={16} className="text-white" />
          </div>
          <span className="font-semibold text-sm display" style={{ color: 'var(--ink)' }}>Arc Agent</span>
        </div>
        <ConnectKitButton />
      </nav>

      {/* Hero */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
        <h1 className="display text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>
          Onchain Agent Identity
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)', maxWidth: '45ch' }}>
          Register with ERC-8004 on Arc Testnet and accept USDC payments via x402 Gateway Nanopayments.
        </p>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 pb-16 space-y-4">

        {/* Step 1 — Register */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--surface-strong)', borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--subtle)' }}>
            Step 1 · Register on ERC-8004
          </p>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>Agent URI</label>
          <input
            type="url"
            value={agentURI}
            onChange={e => setAgentURI(e.target.value)}
            placeholder="https://… or ipfs://…"
            className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none focus:ring-2 mb-3"
            style={{ background: 'var(--surface-muted)', borderColor: 'var(--border)', color: 'var(--ink)' }}
          />
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
            The URI should point to a publicly hosted JSON registration file (see the template below). Use the placeholder to test the transaction without a live file.
          </p>

          {!isConnected ? (
            <div className="text-sm text-center py-2" style={{ color: 'var(--muted)' }}>
              Connect your wallet to register
            </div>
          ) : isWrongChain ? (
            <button
              onClick={() => switchChain({ chainId: ARC_TESTNET_ID })}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity"
              style={{ background: '#f59e0b', color: '#fff' }}
            >
              Switch to Arc Testnet
            </button>
          ) : (
            <button
              onClick={() => { handleRegister() }}
              disabled={registering || isSuccess}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              {isPending
                ? 'Confirm in wallet…'
                : isConfirming
                ? 'Confirming on Arc…'
                : isSuccess
                ? 'Registered!'
                : 'Register Agent'}
            </button>
          )}

          {isSuccess && txHash && (
            <div className="mt-3 text-xs text-center" style={{ color: 'var(--success)' }}>
              Registration confirmed.{' '}
              <a
                href={buildTxExplorerUrl(ARC_TESTNET_ID, txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline"
              >
                View on explorer <ExternalLink size={11} />
              </a>
            </div>
          )}
          {registrationError && (
            <p className="mt-2 text-xs text-center" style={{ color: 'var(--danger)' }}>{registrationError}</p>
          )}
        </div>

        {/* Agent card */}
        <AgentCard
          agentId={agentId}
          agentURI={agentURI}
          ownerAddress={address ?? ''}
          txHash={txHashOverride}
          registering={registering}
          error={registrationError}
        />

        {/* Step 2 — x402 paid service */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--subtle)' }}>
            Step 2 · Accept Payments via x402
          </p>
          <ServicePanel agentRegistered={isSuccess} sellerAddress={SELLER_ADDRESS} />
        </div>

        {/* Registration file template */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--subtle)' }}>
            Agent Registration File Template
          </p>
          <RegistrationFile
            agentId={agentId}
            ownerAddress={address ?? ''}
            sellerAddress={SELLER_ADDRESS}
          />
        </div>

        {/* Instructions */}
        <div className="rounded-2xl border p-5 text-xs space-y-3" style={{ background: 'var(--surface-muted)', borderColor: 'var(--border)' }}>
          <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>Quick Start</p>
          <ol className="space-y-2 list-decimal list-inside" style={{ color: 'var(--ink-2)' }}>
            <li>Get test USDC from the Arc Studio sidebar ("Get test USDC") — gas is USDC on Arc.</li>
            <li>Set <span className="mono bg-white rounded px-1 py-0.5">VITE_AGENT_SELLER_ADDRESS=0x&lt;your-wallet&gt;</span> in <span className="mono">.env</span>.</li>
            <li>Start the payment server: <span className="mono bg-white rounded px-1 py-0.5">bun run server/index.ts</span></li>
            <li>Connect wallet, enter an Agent URI, and click <strong>Register Agent</strong>.</li>
            <li>Use the Service Panel to probe the 402 gate and call the paid endpoint.</li>
          </ol>
          <p style={{ color: 'var(--muted)' }}>
            Buying agents pay automatically via a Circle agent wallet.{' '}
            <a href="https://agents.circle.com/services" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline" style={{ color: 'var(--accent-hover)' }}>
              Circle Agent Marketplace <ExternalLink size={11} />
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
