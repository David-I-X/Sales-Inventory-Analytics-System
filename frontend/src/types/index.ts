export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'viewer';
  tenant_id: number;
  is_active: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Contact {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  whatsapp_id: string | null;
  funnel_stage: string;
  lead_score: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  tenant_id: number;
  contact_id: number;
  invoice_number: string;
  cufe: string | null;
  dian_status: string;
  subtotal: number;
  tax: number;
  total: number;
  line_items: LineItem[];
  dian_response: Record<string, unknown> | null;
  qr_url?: string | null;
  pdf_url?: string | null;
  issued_at: string;
  dian_responded_at: string | null;
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface MlAlert {
  id: number;
  alert_type: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  generated_at: string;
}

export interface LeadScoreItem {
  contact_id: number;
  name: string;
  phone: string | null;
  funnel_stage: string;
  score: number;
  probability_percentage: number;
  reason: string;
}

export interface DemandForecastItem {
  item_sku: string;
  item_name: string;
  current_stock: number;
  predicted_demand_14d: number;
  recommended_action: string;
  confidence_level: string;
}

export interface Tenant {
  id: number;
  name: string;
  schema_name: string;
  plan: string;
  webhook_url: string | null;
  webhook_secret: string | null;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unit_measure: string;
  sale_price: number;
  cost_price: number;
  current_stock: number;
  min_stock: number;
  is_active: boolean;
  stock_value: number;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  nit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contact_person: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PurchaseItem {
  product_id: number;
  sku?: string;
  name?: string;
  quantity: number;
  unit_cost: number;
  subtotal?: number;
}

export interface Purchase {
  id: number;
  supplier_id: number | null;
  supplier_name: string | null;
  purchase_number: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface InventoryMovement {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  movement_type: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  unit_cost: number;
  reference_type: string;
  reference_id: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface LowStockAlert {
  product_id: number;
  sku: string;
  name: string;
  current_stock: number;
  min_stock: number;
  deficit: number;
}

export interface InventoryDashboard {
  total_products: number;
  total_inventory_value: number;
  total_units_in_stock: number;
  low_stock_count: number;
  low_stock_items: LowStockAlert[];
  top_products_by_stock: Array<{
    sku: string;
    name: string;
    stock: number;
    unit_measure: string;
  }>;
}

export interface AccountingEntry {
  id: number;
  entry_type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  reference_type: string | null;
  reference_id: number | null;
  entry_date: string;
  created_by: string | null;
  created_at: string;
}

export interface DailyCashFlowItem {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdownItem {
  category: string;
  total: number;
  percentage: number;
  count: number;
}

export interface AccountingDashboard {
  current_month: string;
  month_income: number;
  month_expenses: number;
  month_net_profit: number;
  is_profitable: boolean;
  income_count: number;
  expense_count: number;
  daily_cash_flow: DailyCashFlowItem[];
  expenses_by_category: CategoryBreakdownItem[];
  recent_entries: AccountingEntry[];
}

export interface MonthlyPnL {
  month: string;
  gross_revenue: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  gross_margin_percentage: number;
  operating_expenses: number;
  net_operating_income: number;
  net_margin_percentage: number;
}
