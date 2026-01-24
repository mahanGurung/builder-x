;; BuilderX Liquidity Rewards Contract
;; Manages bridge transaction registration, reward calculations, and vesting schedules
;; Designed for the USDCx on Stacks ecosystem

;; ============ Constants ============
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_INVALID_AMOUNT (err u101))
(define-constant ERR_USER_NOT_FOUND (err u102))
(define-constant ERR_ALREADY_REGISTERED (err u103))
(define-constant ERR_NO_REWARDS (err u104))
(define-constant ERR_VESTING_NOT_STARTED (err u105))
(define-constant ERR_SELF_REFERRAL (err u106))
(define-constant ERR_INVALID_REFERRER (err u107))
(define-constant ERR_MINT_FAILED (err u108))

;; Reward rates (in basis points, 10000 = 100%)
(define-constant BASE_REWARD_RATE u75) ;; 0.75% base rewards
(define-constant AUTO_DEPLOY_BONUS u30) ;; +30% bonus for auto-deploy
(define-constant REFERRAL_BONUS u10) ;; +10% for referrals (both parties)

;; Vesting period in blocks (~90 days at ~10 min/block = 12960 blocks)
(define-constant VESTING_PERIOD u12960)

;; Volume multiplier tiers (in micro USDC, 6 decimals)
(define-constant TIER_1_THRESHOLD u0) ;; $0+
(define-constant TIER_2_THRESHOLD u1000000000) ;; $1,000
(define-constant TIER_3_THRESHOLD u10000000000) ;; $10,000  
(define-constant TIER_4_THRESHOLD u50000000000) ;; $50,000

;; Multipliers (100 = 1x, 150 = 1.5x, etc.)
(define-constant TIER_1_MULTIPLIER u100)
(define-constant TIER_2_MULTIPLIER u150)
(define-constant TIER_3_MULTIPLIER u200)
(define-constant TIER_4_MULTIPLIER u300)

;; ============ Data Variables ============
(define-data-var total-tvl uint u0)
(define-data-var total-users uint u0)
(define-data-var total-bridges uint u0)
(define-data-var total-rewards-distributed uint u0)

;; ============ Data Maps ============

;; User position tracking
(define-map user-positions
  principal
  {
    total-bridged: uint,
    total-rewards: uint,
    claimed-rewards: uint,
    vesting-start: uint,
    last-bridge-block: uint,
    referral-count: uint,
    referral-earnings: uint
  }
)

;; Bridge transaction records
(define-map bridge-records
  { user: principal, tx-index: uint }
  {
    amount: uint,
    eth-tx-hash: (buff 32),
    auto-deploy: bool,
    target-protocol: (string-ascii 64),
    block-height: uint,
    rewards-earned: uint
  }
)

;; User bridge count tracker
(define-map user-bridge-count principal uint)

;; Referral relationships
(define-map referrals
  principal ;; referee
  principal ;; referrer
)

;; Referral codes (simple mapping from code to principal)
(define-map referral-codes
  (string-ascii 16)
  principal
)

;; User's referral code
(define-map user-referral-codes
  principal
  (string-ascii 16)
)

;; ============ Read-Only Functions ============

;; Get user's volume multiplier tier
(define-read-only (get-multiplier-tier (total-bridged uint))
  (if (>= total-bridged TIER_4_THRESHOLD)
    { tier: u4, multiplier: TIER_4_MULTIPLIER }
    (if (>= total-bridged TIER_3_THRESHOLD)
      { tier: u3, multiplier: TIER_3_MULTIPLIER }
      (if (>= total-bridged TIER_2_THRESHOLD)
        { tier: u2, multiplier: TIER_2_MULTIPLIER }
        { tier: u1, multiplier: TIER_1_MULTIPLIER }
      )
    )
  )
)

;; Calculate rewards for a bridge transaction
(define-read-only (calculate-rewards 
  (amount uint) 
  (auto-deploy bool) 
  (has-referral bool)
  (user-total-bridged uint))
  (let (
    ;; Base rewards: 0.75% of amount
    (base-rewards (/ (* amount BASE_REWARD_RATE) u10000))
    
    ;; Auto-deploy bonus: +30% of base
    (auto-deploy-rewards (if auto-deploy
      (/ (* base-rewards AUTO_DEPLOY_BONUS) u100)
      u0))
    
    ;; Referral bonus: +10% of base
    (referral-rewards (if has-referral
      (/ (* base-rewards REFERRAL_BONUS) u100)
      u0))
    
    ;; Get volume multiplier
    (multiplier-info (get-multiplier-tier user-total-bridged))
    (multiplier (get multiplier multiplier-info))
    
    ;; Total before multiplier
    (subtotal (+ base-rewards auto-deploy-rewards referral-rewards))
    
    ;; Apply multiplier
    (total-rewards (/ (* subtotal multiplier) u100))
  )
    {
      base: base-rewards,
      auto-deploy-bonus: auto-deploy-rewards,
      referral-bonus: referral-rewards,
      multiplier: multiplier,
      total: total-rewards
    }
  )
)

;; Get vested amount for a user
(define-read-only (get-vested-amount (user principal))
  (match (map-get? user-positions user)
    position
    (let (
      (vesting-start (get vesting-start position))
      (total-rewards (get total-rewards position))
      (claimed (get claimed-rewards position))
      (blocks-elapsed (- block-height vesting-start))
    )
      (if (is-eq vesting-start u0)
        u0
        (if (>= blocks-elapsed VESTING_PERIOD)
          ;; Fully vested
          (- total-rewards claimed)
          ;; Partially vested (linear)
          (let (
            (vested-portion (/ (* total-rewards blocks-elapsed) VESTING_PERIOD))
          )
            (if (> vested-portion claimed)
              (- vested-portion claimed)
              u0
            )
          )
        )
      )
    )
    u0
  )
)

;; Get user position
(define-read-only (get-user-position (user principal))
  (match (map-get? user-positions user)
    position
    (let (
      (multiplier-info (get-multiplier-tier (get total-bridged position)))
      (vested (get-vested-amount user))
    )
      (ok {
        total-bridged: (get total-bridged position),
        total-rewards: (get total-rewards position),
        claimed-rewards: (get claimed-rewards position),
        vested-claimable: vested,
        vesting-start: (get vesting-start position),
        current-tier: (get tier multiplier-info),
        current-multiplier: (get multiplier multiplier-info),
        referral-count: (get referral-count position),
        referral-earnings: (get referral-earnings position),
        bridge-count: (default-to u0 (map-get? user-bridge-count user))
      })
    )
    ERR_USER_NOT_FOUND
  )
)

;; Get global stats
(define-read-only (get-global-stats)
  {
    total-tvl: (var-get total-tvl),
    total-users: (var-get total-users),
    total-bridges: (var-get total-bridges),
    total-rewards-distributed: (var-get total-rewards-distributed)
  }
)

;; Get referrer for a user
(define-read-only (get-referrer (user principal))
  (map-get? referrals user)
)

;; Get user's referral code
(define-read-only (get-user-referral-code (user principal))
  (map-get? user-referral-codes user)
)

;; Lookup referral code
(define-read-only (lookup-referral-code (code (string-ascii 16)))
  (map-get? referral-codes code)
)

;; ============ Public Functions ============

;; Register a bridge transaction
(define-public (register-bridge
  (amount uint)
  (eth-tx-hash (buff 32))
  (auto-deploy bool)
  (target-protocol (string-ascii 64))
  (referrer-code (optional (string-ascii 16))))
  
  (let (
    (user tx-sender)
    (existing-position (map-get? user-positions user))
    (current-bridge-count (default-to u0 (map-get? user-bridge-count user)))
    (user-total-bridged (match existing-position pos (get total-bridged pos) u0))
    
    ;; Resolve referrer from code
    (referrer-principal (match referrer-code
      code (lookup-referral-code code)
      none))
    
    ;; Check if user has referral (and it's not self-referral)
    (has-valid-referral (match referrer-principal
      ref (and (not (is-eq ref user)) (is-some (map-get? user-positions ref)))
      false))
    
    ;; Calculate rewards
    (reward-calc (calculate-rewards amount auto-deploy has-valid-referral user-total-bridged))
    (total-rewards (get total reward-calc))
  )
    ;; Validate amount
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    
    ;; Update or create user position
    (if (is-some existing-position)
      ;; Update existing position
      (map-set user-positions user
        (merge (unwrap-panic existing-position)
          {
            total-bridged: (+ user-total-bridged amount),
            total-rewards: (+ (get total-rewards (unwrap-panic existing-position)) total-rewards),
            last-bridge-block: block-height
          }
        )
      )
      ;; Create new position
      (begin
        (map-set user-positions user
          {
            total-bridged: amount,
            total-rewards: total-rewards,
            claimed-rewards: u0,
            vesting-start: block-height,
            last-bridge-block: block-height,
            referral-count: u0,
            referral-earnings: u0
          }
        )
        (var-set total-users (+ (var-get total-users) u1))
      )
    )
    
    ;; Store bridge record
    (map-set bridge-records
      { user: user, tx-index: current-bridge-count }
      {
        amount: amount,
        eth-tx-hash: eth-tx-hash,
        auto-deploy: auto-deploy,
        target-protocol: target-protocol,
        block-height: block-height,
        rewards-earned: total-rewards
      }
    )
    
    ;; Update bridge count
    (map-set user-bridge-count user (+ current-bridge-count u1))
    
    ;; Handle referral if valid
    (if has-valid-referral
      (let (
        (ref (unwrap-panic referrer-principal))
        (referral-bonus (get referral-bonus reward-calc))
        (referrer-position (unwrap-panic (map-get? user-positions ref)))
      )
        ;; Set referral relationship (only on first bridge)
        (if (is-none (map-get? referrals user))
          (map-set referrals user ref)
          true
        )
        
        ;; Credit referrer
        (map-set user-positions ref
          (merge referrer-position
            {
              total-rewards: (+ (get total-rewards referrer-position) referral-bonus),
              referral-count: (+ (get referral-count referrer-position) u1),
              referral-earnings: (+ (get referral-earnings referrer-position) referral-bonus)
            }
          )
        )
        
        ;; Update total rewards
        (var-set total-rewards-distributed (+ (var-get total-rewards-distributed) referral-bonus))
      )
      true
    )
    
    ;; Update global stats
    (var-set total-tvl (+ (var-get total-tvl) amount))
    (var-set total-bridges (+ (var-get total-bridges) u1))
    (var-set total-rewards-distributed (+ (var-get total-rewards-distributed) total-rewards))
    
    ;; Emit event via print
    (print {
      event: "bridge-registered",
      user: user,
      amount: amount,
      rewards: total-rewards,
      auto-deploy: auto-deploy,
      target-protocol: target-protocol,
      eth-tx-hash: eth-tx-hash
    })
    
    (ok {
      bridge-index: current-bridge-count,
      rewards-earned: total-rewards,
      reward-breakdown: reward-calc
    })
  )
)

;; Generate a referral code for the user
(define-public (generate-referral-code (code (string-ascii 16)))
  (let ((user tx-sender))
    ;; Check user has a position (has bridged before)
    (asserts! (is-some (map-get? user-positions user)) ERR_USER_NOT_FOUND)
    
    ;; Check code isn't already taken
    (asserts! (is-none (map-get? referral-codes code)) ERR_ALREADY_REGISTERED)
    
    ;; Check user doesn't already have a code
    (asserts! (is-none (map-get? user-referral-codes user)) ERR_ALREADY_REGISTERED)
    
    ;; Register the code
    (map-set referral-codes code user)
    (map-set user-referral-codes user code)
    
    (print {
      event: "referral-code-generated",
      user: user,
      code: code
    })
    
    (ok code)
  )
)

;; Claim vested rewards - mints BXR tokens to user
(define-public (claim-rewards)
  (let (
    (user tx-sender)
    (vested-amount (get-vested-amount user))
  )
    ;; Check user exists
    (asserts! (is-some (map-get? user-positions user)) ERR_USER_NOT_FOUND)
    
    ;; Check there are rewards to claim
    (asserts! (> vested-amount u0) ERR_NO_REWARDS)
    
    (let ((position (unwrap-panic (map-get? user-positions user))))
      ;; Update claimed amount FIRST (checks-effects-interactions pattern)
      (map-set user-positions user
        (merge position
          { claimed-rewards: (+ (get claimed-rewards position) vested-amount) }
        )
      )
      
      ;; Mint BXR tokens to user via the token contract
      ;; The liquidity-rewards contract must be an authorized minter on the BXR contract
      (match (as-contract (contract-call? .bxr-token mint-rewards vested-amount user))
        success
        (begin
          ;; Emit claim event
          (print {
            event: "rewards-claimed",
            user: user,
            amount: vested-amount,
            token: "BXR"
          })
          (ok vested-amount)
        )
        error
        (begin
          ;; Revert the claimed amount update on mint failure
          (map-set user-positions user position)
          ERR_MINT_FAILED
        )
      )
    )
  )
)

;; Claim rewards for another user (admin/relayer function)
;; Useful for gas-less claims where a relayer pays the transaction fee
(define-public (claim-rewards-for (user principal))
  (let (
    (vested-amount (get-vested-amount user))
  )
    ;; Only owner can claim for others
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    
    ;; Check user exists
    (asserts! (is-some (map-get? user-positions user)) ERR_USER_NOT_FOUND)
    
    ;; Check there are rewards to claim
    (asserts! (> vested-amount u0) ERR_NO_REWARDS)
    
    (let ((position (unwrap-panic (map-get? user-positions user))))
      ;; Update claimed amount
      (map-set user-positions user
        (merge position
          { claimed-rewards: (+ (get claimed-rewards position) vested-amount) }
        )
      )
      
      ;; Mint BXR tokens to user
      (match (as-contract (contract-call? .bxr-token mint-rewards vested-amount user))
        success
        (begin
          (print {
            event: "rewards-claimed-for",
            user: user,
            claimer: tx-sender,
            amount: vested-amount,
            token: "BXR"
          })
          (ok vested-amount)
        )
        error
        (begin
          (map-set user-positions user position)
          ERR_MINT_FAILED
        )
      )
    )
  )
)

;; ============ Admin Functions ============

;; Emergency pause (future implementation)
(define-public (set-contract-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    ;; Implementation would go here
    (ok true)
  )
)
