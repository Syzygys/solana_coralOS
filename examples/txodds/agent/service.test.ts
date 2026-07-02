import { describe, expect, it } from 'vitest'
import { deliverService } from './service.js'

describe('deliverService — Web3 Yield Agent custom fork', () => {
  it('returns a bounty/grant opportunity brief without external calls', async () => {
    const raw = await deliverService(
      'opportunity Streamflow AGENT_ALLOWED Twitter thread bounty 500 USDC submit using credit',
    )
    const brief = JSON.parse(raw)
    expect(brief.service).toBe('web3-yield-opportunity-brief')
    expect(brief.classification).toBe('content')
    expect(brief.score).toBeGreaterThan(50)
    expect(brief.requiredHumanChecks).toContain('web form may consume platform credit')
    expect(brief.deliverables).toContain('reviewed submission draft')
  })
})
