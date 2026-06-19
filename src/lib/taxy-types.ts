// Categories. `scope` controls which tab they appear under in the Transactions log:
//  - "daily"  → entered on the Daily sheet (per-transaction ledger items)
//  - "yearly" → entered on the Variables sheet (year-end totals & adjustments)
export const CATEGORIES = [
  // ============ DAILY (from "Daily" sheet) ============
  { code: "CASH", label: "Cash sales (gross, pre-VAT)", group: "INCOME", scope: "daily", desc: "Total gross income (Before VAT)" },
  { code: "BANK", label: "Bank receipts (gross, pre-VAT)", group: "INCOME", scope: "daily", desc: "Total gross income (Before VAT)" },
  { code: "INV", label: "Invoiced sales (gross, pre-VAT)", group: "INCOME", scope: "daily", desc: "Total gross income (Before VAT)" },
  { code: "VAT_OUT", label: "VAT collected", group: "INCOME", scope: "daily", desc: "VAT collected (if registered)" },
  { code: "MATERIALS", label: "Materials / supplies", group: "PURCHASES", scope: "daily", desc: "Materials and direct supplies" },
  { code: "SUBCON_RCT", label: "Subcontractors (RCT)", group: "PURCHASES", scope: "daily", desc: "Payments to subcontractors" },
  { code: "SUBCON_OTHER", label: "Subcontractors (other)", group: "PURCHASES", scope: "daily", desc: "Payments to other subcontractors" },
  { code: "VAT_IN", label: "VAT paid (input)", group: "PURCHASES", scope: "daily", desc: "VAT on purchases (if registered)" },
  { code: "WAGES", label: "Wages & salaries", group: "OVERHEADS", scope: "daily", desc: "Gross payroll (excl. owner)" },
  { code: "RENT", label: "Rent", group: "OVERHEADS", scope: "daily", desc: "Premises rent" },
  { code: "RATES", label: "Rates", group: "OVERHEADS", scope: "daily", desc: "Local rates" },
  { code: "HEAT_LIGHT", label: "Heat & light / other bills", group: "OVERHEADS", scope: "daily", desc: "Electricity, gas, oil" },
  { code: "TELEPHONE", label: "Telephone", group: "OVERHEADS", scope: "daily", desc: "Business phone" },
  { code: "INTERNET", label: "Internet", group: "OVERHEADS", scope: "daily", desc: "Business broadband" },
  { code: "POSTAGE", label: "Postage & stationery", group: "OVERHEADS", scope: "daily", desc: "Postage, printing, stationery" },
  { code: "SOFTWARE", label: "Software & subscriptions", group: "OVERHEADS", scope: "daily", desc: "SaaS, licenses, subscriptions" },
  { code: "ADVERT", label: "Advertising", group: "OVERHEADS", scope: "daily", desc: "Marketing and website costs" },
  { code: "MOTOR", label: "Motor", group: "OVERHEADS", scope: "daily", desc: "Business motor costs" },
  { code: "TRAVEL_SUB", label: "Travel & subsistence", group: "OVERHEADS", scope: "daily", desc: "Business travel" },
  { code: "REPAIRS", label: "Repairs / tools", group: "OVERHEADS", scope: "daily", desc: "Small tools and maintenance" },
  { code: "PROF_FEES", label: "Professional fees", group: "OVERHEADS", scope: "daily", desc: "Accountancy and legal fees" },
  { code: "BANK_FEES", label: "Bank fees & loan interest", group: "OVERHEADS", scope: "daily", desc: "Bank fees and loan interest" },
  { code: "SUNDRY", label: "Sundry / other", group: "OVERHEADS", scope: "daily", desc: "All other allowable expenses" },
  { code: "DRAWINGS", label: "Drawings (owner)", group: "ADJUSTMENT", scope: "both", desc: "Owner drawings (Non-deductible)" },

  // ============ YEARLY (from "Variables" sheet) ============
  // Other income
  { code: "GRANTS", label: "Grants received", group: "INCOME", scope: "yearly", desc: "Grants, gov payments, SEISS, etc." },
  { code: "GOV_INCOME", label: "Government income", group: "INCOME", scope: "yearly", desc: "Other government income" },
  { code: "INTEREST_RECVD", label: "Interest received", group: "INCOME", scope: "yearly", desc: "Bank/deposit interest received" },
  { code: "RENTAL_INC", label: "Rental income", group: "INCOME", scope: "yearly", desc: "Rental income (trade)" },
  { code: "GOODS_OWN_USE", label: "Goods for own use", group: "INCOME", scope: "yearly", desc: "Goods taken for personal use" },
  { code: "OTHER_INC", label: "Other trading income", group: "INCOME", scope: "yearly", desc: "Other tax-exempt / trading income" },
  // Annual overheads
  { code: "INSURANCE", label: "Insurance (annual)", group: "OVERHEADS", scope: "yearly", desc: "Business insurance" },
  { code: "USE_OF_HOME", label: "Use of home as office", group: "OVERHEADS", scope: "yearly", desc: "Apportioned home costs" },
  { code: "PRSI_ER", label: "Employer PRSI", group: "OVERHEADS", scope: "yearly", desc: "Employer PRSI contributions" },
  { code: "PENSION", label: "Pension contributions", group: "OVERHEADS", scope: "yearly", desc: "Employer pension contributions" },
  { code: "TRAINING", label: "Training & CPD", group: "OVERHEADS", scope: "yearly", desc: "Training and professional development" },
  { code: "BAD_DEBTS", label: "Bad debts written off", group: "OVERHEADS", scope: "yearly", desc: "Bad debts written off" },
  { code: "STAFF_COSTS", label: "Additional staff costs", group: "OVERHEADS", scope: "yearly", desc: "Other annual staff-related costs" },
  { code: "DEPRECIATION", label: "Depreciation (add-back)", group: "OVERHEADS", scope: "yearly", desc: "Depreciation – added back to profit" },
  // Adjustments / add-backs
  { code: "MOTOR_PRIVATE", label: "Motor – private use", group: "ADJUSTMENT", scope: "yearly", desc: "Private portion of motor costs" },
  { code: "UTILITIES_PRIVATE", label: "Utilities – private use", group: "ADJUSTMENT", scope: "yearly", desc: "Private portion of light/heat/phone" },
  { code: "DONATIONS", label: "Donations", group: "ADJUSTMENT", scope: "yearly", desc: "Political / charitable donations" },
  { code: "ENTERTAIN", label: "Entertainment", group: "ADJUSTMENT", scope: "yearly", desc: "Client entertainment costs" },
  { code: "ASSET_GAIN", label: "Asset gain", group: "ADJUSTMENT", scope: "yearly", desc: "Gain on disposal of fixed assets (deducted from profit)" },
  { code: "ASSET_LOSS", label: "Asset loss", group: "ADJUSTMENT", scope: "yearly", desc: "Loss on disposal of fixed assets (added back to profit)" },
  // Capital allowances – capex base
  { code: "PLANT_MACH_CAPEX", label: "Plant & machinery capex (12.5%)", group: "CAPITAL_ALLOW", scope: "yearly", desc: "12.5% straight-line wear and tear" },
  { code: "EEE_CAPEX", label: "Energy-efficient equip. capex (100%)", group: "CAPITAL_ALLOW", scope: "yearly", desc: "Accelerated 100% deduction" },
  { code: "FARM_SAFE_CAPEX", label: "Farm safety equip. capex (50%)", group: "CAPITAL_ALLOW", scope: "yearly", desc: "Accelerated 50% deduction" },
  { code: "GAS_VEH_CAPEX", label: "Gas vehicles capex (33.3%)", group: "CAPITAL_ALLOW", scope: "yearly", desc: "33.3% deduction" },
  { code: "CHILDCARE_CAPEX", label: "Childcare/fitness capex (15%)", group: "CAPITAL_ALLOW", scope: "yearly", desc: "15% deduction" },
  { code: "CAP_ALLOW_BF_USC", label: "Prior year B/F (USC)", group: "CAPITAL_ALLOW", scope: "yearly", desc: "Unused allowances (USC deductible)" },
  { code: "CAP_ALLOW_BF_NON_USC", label: "Prior year B/F (Non-USC)", group: "CAPITAL_ALLOW", scope: "yearly", desc: "Unused allowances (not USC deductible)" },
  { code: "SALE_PROCEEDS", label: "Sale proceeds (balancing)", group: "CAPITAL_ALLOW", scope: "yearly", desc: "Sale proceeds of disposed asset" },
  { code: "WDV", label: "Tax written-down value", group: "CAPITAL_ALLOW", scope: "yearly", desc: "Tax WDV of disposed asset" },
  { code: "BAL_CHARGE_ALLOW", label: "Balancing allowance", group: "CAPITAL_ALLOW", scope: "yearly", desc: "Balancing allowance on disposal" },
  // Farming reliefs
  { code: "STOCK_RELIEF_S666", label: "Stock relief (S.666)", group: "FARMING", scope: "yearly", desc: "General 25% stock relief" },
  { code: "YOUNG_FARMER_RELIEF", label: "Young farmer relief (S.667B)", group: "FARMING", scope: "yearly", desc: "100% stock relief" },
  { code: "CARBON_TAX_DEDUCT", label: "Carbon tax deduction", group: "FARMING", scope: "yearly", desc: "Deduction for carbon tax increase" },
  { code: "SUCCESSION_CREDIT", label: "Succession credit (S.667D)", group: "FARMING", scope: "yearly", desc: "Succession Farm Partnership Credit" },
  // Losses
  { code: "UNUSED_LOSS_BF", label: "Unused losses B/F (S.382)", group: "LOSSES", scope: "yearly", desc: "Prior year losses brought forward" },
  { code: "RES_DEV_LOSS_BF", label: "Res. dev. land losses B/F", group: "LOSSES", scope: "yearly", desc: "Residential development land losses" },
  { code: "FINAL_12M_LOSS", label: "Terminal loss (final 12m)", group: "LOSSES", scope: "yearly", desc: "Loss in final 12 months of trade" },
  { code: "FINAL_12M_CAP_ALLOW", label: "Terminal CA (final 12m)", group: "LOSSES", scope: "yearly", desc: "Capital allowances in final 12 months" },
  // Balance sheet
  { code: "OPENING_CAP", label: "Opening capital balance", group: "BALANCE", scope: "yearly", desc: "Capital at start of period" },
  { code: "CAP_INTRO", label: "Capital introduced", group: "BALANCE", scope: "yearly", desc: "Cash/Capital put into business" },
  { code: "STOCK_WIP", label: "Stock & WIP", group: "BALANCE", scope: "yearly", desc: "Closing stock and work in progress" },
  { code: "DEBTORS", label: "Debtors & prepayments", group: "BALANCE", scope: "yearly", desc: "Trade debtors and prepayments" },
  { code: "CREDITORS", label: "Creditors & accruals", group: "BALANCE", scope: "yearly", desc: "Trade creditors and accruals" },
  { code: "CASH_BANK_DR", label: "Cash / bank (debit)", group: "BALANCE", scope: "yearly", desc: "Cash or bank debit balance" },
  { code: "BANK_LOAN_CR", label: "Bank / loans (credit)", group: "BALANCE", scope: "yearly", desc: "Bank, loans or overdraft credit" },
  { code: "TAX_CREDITORS", label: "Tax creditors", group: "BALANCE", scope: "yearly", desc: "VAT, PAYE owed" },
] as const;

export type TxPeriod = "daily" | "yearly";
export type CategoryScope = "daily" | "yearly" | "both";

export type CategoryCode = (typeof CATEGORIES)[number]["code"];

export const CATEGORY_GROUP: Record<CategoryCode, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.code, c.group]),
) as Record<CategoryCode, string>;

export const CATEGORY_SCOPE: Record<CategoryCode, CategoryScope> = Object.fromEntries(
  CATEGORIES.map((c) => [c.code, c.scope]),
) as Record<CategoryCode, CategoryScope>;

export function categoriesFor(period: TxPeriod) {
  return CATEGORIES.filter((c) => c.scope === period || c.scope === "both");
}

export const INCOME_CODES: CategoryCode[] = ["CASH", "BANK", "INV", "GRANTS", "GOV_INCOME", "INTEREST_RECVD", "RENTAL_INC", "GOODS_OWN_USE"];
export const VAT_CODES: CategoryCode[] = ["VAT_OUT", "VAT_IN"];
export const PURCHASE_CODES: CategoryCode[] = ["MATERIALS", "SUBCON_RCT", "SUBCON_OTHER"];
export const OVERHEAD_CODES: CategoryCode[] = [
  "WAGES", "PRSI_ER", "PENSION", "RENT", "RATES", "INSURANCE", "HEAT_LIGHT", "USE_OF_HOME",
  "TELEPHONE", "INTERNET", "POSTAGE", "SOFTWARE", "ADVERT", "MOTOR", "TRAVEL_SUB",
  "REPAIRS", "TRAINING", "PROF_FEES", "BANK_FEES", "BAD_DEBTS", "SUNDRY",
];

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  category: CategoryCode;
  amount: number;
  period?: TxPeriod; // "daily" (default) or "yearly"
}

export interface YearEnd {
  PERIOD_START: string;
  PERIOD_END: string;
  // Balance sheet
  STOCK_WIP: number;
  DEBTORS: number;
  CASH_BANK_DR: number;
  BANK_LOAN_CR: number;
  CREDITORS: number;
  TAX_CREDITORS: number;
  CAP_INTRO: number;
  OPENING_CAP: number;
  // Add-backs
  MOTOR_PRIVATE: number;
  UTILITIES_PRIVATE: number;
  DONATIONS: number;
  ENTERTAIN: number;
  DEPRECIATION: number;
  OTHER_INC: number;
  STAFF_COSTS: number;
  // Capital allowances
  PLANT_MACH_CAPEX: number;
  EEE_CAPEX: number;
  CHILDCARE_CAPEX: number;
  GAS_VEH_CAPEX: number;
  FARM_SAFE_CAPEX: number;
  // Other
  SUCCESSION_CREDIT: number;
}

export const DEFAULT_YEAREND: YearEnd = {
  PERIOD_START: `${new Date().getFullYear()}-01-01`,
  PERIOD_END: `${new Date().getFullYear()}-12-31`,
  STOCK_WIP: 0, DEBTORS: 0, CASH_BANK_DR: 0, BANK_LOAN_CR: 0,
  CREDITORS: 0, TAX_CREDITORS: 0, CAP_INTRO: 0, OPENING_CAP: 0,
  MOTOR_PRIVATE: 0, UTILITIES_PRIVATE: 0, DONATIONS: 0, ENTERTAIN: 0,
  DEPRECIATION: 0, OTHER_INC: 0, STAFF_COSTS: 0,
  PLANT_MACH_CAPEX: 0, EEE_CAPEX: 0, CHILDCARE_CAPEX: 0,
  GAS_VEH_CAPEX: 0, FARM_SAFE_CAPEX: 0, SUCCESSION_CREDIT: 0,
};
