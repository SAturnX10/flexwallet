// Flex Wallet — shared types (client-side)

export type AssetCategory = 'stablecoin' | 'tokenized-fund' | 'volatile' | 'local-currency'
export type AssetStatus = 'available' | 'receiving-only' | 'swap-unavailable' | 'insufficient-liquidity' | 'restricted' | 'unsupported'

export interface AssetDef {
  ticker: string
  name: string
  currency: string
  category: AssetCategory
  network: string
  issuer: string
  contractNote: string
  decimals: number
  canReceive: boolean
  canSend: boolean
  canConvert: boolean
  canSaveIn: boolean
  status: AssetStatus
  colorHex: string
  iconSymbol: string
  disclaimer?: string
}

export interface WalletSettings {
  address: string
  username: string | null
  username_claimed_at: number | null
  onboarded: boolean
  preferred_asset: string
  preferred_currency: string
  reduce_motion: boolean
  auto_convert: boolean
  auto_convert_settings: AutoConvertSettings
  sending_enabled: boolean
  per_send_limit: string
  daily_send_limit: string
  emergency_pause: boolean
  enabled_assets: string[]
  savings_settings: Record<string, unknown>
  number_format: string
  saved_recipients: SavedRecipient[]
}

export interface AutoConvertSettings {
  source_assets?: string[]
  dest_assets?: string[]
  min_amount?: string
  max_amount?: string
  daily_limit?: string
  max_slippage?: string
  min_output?: string
  max_price_impact?: string
  confirm_each?: boolean
  notify?: boolean
  pause_all?: boolean
}

export interface SavedRecipient {
  address: string
  username?: string
  label?: string
  last_used_at?: number
}

export interface SavingsGoal {
  id: string
  wallet_address: string
  name: string
  asset: string
  target_type: 'value' | 'quantity'
  target_amount: string
  current_amount: string
  source_assets: string[]
  min_contribution: string | null
  max_contribution: string | null
  daily_cap: string | null
  confirm_each: number
  status: 'active' | 'paused' | 'completed'
  completed_at: number | null
  created_at: number
  updated_at: number
  sort_order: number
}

export type TxType = 'received' | 'sent' | 'converted' | 'savings_contribution' | 'goal_completed' | 'failed' | 'cancelled'
export type TxStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled'

export interface Transaction {
  id: string
  wallet_address: string
  type: TxType
  asset: string
  amount: string
  usd_value: string | null
  fee: string | null
  fee_asset: string | null
  recipient: string | null
  recipient_username: string | null
  recipient_resolved: string | null
  sender: string | null
  sender_username: string | null
  received_via: string | null
  tx_hash: string | null
  status: TxStatus
  error_text: string | null
  goal_id: string | null
  quote_id: string | null
  quote_details: QuoteDetails | null
  idempotency_key: string | null
  created_at: number
  confirmed_at: number | null
}

export interface QuoteDetails {
  input_amount: string
  output_amount: string
  fee: string
  slippage: string
  price_impact: string
  route: string
  expires_at: number
  is_estimate: true
}

export interface PriceMap {
  [ticker: string]: { usd: number; source: 'demo' | 'live' }
}

export type NavPage = 'overview' | 'savings' | 'activity' | 'settings'

export interface ResolvedRecipient {
  address: string
  username: string | null
  displayName: string
}
