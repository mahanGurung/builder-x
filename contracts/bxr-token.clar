;; BuilderX Token ($BXR) - SIP-010 Compliant Fungible Token
;; Rewards token for the BuilderX bridge incentive program
;; Minted on-demand when users claim vested rewards

;; ============ SIP-010 Trait ============
(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ============ Constants ============
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_NOT_TOKEN_OWNER (err u101))
(define-constant ERR_INSUFFICIENT_BALANCE (err u102))
(define-constant ERR_INVALID_AMOUNT (err u103))
(define-constant ERR_NOT_MINTER (err u104))

;; Token metadata
(define-constant TOKEN_NAME "BuilderX Token")
(define-constant TOKEN_SYMBOL "BXR")
(define-constant TOKEN_DECIMALS u6) ;; 6 decimals like USDC
(define-constant TOKEN_URI (some u"https://builderx.app/token/bxr.json"))

;; Max supply cap: 1 billion BXR (1,000,000,000 * 10^6)
(define-constant MAX_SUPPLY u1000000000000000)

;; ============ Data Variables ============
(define-data-var total-supply uint u0)
(define-data-var contract-paused bool false)

;; ============ Data Maps ============

;; Token balances
(define-map balances principal uint)

;; Allowances for delegated transfers
(define-map allowances 
  { owner: principal, spender: principal }
  uint
)

;; Authorized minters (liquidity-rewards contract can mint)
(define-map authorized-minters principal bool)

;; ============ SIP-010 Read-Only Functions ============

;; Get token name
(define-read-only (get-name)
  (ok TOKEN_NAME)
)

;; Get token symbol
(define-read-only (get-symbol)
  (ok TOKEN_SYMBOL)
)

;; Get token decimals
(define-read-only (get-decimals)
  (ok TOKEN_DECIMALS)
)

;; Get token URI (metadata)
(define-read-only (get-token-uri)
  (ok TOKEN_URI)
)

;; Get total supply
(define-read-only (get-total-supply)
  (ok (var-get total-supply))
)

;; Get balance of account
(define-read-only (get-balance (account principal))
  (ok (default-to u0 (map-get? balances account)))
)

;; ============ Additional Read-Only Functions ============

;; Check if address is authorized minter
(define-read-only (is-minter (address principal))
  (default-to false (map-get? authorized-minters address))
)

;; Get allowance
(define-read-only (get-allowance (owner principal) (spender principal))
  (default-to u0 (map-get? allowances { owner: owner, spender: spender }))
)

;; Check if contract is paused
(define-read-only (is-paused)
  (var-get contract-paused)
)

;; ============ SIP-010 Public Functions ============

;; Transfer tokens
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    ;; Check not paused
    (asserts! (not (var-get contract-paused)) ERR_UNAUTHORIZED)
    
    ;; Check sender is tx-sender or contract-caller
    (asserts! (or (is-eq sender tx-sender) (is-eq sender contract-caller)) ERR_NOT_TOKEN_OWNER)
    
    ;; Check valid amount
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    
    ;; Check sufficient balance
    (let ((sender-balance (default-to u0 (map-get? balances sender))))
      (asserts! (>= sender-balance amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Update balances
      (map-set balances sender (- sender-balance amount))
      (map-set balances recipient (+ (default-to u0 (map-get? balances recipient)) amount))
      
      ;; Print memo if provided
      (match memo
        m (print { event: "transfer", sender: sender, recipient: recipient, amount: amount, memo: m })
        (print { event: "transfer", sender: sender, recipient: recipient, amount: amount })
      )
      
      (ok true)
    )
  )
)

;; ============ Minting Functions ============

;; Mint tokens (only authorized minters or owner)
(define-public (mint (amount uint) (recipient principal))
  (begin
    ;; Check not paused
    (asserts! (not (var-get contract-paused)) ERR_UNAUTHORIZED)
    
    ;; Check caller is authorized minter or owner
    (asserts! (or 
      (is-eq tx-sender CONTRACT_OWNER)
      (is-eq contract-caller CONTRACT_OWNER)
      (is-minter tx-sender)
      (is-minter contract-caller)
    ) ERR_NOT_MINTER)
    
    ;; Check valid amount
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    
    ;; Check max supply not exceeded
    (asserts! (<= (+ (var-get total-supply) amount) MAX_SUPPLY) ERR_INVALID_AMOUNT)
    
    ;; Update total supply
    (var-set total-supply (+ (var-get total-supply) amount))
    
    ;; Credit recipient
    (map-set balances recipient (+ (default-to u0 (map-get? balances recipient)) amount))
    
    (print { 
      event: "mint", 
      recipient: recipient, 
      amount: amount,
      new-total-supply: (var-get total-supply)
    })
    
    (ok amount)
  )
)

;; Mint rewards (called by liquidity-rewards contract)
;; This is a convenience function for the rewards contract
(define-public (mint-rewards (amount uint) (recipient principal))
  (begin
    ;; Must be called by an authorized minter contract
    (asserts! (or (is-minter contract-caller) (is-minter tx-sender)) ERR_NOT_MINTER)
    
    ;; Delegate to mint
    (mint amount recipient)
  )
)

;; ============ Admin Functions ============

;; Add authorized minter (only owner)
(define-public (add-minter (minter principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (map-set authorized-minters minter true)
    
    (print { event: "minter-added", minter: minter })
    (ok true)
  )
)

;; Remove authorized minter (only owner)
(define-public (remove-minter (minter principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (map-delete authorized-minters minter)
    
    (print { event: "minter-removed", minter: minter })
    (ok true)
  )
)

;; Pause/unpause contract (only owner)
(define-public (set-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (var-set contract-paused paused)
    
    (print { event: "pause-toggled", paused: paused })
    (ok true)
  )
)

;; ============ Burn Functions ============

;; Burn tokens (from sender's balance)
(define-public (burn (amount uint))
  (let ((sender tx-sender))
    ;; Check valid amount
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    
    ;; Check sufficient balance
    (let ((sender-balance (default-to u0 (map-get? balances sender))))
      (asserts! (>= sender-balance amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Update balance and supply
      (map-set balances sender (- sender-balance amount))
      (var-set total-supply (- (var-get total-supply) amount))
      
      (print { 
        event: "burn", 
        burner: sender, 
        amount: amount,
        new-total-supply: (var-get total-supply)
      })
      
      (ok amount)
    )
  )
)
