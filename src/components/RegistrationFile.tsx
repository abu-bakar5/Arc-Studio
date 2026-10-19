import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const ARC_TESTNET_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e'

interface RegistrationFileProps {
  agentId: bigint | null
  ownerAddress: string
  sellerAddress: string
}

export function RegistrationFile({ agentId, ownerAddress, sellerAddress }: RegistrationFileProps) {
  const [copied, setCopied] = useState(false)

  const registration = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: 'Arc Research Agent',
    description: 'Summarizes onchain data for a fee. Powered by Circle Gateway x402 Nanopayments on Arc Testnet.',
    services: [
      {
        name: 'summarize',
        endpoint: 'https://<your-domain>/api/summarize',
        version: '1.0.0',
      },
    ],
    x402Support: true,
    active: true,
    registrations: agentId !== null
      ? [{ agentId: Number(agentId), agentRegistry: `eip155:5042002:${ARC_TESTNET_REGISTRY}` }]
      : [],
    supportedTrust: ['reputation'],
    owner: ownerAddress || '<your-wallet-address>',
    sellerAddress: sellerAddress || '<VITE_AGENT_SELLER_ADDRESS>',
  }

  const json = JSON.stringify(registration, null, 2)

  const copy = async () => {
    await navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--surface-strong)', borderColor: 'var(--border)' }}>
      <div className="px-5 pt-5 pb-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="text-sm font-semibold display" style={{ color: 'var(--ink)' }}>Agent Registration File</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Host this JSON at a public URL (IPFS or HTTPS) and pass it to <span className="mono">register(agentURI)</span>
          </p>
        </div>
        <button
          onClick={() => { void copy() }}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
          style={{ borderColor: 'var(--border-strong)', color: 'var(--ink)', background: 'var(--surface-muted)' }}
        >
          {copied ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        className="overflow-x-auto px-5 py-4 text-xs mono leading-relaxed"
        style={{ color: 'var(--ink-2)', background: 'var(--surface-muted)', margin: 0 }}
      >
        {json}
      </pre>
    </div>
  )
}
