import { Editor, MarkdownView, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, ObGlossaryPluginSettings, ObGlossarySettingTab } from "./settings";
import { sortGlossaryText } from './core/sorter';


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
			name: "Sort terms in current glossary",
			editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) =>{
				if (view && view.file) {
					const cache = this.app.metadataCache.getFileCache(view.file);
					const isObGlossary = cache?.frontmatter?.['og-glossary'] === true;

					if (isObGlossary) {
						if (!checking) {
							this.sortObGlossaryEditor(editor);
						}
						return true;
					}
				}
				return false;
			}
		});
	}

	onunload() {
	}

	sortObGlossaryEditor(editor: Editor) {
		try {
			const content = editor.getValue();

			const sortedContent = sortGlossaryText(content, this.settings.insertEmptyLineAfterHeading);

			if (content !== sortedContent) {
				editor.setValue(sortedContent);
			}
		} catch (error) {
			console.error("排序 ObGlossary 时出错:", error);  // todo: multi-language support
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<ObGlossaryPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
