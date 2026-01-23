# PRD: BuilderX - Incentivized Bridge Aggregator

## End State

- [ ] Users can view real-time DeFi opportunities across Ethereum and Stacks
- [ ] Users can bridge USDC from Ethereum to Stacks with Circle xReserve
- [ ] Users receive $BXR token rewards for bridging
- [ ] Users can auto-deploy bridged assets to highest-yield protocols
- [ ] Users can track rewards, rankings, and referrals in dashboard
- [ ] Leaderboard displays top bridgers with competitive rankings
- [ ] Smart contracts manage rewards, vesting, and positions on Stacks

## Tasks

### Database Schema [db]

Database tables for storing user positions, rewards, and protocol data.

**Verification:**

- Users table exists with wallet address, total bridged, rank
- Bridges table with amount, timestamp, eth tx hash, auto-deploy flag, target protocol
- Rewards table with user, amount, type (base/bonus/referral), vesting schedule
- Protocols table with name, chain, current APY, risk score, TVL
- Referrals table tracking referrer-referee relationships
- All foreign keys properly reference parent tables
- Indexes on frequently queried fields (user wallet, timestamp)

### APY Scanner Service [api]

Backend service that fetches and aggregates real-time yield data from multiple DeFi protocols.

**Verification:**

- Service fetches Ethereum protocol rates (Aave, Compound, etc.)
- Service fetches Stacks protocol rates (ALEX, Arkadiko, Stackswap, Velar)
- Calculates total APY including bridge bonus rewards
- Updates data every 30 seconds automatically
- GET /api/opportunities returns sorted array of opportunities
- Each opportunity includes: protocol name, chain, APY, risk score, TVL
- Service handles API failures gracefully with fallback data
- Response time under 500ms

### Opportunity Scanner UI [ui]

Real-time display of best yield opportunities across chains.

**Verification:**

- Grid displays opportunity cards with protocol name, APY, chain, risk score
- Cards show yield spread calculation (Stacks APY - Ethereum APY)
- Highlight spreads >2% with visual indicator
- Auto-refresh every 30 seconds without page reload
- Earnings calculator shows projections (daily/monthly/yearly) based on input amount
- Filter by chain (All/Ethereum/Stacks)
- Sort by APY, risk score, or TVL
- Loading states during data fetch
- Mobile responsive layout

### Bridge Smart Contract [smart-contract]

Clarity smart contract managing bridge transactions and reward calculations on Stacks.

**Verification:**

- Contract deployed to Stacks testnet
- register-bridge function accepts: user principal, amount, eth-tx-hash, auto-deploy bool, target-protocol, optional referrer
- Calculates base rewards: 0.75% of bridged amount in $BXR
- Applies auto-deploy bonus: +30% if auto-deploy is true
- Applies referral bonus: +10% to both referrer and referee
- Calculates volume multiplier based on user's total bridged amount (1x/1.5x/2x/3x tiers)
- Stores position with 90-day linear vesting schedule
- get-user-position returns complete user stats
- get-global-stats returns TVL, total users, total rewards distributed
- Emit events for bridge registration

### Rewards Claim Function [smart-contract]

Smart contract function for users to claim vested rewards.

**Verification:**

- claim-rewards function accessible by any user
- Calculates vested amount based on time elapsed (90-day linear)
- Only allows claiming vested portion, not full amount
- Updates user's claimed balance
- Transfers $BXR tokens to user wallet
- Prevents claiming more than vested
- Emits claim event with amount
- Returns error if no rewards to claim

### Enhanced Bridge Form [ui]

User interface for bridging USDC with integrated wallet connection and reward preview.

**Verification:**

- Input field for USDC amount with validation
- Connect wallet buttons for MetaMask (Ethereum) and Leather (Stacks)
- Displays both wallet addresses when connected
- Protocol selector dropdown showing opportunities from scanner
- Auto-deploy toggle (ON by default) with bonus indicator
- Referral code input field (optional)
- Real-time rewards preview showing: base rewards, bonuses, multiplier, total $BXR
- Estimated APY display combining DeFi yield + bridge bonus
- Approve button enables USDC spending on Ethereum
- Bridge button triggers xReserve attestation flow
- Loading states during approval and bridge transactions
- Success modal with transaction links (Sepolia + Stacks explorers)
- Error handling with clear messages

### Circle xReserve Integration [api]

Backend integration with Circle's xReserve protocol for secure bridging.

**Verification:**

- POST /api/bridge/initiate accepts amount, target protocol, auto-deploy flag
- Calls Circle attestation service to verify Ethereum deposit
- Monitors xReserve events for deposit confirmation
- Triggers register-bridge smart contract call after attestation
- If auto-deploy is true, executes deployment to target protocol
- Returns transaction hashes for both Ethereum and Stacks
- Handles attestation failures with retry logic
- Stores bridge record in database
- Logs all steps for audit trail

### Rewards Dashboard [ui]

Comprehensive display of user rewards, stats, and vesting schedule.

**Verification:**

- Shows unclaimed rewards with claim button
- Displays total earned (lifetime)
- Shows current leaderboard rank with position indicator
- Displays active multiplier tier and progress to next tier
- Shows referral stats: friends referred, referral earnings
- Vesting schedule chart showing unlock timeline over 90 days
- Transaction history table with date, amount, type, status
- Refresh button to update stats
- Claim button triggers smart contract claim function
- Success toast on successful claim
- Updates balance after claim

### Leaderboard System [functional]

Public rankings of top bridgers with competitive display.

**Verification:**

- GET /api/leaderboard returns top 100 users sorted by total bridged
- Each entry includes: rank, wallet address (truncated), total bridged, rewards earned
- Real-time updates every 30 seconds
- Trophy badges for top 3 positions (gold, silver, bronze)
- Current user's position highlighted if in top 100
- "Your Rank" section shows position even if outside top 100
- Filter by timeframe (All time/30 days/7 days)
- Pagination for positions beyond 100
- Mobile responsive table

### $BXR Token Contract [smart-contract]

Fungible token contract for BuilderX rewards on Stacks.

**Verification:**

- SIP-010 compliant fungible token contract deployed
- Token name: BuilderX Token
- Token symbol: BXR
- Initial supply minted to platform treasury
- transfer function works correctly
- get-balance returns user balance
- Platform contract can mint rewards to users
- Tradeable on Stacks DEXs
- Metadata includes token icon and description

### Referral System [functional]

Track and reward user referrals for network growth.

**Verification:**

- User can generate unique referral code
- Referral code stored in database linked to user wallet
- New user can enter referral code during first bridge
- System validates referral code exists
- Both referrer and referee receive +10% bonus on transaction
- Referral relationships stored in database
- Dashboard shows: total referrals, total referral earnings
- Prevents self-referral
- Referral bonuses included in vesting schedule

### Volume Multiplier System [functional]

Tiered reward multipliers based on user's total bridged volume.

**Verification:**

- Tier 1 (1.0x): $0 - $1,000 total bridged
- Tier 2 (1.5x): $1,000 - $10,000 total bridged
- Tier 3 (2.0x): $10,000 - $50,000 total bridged
- Tier 4 (3.0x): $50,000+ total bridged
- System calculates tier based on cumulative bridges
- Multiplier applies to current transaction's rewards
- Dashboard shows current tier and progress to next
- Progress bar displays percentage to next tier
- Multiplier updates automatically on each bridge

### Auto-Deploy Integration [functional]

Automated deployment of bridged assets to selected DeFi protocol.

**Verification:**

- Integration with ALEX protocol for liquidity provision
- Integration with Arkadiko for stablecoin vaults
- Integration with Stackswap for staking pools
- Auto-deploy executes in same transaction as bridge completion
- User receives LP tokens or vault shares immediately
- Transaction includes both bridge and deployment in receipt
- Fallback to manual deployment if auto-deploy fails
- Clear error messages if protocol interaction fails
- Verification that assets arrived in target protocol

### Transaction Explorer Links [ui]

Provide users with direct links to view transactions on block explorers.

**Verification:**

- Ethereum transaction links to Sepolia Etherscan
- Stacks transaction links to Stacks Explorer
- Links open in new tab
- Links include correct transaction hash
- Links displayed in success modal after bridge
- Links stored in transaction history
- Copy transaction hash button
- Visual indicator showing transaction status (pending/confirmed)

### Global Statistics API [api]

Endpoint providing ecosystem-wide metrics for BuilderX platform.

**Verification:**

- GET /api/stats returns global metrics
- Metrics include: total value locked (TVL), total users, total bridges, total rewards distributed
- Historical data for TVL over time (30-day chart)
- Average bridge size calculation
- Most popular target protocols
- Chain distribution (Ethereum → Stacks volume)
- Response includes timestamp for cache management
- Data updates every 5 minutes

### Admin Dashboard [ui]

Internal dashboard for monitoring platform health and managing protocols.

**Verification:**

- Requires admin authentication
- Displays real-time platform metrics
- Shows recent bridge transactions
- Protocol management: add/edit/remove protocols from scanner
- Manual APY override for protocols with API issues
- User management: view user stats, resolve issues
- Reward distribution monitoring
- Smart contract interaction panel
- Export data to CSV functionality

## Context

### Patterns

- React components: Use functional components with hooks
- API routes: RESTful design, `/api/` prefix
- Smart contracts: Follow Clarity best practices, use descriptive function names
- State management: Use React Context for global state (wallet, user data)
- Error handling: Try-catch with user-friendly messages
- Wallet integration: MetaMask for Ethereum, Leather for Stacks

### Key Files

- `contracts/liquidity-rewards.clar` - Main rewards contract
- `contracts/bxr-token.clar` - Token contract
- `src/services/apy-scanner.ts` - APY fetching service
- `src/services/contract-service.ts` - Smart contract interaction
- `src/services/xreserve-service.ts` - Circle integration
- `src/components/OpportunityScanner.tsx` - Opportunities display
- `src/components/EnhancedBridgeForm.tsx` - Bridge interface
- `src/components/RewardsDashboard.tsx` - User dashboard
- `src/components/Leaderboard.tsx` - Rankings display

### Non-Goals

- OAuth/social login (wallet-only authentication)
- Mobile native apps (web-responsive only for now)
- Support for chains other than Ethereum and Stacks
- Fiat on/off ramps
- Advanced trading features
- Governance DAO implementation (future roadmap)
- NFT rewards or gamification beyond leaderboard
- Advanced charting/analytics (basic stats only)
