import en from "./en";
import zh from "./zh";

export const AVAILABLE_LANGUAGES: Record<string, string> = {
    zh: "中文 (zh)",
    en: "English (en)",
    auto: "跟随应用 (same as app)",
};

export const COMMON_LANGUAGES: Record<string, string> = {
    zh: "中文 (zh)",
    en: "English (en)",
    it: "Italiano (it)",
    fr: "Français (fr)",
    de: "Deutsch (de)",
    es: "Español (es)",
    ja: "日本語 (ja)",
    ko: "한국어 (ko)",
    ru: "Русский (ru)",
    ar: "العربية (ar)",
    custom: "其他 (custom)",
};

const localeMap: { [k: string]: Partial<typeof zh> } = {
    en,
    zh,
};

const initialSystemLang = window.localStorage.getItem("language") || "zh";

let currentOverrideLocale = "auto";
let activeLanguage: string = localeMap[initialSystemLang]
    ? initialSystemLang
    : "zh";
let textDict: Record<string, string> = localeMap[activeLanguage] as Record<
    string,
    string
>;

export function setLocale(locale: string) {
    currentOverrideLocale = locale;
    const effectiveLocale =
        currentOverrideLocale === "auto"
            ? window.localStorage.getItem("language") || "zh"
            : currentOverrideLocale;
    activeLanguage = effectiveLocale;
    textDict = localeMap[effectiveLocale || "zh"] || zh;
}

export function getLocale() {
    return activeLanguage;
}

export function i18n_string(str: keyof typeof zh): string {
    return textDict[str] || zh[str] || str;
}
