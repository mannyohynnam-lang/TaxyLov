import type { CategoryCode, Transaction, YearEnd } from "./taxy-types";
import { OVERHEAD_CODES, PURCHASE_CODES } from "./taxy-types";

export type Totals = Record<CategoryCode, number>;

export function totalsByCategory(txs: Transaction[]): Totals {
  const t: Partial<Totals> = {};
  for (const tx of txs) t[tx.category] = (t[tx.category] ?? 0) + Number(tx.amount || 0);
  return t as Totals;
}

export function computeReport(txs: Transaction[], y: YearEnd) {
  const t = totalsByCategory(txs);
  const g = (k: CategoryCode) => t[k] ?? 0;
  // `pick` merges values from the yearly transactions log AND the Adjustments
  // form (YearEnd object). Either source feeds the same totals, so users can
  // capture year-end variables on whichever screen they prefer.
  const pick = (k: CategoryCode, yv?: number) => g(k) + (yv || 0);

  // ---- Income ----
  const TURNOVER = g("CASH") + g("BANK") + g("INV");
  const NET_TURNOVER = TURNOVER - g("VAT_OUT");
  const TURNOVER_GROSS = TURNOVER;
  const GOV_RECEIPTS = g("GRANTS") + g("GOV_INCOME");
  const OTHER_INC = pick("OTHER_INC", y.OTHER_INC);
  const TOTAL_GROSS_INCOME = NET_TURNOVER + GOV_RECEIPTS + OTHER_INC;

  // ---- Costs ----
  const PURCHASES = PURCHASE_CODES.reduce((s, c) => s + g(c), 0);
  const GROSS_PROFIT = TOTAL_GROSS_INCOME - PURCHASES;

  const overheadsBreakdown: Record<string, number> = {};
  OVERHEAD_CODES.forEach((c) => (overheadsBreakdown[c] = g(c)));
  const STAFF_COSTS = pick("STAFF_COSTS", y.STAFF_COSTS);
  const DEPRECIATION = pick("DEPRECIATION", y.DEPRECIATION);
  const TOTAL_OVERHEADS =
    OVERHEAD_CODES.reduce((s, c) => s + g(c), 0) + STAFF_COSTS + DEPRECIATION;

  const TOTAL_EXPENSES = PURCHASES + TOTAL_OVERHEADS;
  const NET_PROFIT = TOTAL_GROSS_INCOME - TOTAL_EXPENSES;

  // ---- Add-backs / deductions on accounting profit ----
  const MOTOR_PRIVATE = pick("MOTOR_PRIVATE", y.MOTOR_PRIVATE);
  const UTILITIES_PRIVATE = pick("UTILITIES_PRIVATE", y.UTILITIES_PRIVATE);
  const DONATIONS = pick("DONATIONS", y.DONATIONS);
  const ENTERTAIN = pick("ENTERTAIN", y.ENTERTAIN);
  const ASSET_LOSS = g("ASSET_LOSS");
  const ASSET_GAIN = g("ASSET_GAIN");

  // Balancing charge: SALE_PROCEEDS > WDV → taxable income; else 0.
  const SALE_PROCEEDS = g("SALE_PROCEEDS");
  const WDV = g("WDV");
  const BALANCING_CHARGE = Math.max(0, SALE_PROCEEDS - WDV);

  const ADDBACKS =
    g("DRAWINGS") + MOTOR_PRIVATE + UTILITIES_PRIVATE + DONATIONS +
    ENTERTAIN + DEPRECIATION + ASSET_LOSS + BALANCING_CHARGE - ASSET_GAIN;

  const ADJUSTED = NET_PROFIT + ADDBACKS;
  const ADJUSTED_NET_PROFIT = Math.max(0, ADJUSTED);
  const ADJUSTED_NET_LOSS = ADJUSTED < 0 ? Math.abs(ADJUSTED) : 0;

  // ---- Capital allowances (Wear & Tear) ----
  const CA_PLANT = pick("PLANT_MACH_CAPEX", y.PLANT_MACH_CAPEX) * 0.125;
  const CA_EEE = pick("EEE_CAPEX", y.EEE_CAPEX) * 1.0;
  const CA_CHILD = pick("CHILDCARE_CAPEX", y.CHILDCARE_CAPEX) * 0.15;
  const CA_GAS = pick("GAS_VEH_CAPEX", y.GAS_VEH_CAPEX) * 0.333;
  const CA_FARM = pick("FARM_SAFE_CAPEX", y.FARM_SAFE_CAPEX) * 0.5;
  const CA_BAL_ALLOW = g("BAL_CHARGE_ALLOW");
  const CA_BF_USC = g("CAP_ALLOW_BF_USC");
  const CA_BF_NON_USC = g("CAP_ALLOW_BF_NON_USC");
  const CAPITAL_ALLOWANCES =
    CA_PLANT + CA_EEE + CA_CHILD + CA_GAS + CA_FARM +
    CA_BAL_ALLOW + CA_BF_USC + CA_BF_NON_USC;

  // ---- Farming reliefs (reduce taxable profit) ----
  const STOCK_RELIEF_S666 = g("STOCK_RELIEF_S666");
  const YOUNG_FARMER_RELIEF = g("YOUNG_FARMER_RELIEF");
  const CARBON_TAX_DEDUCT = g("CARBON_TAX_DEDUCT");
  const FARMING_RELIEFS = STOCK_RELIEF_S666 + YOUNG_FARMER_RELIEF + CARBON_TAX_DEDUCT;

  // ---- Losses brought forward (reduce taxable profit) ----
  const UNUSED_LOSS_BF = g("UNUSED_LOSS_BF");
  const RES_DEV_LOSS_BF = g("RES_DEV_LOSS_BF");
  const FINAL_12M_LOSS = g("FINAL_12M_LOSS");
  const FINAL_12M_CAP_ALLOW = g("FINAL_12M_CAP_ALLOW");
  const LOSSES_BF = UNUSED_LOSS_BF + RES_DEV_LOSS_BF;

  const TAXABLE_PROFIT = Math.max(
    0,
    ADJUSTED_NET_PROFIT - CAPITAL_ALLOWANCES - FARMING_RELIEFS - LOSSES_BF,
  );

  // ---- Balance sheet ----
  const STOCK_WIP = pick("STOCK_WIP", y.STOCK_WIP);
  const DEBTORS = pick("DEBTORS", y.DEBTORS);
  const CASH_BANK_DR = pick("CASH_BANK_DR", y.CASH_BANK_DR);
  const BANK_LOAN_CR = pick("BANK_LOAN_CR", y.BANK_LOAN_CR);
  const CREDITORS = pick("CREDITORS", y.CREDITORS);
  const TAX_CREDITORS = pick("TAX_CREDITORS", y.TAX_CREDITORS);
  const OPENING_CAP = pick("OPENING_CAP", y.OPENING_CAP);
  const CAP_INTRO = pick("CAP_INTRO", y.CAP_INTRO);
  const CLOSING_CAPITAL = OPENING_CAP + NET_PROFIT + CAP_INTRO - g("DRAWINGS");

  const SUCCESSION_CREDIT = pick("SUCCESSION_CREDIT", y.SUCCESSION_CREDIT);

  return {
    totals: t,
    TURNOVER, NET_TURNOVER, TURNOVER_GROSS, GOV_RECEIPTS,
    OTHER_INC,
    TOTAL_GROSS_INCOME,
    PURCHASES,
    GROSS_PROFIT,
    overheadsBreakdown,
    STAFF_COSTS, DEPRECIATION,
    TOTAL_OVERHEADS,
    TOTAL_EXPENSES,
    NET_PROFIT,
    MOTOR_PRIVATE, UTILITIES_PRIVATE, DONATIONS, ENTERTAIN,
    ASSET_GAIN, ASSET_LOSS,
    SALE_PROCEEDS, WDV, BALANCING_CHARGE,
    ADDBACKS,
    ADJUSTED_NET_PROFIT,
    ADJUSTED_NET_LOSS,
    CA_PLANT, CA_EEE, CA_CHILD, CA_GAS, CA_FARM,
    CA_BAL_ALLOW, CA_BF_USC, CA_BF_NON_USC,
    CAPITAL_ALLOWANCES,
    STOCK_RELIEF_S666, YOUNG_FARMER_RELIEF, CARBON_TAX_DEDUCT,
    FARMING_RELIEFS,
    UNUSED_LOSS_BF, RES_DEV_LOSS_BF, FINAL_12M_LOSS, FINAL_12M_CAP_ALLOW,
    LOSSES_BF,
    TAXABLE_PROFIT,
    CLOSING_CAPITAL,
    SUCCESSION_CREDIT,
    STOCK_WIP, DEBTORS, CASH_BANK_DR, BANK_LOAN_CR,
    CREDITORS, TAX_CREDITORS, OPENING_CAP, CAP_INTRO,
    PERIOD_START: y.PERIOD_START,
    PERIOD_END: y.PERIOD_END,
  };
}

export type ReportResult = ReturnType<typeof computeReport>;

export const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 })
    .format(Number.isFinite(n) ? n : 0);
