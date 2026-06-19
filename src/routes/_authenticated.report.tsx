import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useTransactions, useYearEnd } from "@/lib/taxy-store";
import { computeReport, fmtEUR } from "@/lib/taxy-calc";
import { buildForm11Rows } from "@/lib/taxy-rows";
import { exportForm11Pdf } from "@/lib/taxy-pdf";
import { Download } from "lucide-react";
import { useT } from "@/lib/i18n";

const UK_SECTIONS: Record<string, string> = {
  "Profit Assessable": "Оподатковуваний прибуток",
  "Tax Credits": "Податкові кредити",
  "Capital Allowances – Wear & Tear": "Капітальні відрахування – знос",
  "Add-backs & Adjustments": "Донарахування та коригування",
  "Farming Reliefs": "Пільги для фермерів",
  "Losses": "Збитки",
  "Extracts: Income": "Витяг: Доходи",
  "Extracts: Expenses": "Витяг: Витрати",
  "Profit & Loss": "Прибутки та збитки",
  "Extracts: Balance Sheet": "Витяг: Баланс",
  "Final": "Підсумок",
};

const UK_LABELS: Record<string, string> = {
  "Amount of adjusted net profit for accounting period": "Скоригований чистий прибуток за звітний період",
  "Amount of adjusted net loss for accounting period": "Скоригований чистий збиток за звітний період",
  "Assessable profit (same as adjusted net profit above)": "Оподатковуваний прибуток (дорівнює скоригованому чистому прибутку)",
  "Succession Tax Credit (S. 667D) for 2025": "Податковий кредит на передачу прав (S. 667D) за 2025",
  "Machinery and Plant (12.5%)": "Машини та обладнання (12,5%)",
  "Energy-efficient equipment S285A (100%)": "Енергоефективне обладнання S285A (100%)",
  "Childcare/fitness equipment (15%)": "Обладнання для дітей/фітнесу (15%)",
  "Gas vehicles & refuelling (33.3%)": "Газові авто та заправка (33,3%)",
  "Farm safety equipment S285D (50%)": "Обладнання безпеки на фермі S285D (50%)",
  "Balancing allowance on disposals": "Балансувальне відрахування при вибутті",
  "Prior-year B/F (USC deductible)": "Перенесено з попередніх років (USC-вирах.)",
  "Prior-year B/F (non-USC)": "Перенесено з попередніх років (не USC)",
  "Total Capital Allowances": "Всього капітальних відрахувань",
  "Owner drawings": "Особисті виплати власнику",
  "Motor – private use": "Авто – особисте використання",
  "Utilities – private use": "Комунальні – особисте використання",
  "Donations (charitable/political)": "Пожертви (благодійні/політичні)",
  "Entertainment": "Розваги/представницькі",
  "Depreciation (added back)": "Амортизація (додано назад)",
  "Asset loss (added back)": "Збиток від активу (додано назад)",
  "Asset gain (deducted)": "Прибуток від активу (вирахувано)",
  "Balancing charge (sale > WDV)": "Балансувальний збір (продаж > залиш.)",
  "Total add-backs (net)": "Усього донарахувань (нетто)",
  "Stock relief (S.666)": "Пільга на запаси (S.666)",
  "Young farmer relief (S.667B)": "Пільга для молодих фермерів (S.667B)",
  "Carbon tax deduction": "Відрахування вуглецевого податку",
  "Total farming reliefs": "Всього фермерських пільг",
  "Unused losses B/F (S.382)": "Невикористані збитки перенесені (S.382)",
  "Residential dev. land losses B/F": "Збитки житл. забудови перенесені",
  "Terminal loss (final 12 months)": "Кінцевий збиток (останні 12 міс.)",
  "Terminal capital allowances (final 12m)": "Кінцеві капітальні відрахування (останні 12 міс.)",
  "Total losses B/F applied": "Усього застосованих перенесених збитків",
  "Sales / Receipts / Turnover": "Продажі / Надходження / Оборот",
  "Sales / Receipts / Turnover (VAT inclusive)": "Продажі / Надходження / Оборот (з ПДВ)",
  "Receipts from Government Agencies (GMS etc.)": "Надходження від держустанов (GMS тощо)",
  "Other Trading Income including tax exempt income": "Інший торговий дохід, включно зі звільненим від податку",
  "Purchases": "Закупівлі",
  "Salaries / Wages": "Зарплати",
  "Sub-Contractors RCT": "Субпідрядники RCT",
  "Sub-Contractors (Other)": "Субпідрядники (інші)",
  "Consultancy, Professional Fees": "Консультаційні, професійні послуги",
  "Motor, Travel and Subsistence": "Авто, відрядження та проживання",
  "Repairs / Renewals": "Ремонти / Оновлення",
  "Rental Expenses": "Орендні витрати",
  "Other Expenses (Sundry, Bank Fees, Heat, Phone, Advert)": "Інші витрати (різне, банк. збори, опалення, зв'язок, реклама)",
  "Total Expenses": "Усього витрат",
  "Net Trade Profit per Accounts": "Чистий торговий прибуток за обліком",
  "Net Trade Loss per Accounts": "Чистий торговий збиток за обліком",
  "Closing Capital Balance": "Кінцевий залишок капіталу",
  "Stock, Work in progress, Finished goods": "Запаси, незавершене виробництво, готова продукція",
  "Debtors and Prepayments": "Дебітори та передоплати",
  "Cash/Bank (Debit)": "Готівка/Банк (Дебет)",
  "Bank/Loans/Overdraft (Credit)": "Банк/Кредити/Овердрафт (Кредит)",
  "Creditors and Accruals": "Кредитори та нарахування",
  "Tax Creditors": "Податкові зобов'язання",
  "Estimated Taxable Profit (after Capital Allowances)": "Орієнтовний оподатковуваний прибуток (після кап. відрахувань)",
};

export const Route = createFileRoute("/_authenticated/report")({
  component: ReportPage,
});

function ReportPage() {
  const { items } = useTransactions();
  const { data: ye } = useYearEnd();
  const { t, lang } = useT();
  const tr = (s: string, map: Record<string, string>) => (lang === "uk" ? map[s] ?? s : s);
  const r = useMemo(() => computeReport(items, ye), [items, ye]);
  const rows = useMemo(() => buildForm11Rows(r), [r]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof rows> = {};
    rows.forEach((row) => {
      g[row.section] = g[row.section] ?? [];
      g[row.section].push(row);
    });
    return g;
  }, [rows]);

  return (
    <AppShell
      title={t("rep.title")}
      subtitle={`${r.PERIOD_START} → ${r.PERIOD_END}`}
      action={
        <button
          onClick={() => exportForm11Pdf(r)}
          className="rounded-full bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition"
        >
          <Download className="h-3.5 w-3.5" /> {t("rep.pdf")}
        </button>
      }
    >
      <div className="space-y-4">
        {Object.entries(grouped).map(([section, items]) => (
          <section key={section} className="rounded-2xl border border-border bg-card overflow-hidden">
            <header className="bg-tax/10 text-tax px-4 py-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider">{tr(section, UK_SECTIONS)}</h2>
            </header>
            <ul className="divide-y divide-border">
              {items.map((row, i) => (
                <li key={i} className="px-4 py-2.5 flex items-start justify-between gap-3">
                  <p className="text-sm flex-1 leading-snug">{tr(row.label, UK_LABELS)}</p>
                  <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
                    {fmtEUR(row.value)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="text-[11px] text-muted-foreground text-center pt-1">
          {t("rep.disclaimer")}
        </p>
      </div>
    </AppShell>
  );
}
