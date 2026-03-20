import { Editor, MarkdownView, Plugin, Notice } from "obsidian";
import {
	DEFAULT_SETTINGS,
	ObGlossaryPluginSettings,
	ObGlossarySettingTab,
} from "./settings";
import { sortGlossaryText } from "./core/sorter";
import { i18n_string } from "./locales";

export default class ObGlossaryPlugin extends Plugin {
	settings: ObGlossaryPluginSettings;

	async onload() {
		// Load settings
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new ObGlossarySettingTab(this.app, this));

		// Add comands
		this.addCommand({
			id: "sort-glossary-terms",
			name: i18n_string("command-sort-glossary-terms"),
			editorCheckCallback: (
				checking: boolean,
				editor: Editor,
				view: MarkdownView,
			) => {
				if (view && view.file) {
					const cache = this.app.metadataCache.getFileCache(
						view.file,
					);
					const isObGlossary =
						cache?.frontmatter?.["og-glossary"] === true;

					if (isObGlossary) {
						if (!checking) {
							this.sortObGlossaryEditor(editor);
						}
						return true;
					}
				}
				return false;
			},
		});
	}

	onunload() {}

	sortObGlossaryEditor(editor: Editor) {
		try {
			const content = editor.getValue();

			const sortedContent = sortGlossaryText(
				content,
				this.settings.insertEmptyLineAfterHeading,
			);

			if (content !== sortedContent) {
				editor.setValue(sortedContent);
			}
		} catch (error) {
			console.error(i18n_string("notice-sort-error"), error);
			new Notice(i18n_string("notice-sort-error"));
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<ObGlossaryPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
