import { useState } from 'react'
import { Zap, Terminal, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface ServicePanelProps {
  agentRegistered: boolean
  sellerAddress: string
}

type CallState = 'idle' | 'pending' | 'success' | 'error'

interface ServiceResult {
  summary: string
  paidAt: string
}

export function ServicePanel({ agentRegistered, sellerAddress }: ServicePanelProps) {
  const [topic, setTopic] = useState('')
  const [callState, setCallState] = useState<CallState>('idle')
  const [result, setResult] = useState<ServiceResult | null>(null)
  const [probeResult, setProbeResult] = useState<string | null>(null)
  const [probing, setProbing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const probe402 = async () => {
    setProbing(true)
    setProbeResult(null)
    try {
      const r = await fetch('/api/summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: 'probe' }) })
      if (r.status === 402) {
        const body = await r.json().catch(() => ({})) as { accepts?: string[] }
        setProbeResult('402 Payment Required — server is live. Accepts: ' + JSON.stringify(body.accepts ?? []))
      } else {
        setProbeResult(`Unexpected status ${r.status} — ensure VITE_AGENT_SELLER_ADDRESS is set and the server is running.`)
      }
    } catch {
      setProbeResult('Could not reach /api/summarize. Is the payment server running? Check the terminal.')
    } finally {
      setProbing(false)
    }
  }

  const callService = async () => {
    if (!topic.trim()) return
    setCallState('pending')
    setResult(null)
    setErrorMsg('')
    try {
      // In a real scenario the caller uses a Circle agent wallet + x402 headers.
      // Here we call directly to show the 402 flow from the UI.
      const r = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })
      if (r.status === 402) {
        setCallState('error')
        setErrorMsg('402 Payment Required — this endpoint charges $0.01 per call. A Circle agent wallet with Gateway balance would pay automatically via x402 headers.')
        return
      }
      if (!r.ok) {
        throw new Error(`HTTP ${r.status}`)
      }
      const data = await r.json() as ServiceResult
      setResult(data)
      setCallState('success')
    } catch (e: unknown) {
      setCallState('error')
      setErrorMsg(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  return (
    <div className="rounded-2xl border space-y-0 overflow-hidden" style={{ background: 'var(--surface-strong)', borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-muted)' }}>
            <Zap size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold display" style={{ color: 'var(--ink)' }}>Paid API · x402 Nanopayments</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>$0.01 USDC per call · Circle Gateway</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full" style={{ background: agentRegistered ? '#d1fae5' : 'var(--surface-muted)', color: agentRegistered ? 'var(--success)' : 'var(--muted)' }}>
            <CheckCircle2 size={12} />
            {agentRegistered ? 'Agent live' : 'Register first'}
          </div>
        </div>
      </div>

      {/* Seller address */}
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--subtle)' }}>Seller address</span>
        <span className="mono text-xs" style={{ color: sellerAddress ? 'var(--ink)' : 'var(--muted)' }}>
          {sellerAddress ? `${sellerAddress.slice(0, 8)}…${sellerAddress.slice(-6)}` : 'Set VITE_AGENT_SELLER_ADDRESS in .env'}
        </span>
      </div>

      {/* 402 probe */}
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>Step 1 — Verify 402 gate</span>
          <button
            onClick={() => { void probe402() }}
            disabled={probing}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: 'var(--border-strong)', color: 'var(--ink)', background: 'var(--surface-muted)' }}
          >
            {probing ? <Loader2 size={12} className="animate-spin" /> : <Terminal size={12} />}
            {probing ? 'Probing…' : 'Send unpaid request'}
          </button>
        </div>
        {probeResult && (
          <div className="mt-2 rounded-lg p-3 text-xs mono" style={{ background: probeResult.startsWith('402') ? '#f0fdf4' : '#fef2f2', color: probeResult.startsWith('402') ? 'var(--success)' : 'var(--danger)' }}>
            {probeResult}
          </div>
        )}
      </div>

      {/* Call service */}
      <div className="px-5 py-4">
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--ink-2)' }}>Step 2 — Call paid endpoint</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Arc Testnet governance proposals"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void callService() }}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm border outline-none focus:ring-2"
            style={{ background: 'var(--surface-muted)', borderColor: 'var(--border)', color: 'var(--ink)', '--tw-ring-color': 'var(--focus)' } as React.CSSProperties}
          />
          <button
            onClick={() => { void callService() }}
            disabled={callState === 'pending' || !topic.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
          >
            {callState === 'pending' ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            {callState === 'pending' ? 'Calling…' : 'Call'}
          </button>
        </div>

        {callState === 'error' && (
          <div className="mt-3 flex items-start gap-2 rounded-xl p-3 text-xs" style={{ background: '#fef2f2', color: 'var(--danger)' }}>
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {callState === 'success' && result && (
          <div className="mt-3 rounded-xl p-4 text-xs space-y-2" style={{ background: '#f0fdf4', borderColor: 'var(--success)' }}>
            <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--success)' }}>
              <CheckCircle2 size={13} />
              Paid · 200 OK
              <a
                href="https://agents.circle.com/services"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 font-medium hover:underline"
                style={{ color: 'var(--success)' }}
              >
                Circle Marketplace <ExternalLink size={11} />
              </a>
            </div>
            <p style={{ color: 'var(--ink-2)' }}>{result.summary}</p>
            <p className="mono" style={{ color: 'var(--muted)' }}>Paid at: {result.paidAt}</p>
          </div>
        )}
      </div>
    </div>
  )
}
