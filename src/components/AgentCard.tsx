import { ExternalLink, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { buildTxExplorerUrl, buildAddressExplorerUrl } from '@/onchain-facts'

const ARC_TESTNET_ID = 5042002

interface AgentCardProps {
  agentId: bigint | null
  agentURI: string
  ownerAddress: string
  txHash: string | null
  registering: boolean
  error: string | null
}

export function AgentCard({ agentId, agentURI, ownerAddress, txHash, registering, error }: AgentCardProps) {
  const isRegistered = agentId !== null

  return (
    <div className="rounded-2xl border" style={{ background: 'var(--surface-strong)', borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold"
            style={{ background: 'var(--accent)' }}
          >
            A
          </div>
          <div>
            <p className="text-sm font-semibold display" style={{ color: 'var(--ink)' }}>Arc Research Agent</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>ERC-8004 Identity · Arc Testnet</p>
          </div>
          <div className="ml-auto">
            {isRegistered ? (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full" style={{ background: '#d1fae5', color: 'var(--success)' }}>
                <CheckCircle2 size={12} />
                Registered
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full" style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}>
                <Clock size={12} />
                Not registered
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {isRegistered && (
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--subtle)' }}>Agent ID</span>
            <span className="mono text-sm font-semibold" style={{ color: 'var(--ink)' }}>#{agentId.toString()}</span>
          </div>
        )}

        <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--subtle)' }}>Owner</span>
          <a
            href={buildAddressExplorerUrl(ARC_TESTNET_ID, ownerAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 mono text-xs hover:underline"
            style={{ color: 'var(--accent-hover)' }}
          >
            {ownerAddress.slice(0, 6)}…{ownerAddress.slice(-4)}
            <ExternalLink size={11} />
          </a>
        </div>

        <div className="flex items-start justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--subtle)' }}>Agent URI</span>
          <span className="mono text-xs max-w-[200px] truncate text-right" style={{ color: 'var(--muted)' }} title={agentURI}>{agentURI || '—'}</span>
        </div>

        {txHash && (
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--subtle)' }}>Tx</span>
            <a
              href={buildTxExplorerUrl(ARC_TESTNET_ID, txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 mono text-xs hover:underline"
              style={{ color: 'var(--accent-hover)' }}
            >
              {txHash.slice(0, 10)}…{txHash.slice(-6)}
              <ExternalLink size={11} />
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      {(registering || error) && (
        <div
          className="px-5 py-3 rounded-b-2xl flex items-center gap-2 text-xs"
          style={{ background: error ? '#fef2f2' : 'var(--surface-muted)', color: error ? 'var(--danger)' : 'var(--muted)' }}
        >
          {registering && <Loader2 size={13} className="animate-spin" />}
          {error && <AlertCircle size={13} />}
          {registering ? 'Registering on Arc Testnet…' : error}
        </div>
      )}
    </div>
  )
}
