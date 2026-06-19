// Ukrainian translations for category labels.
// CAPS code (e.g. CASH) is intentionally NOT translated — only the descriptive part.
import type { CategoryCode } from "./taxy-types";

export const UK_CATEGORY_LABELS: Record<CategoryCode, string> = {
  // Daily — income
  CASH: "готівкові продажі (брутто, до ПДВ)",
  BANK: "надходження на банк (брутто, до ПДВ)",
  INV: "продажі за рахунками (брутто, до ПДВ)",
  VAT_OUT: "ПДВ зібраний",
  // Daily — purchases
  MATERIALS: "матеріали / витратні запаси",
  SUBCON_RCT: "субпідрядники (RCT)",
  SUBCON_OTHER: "субпідрядники (інші)",
  VAT_IN: "ПДВ сплачений (вхідний)",
  // Daily — overheads
  WAGES: "заробітна плата",
  RENT: "оренда",
  RATES: "місцеві збори",
  HEAT_LIGHT: "опалення та світло / комунальні",
  TELEPHONE: "телефон",
  INTERNET: "інтернет",
  POSTAGE: "поштові та канцелярія",
  SOFTWARE: "ПЗ та підписки",
  ADVERT: "реклама",
  MOTOR: "автотранспорт",
  TRAVEL_SUB: "відрядження та проживання",
  REPAIRS: "ремонт / інструменти",
  PROF_FEES: "професійні послуги",
  BANK_FEES: "банківські комісії та відсотки за кредитом",
  SUNDRY: "інші витрати",
  DRAWINGS: "власні потреби",
  // Yearly — other income
  GRANTS: "отримані гранти",
  GOV_INCOME: "державні надходження",
  INTEREST_RECVD: "отримані відсотки",
  RENTAL_INC: "дохід від оренди",
  GOODS_OWN_USE: "товари для власного користування",
  OTHER_INC: "інший торговий дохід",
  // Yearly — overheads
  INSURANCE: "страхування (річне)",
  USE_OF_HOME: "використання житла як офісу",
  PRSI_ER: "PRSI роботодавця",
  PENSION: "пенсійні внески",
  TRAINING: "навчання та CPD",
  BAD_DEBTS: "списані безнадійні борги",
  STAFF_COSTS: "додаткові витрати на персонал",
  DEPRECIATION: "амортизація (додавання назад)",
  // Adjustments
  MOTOR_PRIVATE: "авто — приватне використання",
  UTILITIES_PRIVATE: "комунальні — приватне використання",
  DONATIONS: "пожертви",
  ENTERTAIN: "представницькі витрати",
  ASSET_GAIN: "прибуток від продажу активів",
  ASSET_LOSS: "збиток від продажу активів",
  // Capital allowances
  PLANT_MACH_CAPEX: "обладнання та машини, капітал (12.5%)",
  EEE_CAPEX: "енергоефективне обладнання, капітал (100%)",
  FARM_SAFE_CAPEX: "обладнання безпеки на фермі, капітал (50%)",
  GAS_VEH_CAPEX: "газові авто, капітал (33.3%)",
  CHILDCARE_CAPEX: "дитячі/фітнес заклади, капітал (15%)",
  CAP_ALLOW_BF_USC: "перенесення з минулого року (USC)",
  CAP_ALLOW_BF_NON_USC: "перенесення з минулого року (без USC)",
  SALE_PROCEEDS: "виручка від продажу (балансуюча)",
  WDV: "податкова залишкова вартість",
  BAL_CHARGE_ALLOW: "балансуюча знижка",
  // Farming
  STOCK_RELIEF_S666: "пільга на запаси (S.666)",
  YOUNG_FARMER_RELIEF: "пільга молодого фермера (S.667B)",
  CARBON_TAX_DEDUCT: "відрахування вуглецевого податку",
  SUCCESSION_CREDIT: "кредит спадкоємства (S.667D)",
  // Losses
  UNUSED_LOSS_BF: "невикористані збитки В/Р (S.382)",
  RES_DEV_LOSS_BF: "збитки житлової забудови В/Р",
  FINAL_12M_LOSS: "термінальний збиток (останні 12 міс)",
  FINAL_12M_CAP_ALLOW: "термінальні капітальні знижки (останні 12 міс)",
  // Balance sheet
  OPENING_CAP: "початковий капітал",
  CAP_INTRO: "введений капітал",
  STOCK_WIP: "запаси та НЗВ",
  DEBTORS: "дебітори та передоплати",
  CREDITORS: "кредитори та нарахування",
  CASH_BANK_DR: "готівка / банк (дебет)",
  BANK_LOAN_CR: "банк / кредити (кредит)",
  TAX_CREDITORS: "податкові кредитори",
};

export function categoryLabel(code: CategoryCode, fallback: string, lang: string): string {
  if (lang === "uk") return UK_CATEGORY_LABELS[code] ?? fallback;
  return fallback;
}
