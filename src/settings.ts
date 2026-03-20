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

        containerEl.createEl('h2', {text: 'ObGlossary Plugin 设置'});

        new Setting(containerEl)
            .setName('排序词汇时在标题后插入空行')
            .setDesc('自动在四级标题和下方正文之间插入一个空行（推荐开启以保持源码模式的高可读性）。')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.insertEmptyLineAfterHeading)
                .onChange(async (value) => {
                    this.plugin.settings.insertEmptyLineAfterHeading = value;
                    await this.plugin.saveSettings();
                }));
    }
}
