import en from "./en";
import zh from "./zh";

const locale = window.localStorage.getItem("language");

const localeMap: { [k: string]: Partial<typeof zh> } = {
	en,
	zh,
};

const language = localeMap[locale || "zh"] || zh;

export function i18n_string(str: keyof typeof zh): string {
	return (language && language[str]) || zh[str] || str;
}
