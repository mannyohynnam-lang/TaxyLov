import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "uk";

const STORAGE_KEY = "taxy.lang";

const dict = {
  en: {
    // Bottom nav
    "nav.log": "Log",
    "nav.dashboard": "Dashboard",
    "nav.report": "Form 11",
    "nav.settings": "Settings",

    // Auth
    "auth.brand": "Taxy",
    "auth.subtitle": "Sign in to continue",
    "auth.emailTitle": "Email sign-in",
    "auth.emailHint": "We'll email you a one-time code",
    "auth.emailPlaceholder": "you@example.com",
    "auth.sendCode": "Send code",
    "auth.codeSentTo": "Code sent to",
    "auth.verifyContinue": "Verify & continue",
    "auth.changeEmail": "Change email",
    "auth.resend": "Resend",
    "auth.resendIn": "Resend in {s}s",
    "auth.limitReached": "Limit reached",
    "auth.enter6": "Enter the 6-digit code from your email",
    "auth.codeSent": "Code sent to your email",
    "auth.newCodeSent": "New code sent",
    "auth.maxResends": "You've reached the maximum number of resends.",
    "auth.expired": "This code has expired. Please request a new one.",
    "auth.invalid": "Invalid code. Please try again.",
    "auth.testFailed": "Test login failed",
    "auth.sendFailed": "Failed to send code. Please try again.",

    // Paywall
    "paywall.title": "Unlock full access",
    "paywall.subtitle": "Choose a plan to continue using the app",
    "paywall.monthly": "Monthly",
    "paywall.monthlyHint": "Billed every month",
    "paywall.perMo": "/mo",
    "paywall.getMonthly": "Get Monthly",
    "paywall.activating": "Activating...",
    "paywall.yearly": "Yearly",
    "paywall.bestValue": "Best value",
    "paywall.save17": "Save 17%",
    "paywall.perYr": "/yr",
    "paywall.getYearly": "Get Yearly",
    "paywall.freeTrial": "Give me 3 days of free access, please",
    "paywall.freeTrialLabel": "Free trial",
    "paywall.terms": "Terms of use",
    "paywall.activated": "{label} activated",

    // Onboarding
    "onb.title": "Tell us about your business",
    "onb.subtitle": "We'll tailor categories and tips for you",
    "onb.type": "Type of business",
    "onb.services": "Services",
    "onb.goods": "Goods",
    "onb.area": "Related area",
    "onb.chooseArea": "Choose area",
    "onb.continue": "Continue",
    "onb.saving": "Saving...",
    "onb.chooseBoth": "Please choose both options",
    "onb.saved": "Saved",

    // Business areas
    "area.Education": "Education",
    "area.Sport": "Sport",
    "area.Food": "Food",
    "area.Cleaning": "Cleaning",
    "area.Accounting": "Accounting",
    "area.Website creation": "Website creation",
    "area.Beauty": "Beauty",
    "area.Health & wellness": "Health & wellness",
    "area.Construction & trades": "Construction & trades",
    "area.Transport & delivery": "Transport & delivery",
    "area.Retail": "Retail",
    "area.Hospitality": "Hospitality",
    "area.Consulting": "Consulting",
    "area.Marketing & design": "Marketing & design",
    "area.IT & software": "IT & software",
    "area.Photography & video": "Photography & video",
    "area.Childcare": "Childcare",
    "area.Agriculture": "Agriculture",
    "area.Repairs & maintenance": "Repairs & maintenance",
    "area.Other": "Other",

    // Transactions
    "tx.title": "Transactions",
    "tx.subtitle": "{n} entries · daily + yearly",
    "tx.add": "Add transaction",
    "tx.daily": "daily",
    "tx.yearly": "yearly",
    "tx.search": "Search description, category, date…",
    "tx.empty": "No transactions yet.",
    "tx.noMatches": "No matches.",
    "tx.addFirst": "Add your first",
    "tx.edit": "Edit",
    "tx.delete": "Delete",
    "tx.editTitle": "Edit transaction",
    "tx.newTitle": "New transaction",
    "tx.period": "Period",
    "tx.date": "Date",
    "tx.description": "Description",
    "tx.descPlaceholder": "e.g. Site materials – Joe Bloggs",
    "tx.aiAssistant": "AI assistant",
    "tx.aiHint": "Describe the transaction (or use voice) and let AI pick the category.",
    "tx.suggest": "Suggest category",
    "tx.stop": "Stop",
    "tx.voice": "Voice",
    "tx.voiceUnsupported": "Voice input is not supported in this browser",
    "tx.voiceError": "Voice error: {err}",
    "tx.addDescFirst": "Add a description first",
    "tx.aiUnknown": "AI returned an unknown category",
    "tx.aiFailed": "AI failed",
    "tx.suggested": "Suggested: {code}",
    "tx.suggestedSwitched": "Suggested: {code} (switched to {period})",
    "tx.category": "Category",
    "tx.amount": "Amount (EUR)",
    "tx.saveChanges": "Save changes",
    "tx.saveTransaction": "Save transaction",

    // Dashboard
    "dash.subtitle": "Form 11 — Extract from Accounts",
    "dash.netTurnover": "Net Turnover",
    "dash.netTurnoverHint": "(CASH + BANK + INV) − VAT collected",
    "dash.totalExpenses": "Total Expenses",
    "dash.totalExpensesHint": "Purchases + overheads + depreciation",
    "dash.taxableProfit": "Estimated Taxable Profit",
    "dash.taxableProfitHint": "Adjusted net profit − capital allowances",
    "dash.grossProfit": "Gross Profit",
    "dash.netProfit": "Net Profit",
    "dash.addbacks": "Add-backs",
    "dash.capitalAllow": "Capital Allow.",
    "dash.recent": "Recent transactions",
    "dash.viewAll": "View all",
    "dash.emptyHint": "No transactions yet. Tap Log to add one.",
    "dash.disclaimer": "Estimates only · Always confirm with your accountant before filing.",

    // Report
    "rep.title": "Form 11 Report",
    "rep.pdf": "PDF",
    "rep.disclaimer": "Estimates only · Always confirm with your accountant before filing with Revenue.",

    // Settings
    "set.title": "Settings",
    "set.subtitle": "Account & data",
    "set.signedInAs": "Signed in as",
    "set.subscription": "Subscription",
    "set.subscriptionHint": "Manage your plan",
    "set.subscriptionYearly": "Yearly",
    "set.subscriptionMonthly": "Monthly",
    "set.subscriptionNone": "None",
    "set.signOut": "Sign out",
    "set.signOutHint": "End your session on this device",
    "set.deleteAll": "Delete all data",
    "set.deleteAllHint": "Remove every transaction and adjustment",
    "set.dataNote": "Your data is securely stored in your account.",
    "set.deleteConfirmTitle": "Delete everything?",
    "set.deleteConfirmBody":
      "This permanently removes all transactions and yearly adjustments from your account.",
    "set.cancel": "Cancel",
    "set.language": "Language",
    "set.languageHint": "Choose interface language",

    // Errors / 404
    "err.404": "Page not found",
    "err.404Body": "The page you're looking for doesn't exist or has been moved.",
    "err.goHome": "Go home",
    "err.title": "This page didn't load",
    "err.body": "Something went wrong on our end. You can try refreshing or head back home.",
    "err.tryAgain": "Try again",
  },
  uk: {
    // Bottom nav
    "nav.log": "Журнал",
    "nav.dashboard": "Огляд",
    "nav.report": "Форма 11",
    "nav.settings": "Налаштування",

    // Auth
    "auth.brand": "Taxy",
    "auth.subtitle": "Увійдіть, щоб продовжити",
    "auth.emailTitle": "Вхід через email",
    "auth.emailHint": "Ми надішлемо одноразовий код на пошту",
    "auth.emailPlaceholder": "ви@приклад.com",
    "auth.sendCode": "Надіслати код",
    "auth.codeSentTo": "Код надіслано на",
    "auth.verifyContinue": "Підтвердити та продовжити",
    "auth.changeEmail": "Змінити email",
    "auth.resend": "Надіслати знову",
    "auth.resendIn": "Повторно через {s}с",
    "auth.limitReached": "Ліміт вичерпано",
    "auth.enter6": "Введіть 6-значний код з вашої пошти",
    "auth.codeSent": "Код надіслано на вашу пошту",
    "auth.newCodeSent": "Новий код надіслано",
    "auth.maxResends": "Ви досягли максимальної кількості повторних надсилань.",
    "auth.expired": "Термін дії коду минув. Будь ласка, запросіть новий.",
    "auth.invalid": "Невірний код. Спробуйте ще раз.",
    "auth.testFailed": "Тестовий вхід не вдався",
    "auth.sendFailed": "Не вдалося надіслати код. Спробуйте ще раз.",

    // Paywall
    "paywall.title": "Розблокувати повний доступ",
    "paywall.subtitle": "Оберіть план, щоб продовжити користуватися додатком",
    "paywall.monthly": "Щомісячно",
    "paywall.monthlyHint": "Списується щомісяця",
    "paywall.perMo": "/міс",
    "paywall.getMonthly": "Обрати щомісячний",
    "paywall.activating": "Активація...",
    "paywall.yearly": "Щорічно",
    "paywall.bestValue": "Найвигідніше",
    "paywall.save17": "Економія 17%",
    "paywall.perYr": "/рік",
    "paywall.getYearly": "Обрати щорічний",
    "paywall.freeTrial": "Дайте мені 3 дні безкоштовного доступу, будь ласка",
    "paywall.freeTrialLabel": "Безкоштовний період",
    "paywall.terms": "Умови використання",
    "paywall.activated": "{label} активовано",

    // Onboarding
    "onb.title": "Розкажіть про ваш бізнес",
    "onb.subtitle": "Ми підлаштуємо категорії та поради під вас",
    "onb.type": "Тип бізнесу",
    "onb.services": "Послуги",
    "onb.goods": "Товари",
    "onb.area": "Сфера діяльності",
    "onb.chooseArea": "Оберіть сферу",
    "onb.continue": "Продовжити",
    "onb.saving": "Збереження...",
    "onb.chooseBoth": "Будь ласка, оберіть обидва варіанти",
    "onb.saved": "Збережено",

    // Business areas
    "area.Education": "Освіта",
    "area.Sport": "Спорт",
    "area.Food": "Їжа",
    "area.Cleaning": "Прибирання",
    "area.Accounting": "Бухгалтерія",
    "area.Website creation": "Створення сайтів",
    "area.Beauty": "Краса",
    "area.Health & wellness": "Здоров'я та велнес",
    "area.Construction & trades": "Будівництво та ремесла",
    "area.Transport & delivery": "Транспорт і доставка",
    "area.Retail": "Роздрібна торгівля",
    "area.Hospitality": "Готельно-ресторанна сфера",
    "area.Consulting": "Консалтинг",
    "area.Marketing & design": "Маркетинг і дизайн",
    "area.IT & software": "IT та програмне забезпечення",
    "area.Photography & video": "Фото та відео",
    "area.Childcare": "Догляд за дітьми",
    "area.Agriculture": "Сільське господарство",
    "area.Repairs & maintenance": "Ремонт і обслуговування",
    "area.Other": "Інше",

    // Transactions
    "tx.title": "Операції",
    "tx.subtitle": "{n} записів · щоденні + щорічні",
    "tx.add": "Додати операцію",
    "tx.daily": "щоденні",
    "tx.yearly": "щорічні",
    "tx.search": "Пошук за описом, категорією, датою…",
    "tx.empty": "Поки немає операцій.",
    "tx.noMatches": "Нічого не знайдено.",
    "tx.addFirst": "Додати першу",
    "tx.edit": "Редагувати",
    "tx.delete": "Видалити",
    "tx.editTitle": "Редагувати операцію",
    "tx.newTitle": "Нова операція",
    "tx.period": "Період",
    "tx.date": "Дата",
    "tx.description": "Опис",
    "tx.descPlaceholder": "напр. Будматеріали – Іван Петренко",
    "tx.aiAssistant": "AI-асистент",
    "tx.aiHint": "Опишіть операцію (або скористайтесь голосом) — AI підбере категорію.",
    "tx.suggest": "Підказати категорію",
    "tx.stop": "Стоп",
    "tx.voice": "Голос",
    "tx.voiceUnsupported": "Голосовий ввід не підтримується у цьому браузері",
    "tx.voiceError": "Помилка голосу: {err}",
    "tx.addDescFirst": "Спочатку додайте опис",
    "tx.aiUnknown": "AI повернув невідому категорію",
    "tx.aiFailed": "Помилка AI",
    "tx.suggested": "Запропоновано: {code}",
    "tx.suggestedSwitched": "Запропоновано: {code} (переключено на {period})",
    "tx.category": "Категорія",
    "tx.amount": "Сума (EUR)",
    "tx.saveChanges": "Зберегти зміни",
    "tx.saveTransaction": "Зберегти операцію",

    // Dashboard
    "dash.subtitle": "Форма 11 — Витяг з рахунків",
    "dash.netTurnover": "Чистий оборот",
    "dash.netTurnoverHint": "(Готівка + Банк + Рахунки) − зібраний ПДВ",
    "dash.totalExpenses": "Загальні витрати",
    "dash.totalExpensesHint": "Закупівлі + накладні + амортизація",
    "dash.taxableProfit": "Орієнтовний оподатковуваний прибуток",
    "dash.taxableProfitHint": "Скоригований чистий прибуток − капітальні відрахування",
    "dash.grossProfit": "Валовий прибуток",
    "dash.netProfit": "Чистий прибуток",
    "dash.addbacks": "Коригування",
    "dash.capitalAllow": "Кап. відрах.",
    "dash.recent": "Останні операції",
    "dash.viewAll": "Усі",
    "dash.emptyHint": "Поки немає операцій. Натисніть Журнал, щоб додати.",
    "dash.disclaimer": "Лише оцінки · Завжди звіряйте з бухгалтером перед поданням.",

    // Report
    "rep.title": "Звіт за Формою 11",
    "rep.pdf": "PDF",
    "rep.disclaimer":
      "Лише оцінки · Завжди звіряйте з бухгалтером перед поданням до податкової.",

    // Settings
    "set.title": "Налаштування",
    "set.subtitle": "Акаунт і дані",
    "set.signedInAs": "Ви увійшли як",
    "set.subscription": "Підписка",
    "set.subscriptionHint": "Керування планом",
    "set.subscriptionYearly": "Щорічна",
    "set.subscriptionMonthly": "Щомісячна",
    "set.subscriptionNone": "Немає",
    "set.signOut": "Вийти",
    "set.signOutHint": "Завершити сеанс на цьому пристрої",
    "set.deleteAll": "Видалити всі дані",
    "set.deleteAllHint": "Видалити всі операції та коригування",
    "set.dataNote": "Ваші дані надійно зберігаються у вашому акаунті.",
    "set.deleteConfirmTitle": "Видалити все?",
    "set.deleteConfirmBody":
      "Це назавжди видалить усі операції та щорічні коригування з вашого акаунта.",
    "set.cancel": "Скасувати",
    "set.language": "Мова",
    "set.languageHint": "Оберіть мову інтерфейсу",

    // Errors / 404
    "err.404": "Сторінку не знайдено",
    "err.404Body": "Сторінка, яку ви шукаєте, не існує або була переміщена.",
    "err.goHome": "На головну",
    "err.title": "Сторінка не завантажилась",
    "err.body": "Щось пішло не так. Спробуйте оновити або поверніться на головну.",
    "err.tryAgain": "Спробувати ще раз",
  },
} as const;

type Key = keyof (typeof dict)["en"];

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<Ctx | null>(null);

function format(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "uk" || stored === "en") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
    if (typeof document !== "undefined") document.documentElement.lang = l;
  };

  const t: Ctx["t"] = (key, vars) => format((dict[lang][key] ?? dict.en[key] ?? key) as string, vars);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used inside LanguageProvider");
  return ctx;
}
