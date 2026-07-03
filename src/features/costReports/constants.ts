import { BookOpen, CheckCircle2, FileText, FolderKanban, SlidersHorizontal } from "lucide-react";

import type {
  BuilderSection,
  CoefficientValueFormState,
  WizardFormState
} from "./types";

export const builderSections: Array<{
  id: BuilderSection;
  number: string;
  shortLabel: string;
  title: string;
  description: string;
  icon: typeof FolderKanban;
}> = [
  {
    id: "project",
    number: "۱",
    shortLabel: "پروژه",
    title: "انتخاب پروژه",
    description: "انتخاب پروژه از لیست پروژه‌های شرکت",
    icon: FolderKanban
  },
  {
    id: "document",
    number: "۲",
    shortLabel: "صورت‌بها",
    title: "اطلاعات صورت‌بها",
    description: "دوره، شماره و سال فهرست‌بها",
    icon: FileText
  },
  {
    id: "pricebook",
    number: "۳",
    shortLabel: "مرور فهرست‌بها",
    title: "مرور فهرست‌بها",
    description: "انتخاب آیتم و افزودن ردیف‌ها",
    icon: BookOpen
  },
  {
    id: "coefficients",
    number: "۴",
    shortLabel: "ضرایب",
    title: "ضرایب",
    description: "مدیریت ضرایب پروژه",
    icon: SlidersHorizontal
  },
  {
    id: "finalize",
    number: "۵",
    shortLabel: "نهایی‌سازی",
    title: "نهایی کردن صورت‌بها",
    description: "بازبینی، پیش‌نمایش و ارسال",
    icon: CheckCircle2
  }
];

export const lockedBuilderSectionMessage =
  "ابتدا اطلاعات پروژه و صورت‌بها را تکمیل کنید.";

export const chapterFilters = [
  { id: "all", label: "همه فصل‌ها" },
  { id: "01-09", label: "زیرساخت و سازه", min: 1, max: 9 },
  { id: "10-19", label: "معماری و فلزی", min: 10, max: 19 },
  { id: "20-29", label: "نازک‌کاری و مصالح", min: 20, max: 29 },
  { id: "30-39", label: "تکمیلی", min: 30, max: 39 },
  { id: "40-49", label: "مصالح پای کار", min: 40, max: 49 },
  { id: "90-99", label: "تجهیز کارگاه", min: 90, max: 99 }
] as const;

export const coefficientKeyOptions = [
  { id: "regional", label: "ضریب منطقه" },
  { id: "overhead", label: "ضریب بالاسری" },
  { id: "floor", label: "ضریب طبقات" },
  { id: "proposal", label: "ضریب پیشنهادی" },
  { id: "custom_1", label: "ضریب سفارشی ۱" },
  { id: "custom_2", label: "ضریب سفارشی ۲" }
] as const;

export const coefficientScopeOptions = [
  { id: "project", label: "کل پروژه" },
  { id: "chapter", label: "فصل" },
  { id: "row", label: "ردیف" }
] as const;

export const initialForm: WizardFormState = {
  project_code: "",
  project_name: "",
  contract_number: "",
  employer_name: "",
  consultant_name: "",
  contractor_name: "",
  executive_agency_name: "",
  base_year: "1404",
  starts_on: "",
  ends_on: "",
  description: "",
  document_number: "",
  document_title: "",
  report_title: "",
  document_date: "",
  period_start_on: "",
  period_end_on: "",
  price_set_id: ""
};

export const initialCoefficientValueForm: CoefficientValueFormState = {
  coefficient_key: "overhead",
  scope: "project",
  chapter_id: "",
  row_id: "",
  label_fa: "ضریب بالاسری",
  multiplier: "1",
  is_active: true
};

export const inputClasses =
  "h-12 w-full rounded-lg border border-white/10 bg-slate-950/45 px-4 text-base sm:text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 focus:bg-slate-950/65 light:border-slate-200 light:bg-white light:text-slate-950 light:placeholder:text-slate-400";

export const textareaClasses =
  "min-h-24 w-full resize-y rounded-lg border border-white/10 bg-slate-950/45 px-4 py-3 text-base sm:text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 focus:bg-slate-950/65 light:border-slate-200 light:bg-white light:text-slate-950 light:placeholder:text-slate-400";
