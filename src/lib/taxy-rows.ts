import type { ReportResult } from "./taxy-calc";

export interface ReportRow {
  section: string;
  label: string;
  value: number;
}

export function buildForm11Rows(r: ReportResult): ReportRow[] {
  return [
    // 1. PROFIT
    { section: "Profit Assessable", label: "Amount of adjusted net profit for accounting period", value: r.ADJUSTED_NET_PROFIT },
    { section: "Profit Assessable", label: "Amount of adjusted net loss for accounting period", value: r.ADJUSTED_NET_LOSS },
    { section: "Profit Assessable", label: "Assessable profit (same as adjusted net profit above)", value: r.ADJUSTED_NET_PROFIT },

    // 2. CREDITS
    { section: "Tax Credits", label: "Succession Tax Credit (S. 667D) for 2025", value: r.SUCCESSION_CREDIT },

    // 3. CAPITAL ALLOWANCES (Wear & Tear)
    { section: "Capital Allowances – Wear & Tear", label: "Machinery and Plant (12.5%)", value: r.CA_PLANT },
    { section: "Capital Allowances – Wear & Tear", label: "Energy-efficient equipment S285A (100%)", value: r.CA_EEE },
    { section: "Capital Allowances – Wear & Tear", label: "Childcare/fitness equipment (15%)", value: r.CA_CHILD },
    { section: "Capital Allowances – Wear & Tear", label: "Gas vehicles & refuelling (33.3%)", value: r.CA_GAS },
    { section: "Capital Allowances – Wear & Tear", label: "Farm safety equipment S285D (50%)", value: r.CA_FARM },
    { section: "Capital Allowances – Wear & Tear", label: "Balancing allowance on disposals", value: r.CA_BAL_ALLOW },
    { section: "Capital Allowances – Wear & Tear", label: "Prior-year B/F (USC deductible)", value: r.CA_BF_USC },
    { section: "Capital Allowances – Wear & Tear", label: "Prior-year B/F (non-USC)", value: r.CA_BF_NON_USC },
    { section: "Capital Allowances – Wear & Tear", label: "Total Capital Allowances", value: r.CAPITAL_ALLOWANCES },

    // 3b. Add-backs / non-deductible
    { section: "Add-backs & Adjustments", label: "Owner drawings", value: r.totals.DRAWINGS ?? 0 },
    { section: "Add-backs & Adjustments", label: "Motor – private use", value: r.MOTOR_PRIVATE },
    { section: "Add-backs & Adjustments", label: "Utilities – private use", value: r.UTILITIES_PRIVATE },
    { section: "Add-backs & Adjustments", label: "Donations (charitable/political)", value: r.DONATIONS },
    { section: "Add-backs & Adjustments", label: "Entertainment", value: r.ENTERTAIN },
    { section: "Add-backs & Adjustments", label: "Depreciation (added back)", value: r.DEPRECIATION },
    { section: "Add-backs & Adjustments", label: "Asset loss (added back)", value: r.ASSET_LOSS },
    { section: "Add-backs & Adjustments", label: "Asset gain (deducted)", value: r.ASSET_GAIN },
    { section: "Add-backs & Adjustments", label: "Balancing charge (sale > WDV)", value: r.BALANCING_CHARGE },
    { section: "Add-backs & Adjustments", label: "Total add-backs (net)", value: r.ADDBACKS },

    // 3c. Farming reliefs
    { section: "Farming Reliefs", label: "Stock relief (S.666)", value: r.STOCK_RELIEF_S666 },
    { section: "Farming Reliefs", label: "Young farmer relief (S.667B)", value: r.YOUNG_FARMER_RELIEF },
    { section: "Farming Reliefs", label: "Carbon tax deduction", value: r.CARBON_TAX_DEDUCT },
    { section: "Farming Reliefs", label: "Total farming reliefs", value: r.FARMING_RELIEFS },

    // 3d. Losses
    { section: "Losses", label: "Unused losses B/F (S.382)", value: r.UNUSED_LOSS_BF },
    { section: "Losses", label: "Residential dev. land losses B/F", value: r.RES_DEV_LOSS_BF },
    { section: "Losses", label: "Terminal loss (final 12 months)", value: r.FINAL_12M_LOSS },
    { section: "Losses", label: "Terminal capital allowances (final 12m)", value: r.FINAL_12M_CAP_ALLOW },
    { section: "Losses", label: "Total losses B/F applied", value: r.LOSSES_BF },

    // 4. EXTRACTS FROM ACCOUNTS – Income
    { section: "Extracts: Income", label: "Sales / Receipts / Turnover", value: r.TURNOVER },
    { section: "Extracts: Income", label: "Sales / Receipts / Turnover (VAT inclusive)", value: r.TURNOVER_GROSS },
    { section: "Extracts: Income", label: "Receipts from Government Agencies (GMS etc.)", value: r.GOV_RECEIPTS },
    { section: "Extracts: Income", label: "Other Trading Income including tax exempt income", value: r.OTHER_INC },

    // 5. EXTRACTS – Expenses summary
    { section: "Extracts: Expenses", label: "Purchases", value: r.PURCHASES },
    { section: "Extracts: Expenses", label: "Salaries / Wages", value: r.overheadsBreakdown.WAGES ?? 0 },
    { section: "Extracts: Expenses", label: "Sub-Contractors RCT", value: r.totals.SUBCON_RCT ?? 0 },
    { section: "Extracts: Expenses", label: "Sub-Contractors (Other)", value: r.totals.SUBCON_OTHER ?? 0 },
    { section: "Extracts: Expenses", label: "Consultancy, Professional Fees", value: r.overheadsBreakdown.PROF_FEES ?? 0 },
    { section: "Extracts: Expenses", label: "Motor, Travel and Subsistence", value: (r.overheadsBreakdown.MOTOR ?? 0) + (r.overheadsBreakdown.TRAVEL_SUB ?? 0) },
    { section: "Extracts: Expenses", label: "Repairs / Renewals", value: r.overheadsBreakdown.REPAIRS ?? 0 },
    { section: "Extracts: Expenses", label: "Rental Expenses", value: (r.overheadsBreakdown.RENT ?? 0) + (r.overheadsBreakdown.RATES ?? 0) },
    { section: "Extracts: Expenses", label: "Other Expenses (Sundry, Bank Fees, Heat, Phone, Advert)", value:
        (r.overheadsBreakdown.SUNDRY ?? 0) + (r.overheadsBreakdown.BANK_FEES ?? 0) +
        (r.overheadsBreakdown.HEAT_LIGHT ?? 0) + (r.overheadsBreakdown.TELEPHONE ?? 0) +
        (r.overheadsBreakdown.INTERNET ?? 0) + (r.overheadsBreakdown.ADVERT ?? 0) },
    { section: "Extracts: Expenses", label: "Total Expenses", value: r.TOTAL_EXPENSES },

    // 6. P&L summary
    { section: "Profit & Loss", label: "Net Trade Profit per Accounts", value: Math.max(0, r.NET_PROFIT) },
    { section: "Profit & Loss", label: "Net Trade Loss per Accounts", value: r.NET_PROFIT < 0 ? Math.abs(r.NET_PROFIT) : 0 },

    // 7. Balance Sheet – Extracts from Accounts
    { section: "Extracts: Balance Sheet", label: "Closing Capital Balance", value: r.CLOSING_CAPITAL },
    { section: "Extracts: Balance Sheet", label: "Stock, Work in progress, Finished goods", value: r.STOCK_WIP },
    { section: "Extracts: Balance Sheet", label: "Debtors and Prepayments", value: r.DEBTORS },
    { section: "Extracts: Balance Sheet", label: "Cash/Bank (Debit)", value: r.CASH_BANK_DR },
    { section: "Extracts: Balance Sheet", label: "Bank/Loans/Overdraft (Credit)", value: r.BANK_LOAN_CR },
    { section: "Extracts: Balance Sheet", label: "Creditors and Accruals", value: r.CREDITORS },
    { section: "Extracts: Balance Sheet", label: "Tax Creditors", value: r.TAX_CREDITORS },

    // 8. Final taxable
    { section: "Final", label: "Estimated Taxable Profit (after Capital Allowances)", value: r.TAXABLE_PROFIT },
  ];
}
