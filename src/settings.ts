// src/setting.ts
import { App, PluginSettingTab, Setting } from "obsidian";
import ObGlossaryPlugin from "./main";
import { AVAILABLE_LANGUAGES, i18n_string, setLocale } from "./locales";

export interface ObGlossaryPluginSettings {
    insertEmptyLineAfterHeading: boolean;
    pluginLanguage: string;
    conceptNoteTemplatePath: string;
}

export const DEFAULT_SETTINGS: ObGlossaryPluginSettings = {
    insertEmptyLineAfterHeading: true,
    pluginLanguage: "auto",
    conceptNoteTemplatePath: "",
};

export class ObGlossarySettingTab extends PluginSettingTab {
    plugin: ObGlossaryPlugin;

    constructor(app: App, plugin: ObGlossaryPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName(i18n_string("setting-language-name"))
            .setDesc(i18n_string("setting-language-desc"))
            .addDropdown((dropdown) => {
                Object.entries(AVAILABLE_LANGUAGES).forEach(([key, label]) => {
                    dropdown.addOption(key, label);
                });
                dropdown
                    .setValue(this.plugin.settings.pluginLanguage)
                    .onChange(async (value) => {
                        this.plugin.settings.pluginLanguage = value;
                        await this.plugin.saveSettings();
                        setLocale(value);
                        this.display(); // Refresh to update language immediately
                    });
            });

        new Setting(containerEl)
            .setName(i18n_string("setting-concept-note-template-path-name"))
            .setDesc(i18n_string("setting-concept-note-template-path-desc"))
            .addText((text) =>
                text
                    .setPlaceholder("Templates/Concept.md")
                    .setValue(this.plugin.settings.conceptNoteTemplatePath)
                    .onChange(async (value) => {
                        this.plugin.settings.conceptNoteTemplatePath = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName(i18n_string("setting-empty-line-name"))
            .setDesc(i18n_string("setting-empty-line-desc"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.insertEmptyLineAfterHeading)
                    .onChange(async (value) => {
                        this.plugin.settings.insertEmptyLineAfterHeading =
                            value;
                        await this.plugin.saveSettings();
                    }),
            )
            .setHeading();
    }
}
