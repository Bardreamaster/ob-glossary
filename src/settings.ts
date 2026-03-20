// src/setting.ts
import { App, PluginSettingTab, Setting } from "obsidian";
import ObGlossaryPlugin from "./main";

export interface ObGlossaryPluginSettings {
    insertEmptyLineAfterHeading: boolean;
}

export const DEFAULT_SETTINGS: ObGlossaryPluginSettings = {
    insertEmptyLineAfterHeading: true
}

export class ObGlossarySettingTab extends PluginSettingTab {
    plugin: ObGlossaryPlugin;

    constructor(app: App, plugin: ObGlossaryPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName(i18n_string('setting-empty-line-name'))
            .setDesc(i18n_string('setting-empty-line-desc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.insertEmptyLineAfterHeading)
                .onChange(async (value) => {
                    this.plugin.settings.insertEmptyLineAfterHeading = value;
                    await this.plugin.saveSettings();
                })).setHeading();
    }
}
