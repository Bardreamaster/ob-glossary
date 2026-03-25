import {
    App,
    FuzzySuggestModal,
    Modal,
    Setting,
    Notice,
    TFile,
    TFolder,
    TextComponent,
    moment,
    normalizePath,
    parseYaml,
    stringifyYaml,
} from "obsidian";
import ObGlossaryPlugin from "../main";
import { i18n_string, COMMON_LANGUAGES, getLocale } from "locales";

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getOptionalString(
    record: Record<string, unknown>,
    key: string,
): string | undefined {
    const value = record[key];
    return typeof value === "string" ? value : undefined;
}

function normalizeDomain(value: unknown): string[] {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed ? [trimmed] : [];
    }

    if (Array.isArray(value)) {
        return value
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
}

function parseDomainInput(value: string): string[] {
    return [
        ...new Set(
            value
                .split(/[,，]/)
                .map((item) => item.trim())
                .filter(Boolean),
        ),
    ];
}

function isInvalidFileName(fileName: string): boolean {
    if (fileName.length === 0 || fileName.length > 255) {
        return true;
    }

    if (/[<>:"/\\|?*]/.test(fileName)) {
        return true;
    }

    for (let i = 0; i < fileName.length; i += 1) {
        const code = fileName.charCodeAt(i);
        if (code >= 0 && code <= 31) {
            return true;
        }
    }

    if (/[. ]$/.test(fileName)) {
        return true;
    }

    if (/^(\.|\.{2})$/.test(fileName)) {
        return true;
    }

    return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(fileName);
}

function normalizeFolderPath(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        return "";
    }

    return normalizePath(trimmed).replace(/^\/+|\/+$/g, "");
}

class FolderSuggestModal extends FuzzySuggestModal<string> {
    private readonly onChoose: (path: string) => void;

    constructor(
        app: App,
        _initialPath: string,
        onChoose: (path: string) => void,
    ) {
        super(app);
        this.onChoose = onChoose;
        this.setPlaceholder(
            i18n_string("modal-folder-path-picker-placeholder"),
        );
    }

    getItems(): string[] {
        const folders = this.app.vault
            .getAllLoadedFiles()
            .filter((entry): entry is TFolder => entry instanceof TFolder)
            .map((folder) => normalizeFolderPath(folder.path))
            .filter(Boolean)
            .filter((path, index, arr) => arr.indexOf(path) === index)
            .sort((a, b) => a.localeCompare(b));

        return ["", ...folders];
    }

    getItemText(item: string): string {
        return item || i18n_string("modal-folder-path-root-option");
    }

    onChooseItem(item: string): void {
        this.onChoose(item);
    }
}

export class ConceptNoteModal extends Modal {
    plugin: ObGlossaryPlugin;
    result: {
        title: string;
        id: string;
        domain: string;
        language: string;
        folderPath: string;
    };

    constructor(app: App, plugin: ObGlossaryPlugin) {
        super(app);
        this.plugin = plugin;
        this.result = {
            title: "",
            id: moment().format("YYYYMMDD-HHmmss-SSS"),
            domain: "",
            language: "",
            folderPath: "",
        };
    }

    // render UI on modal open
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        let folderPathInput: TextComponent | null = null;

        this.setTitle(i18n_string("modal-title-create-concept-note"));

        // Concept Name
        new Setting(contentEl)
            .setName(i18n_string("modal-concept-name-label"))
            .setDesc(i18n_string("modal-concept-name-desc"))
            .addText((text) =>
                text
                    .setPlaceholder(
                        i18n_string("modal-concept-name-placeholder"),
                    )
                    .onChange((value) => {
                        this.result.title = value;
                    }),
            );

        // Concept ID
        new Setting(contentEl)
            .setName(i18n_string("modal-concept-id-label"))
            .setDesc(i18n_string("modal-concept-id-desc"))
            .addText((text) =>
                text.setValue(this.result.id).onChange((value) => {
                    this.result.id = value;
                }),
            );

        // Domain
        new Setting(contentEl)
            .setName(i18n_string("modal-domain-label"))
            .setDesc(i18n_string("modal-domain-desc"))
            .addText((text) =>
                text
                    .setPlaceholder(i18n_string("modal-domain-placeholder"))
                    .onChange((value) => {
                        this.result.domain = value;
                    }),
            );

        new Setting(contentEl)
            .setName(i18n_string("modal-folder-path-label"))
            .setDesc(i18n_string("modal-folder-path-desc"))
            .addText((text) =>
                ((folderPathInput = text), text)
                    .setValue(this.result.folderPath)
                    .setPlaceholder(
                        i18n_string("modal-folder-path-placeholder"),
                    )
                    .onChange((value) => {
                        this.result.folderPath = value;
                    }),
            )
            .addButton((button) =>
                button
                    .setButtonText(
                        i18n_string("modal-folder-path-select-button"),
                    )
                    .onClick(() => {
                        new FolderSuggestModal(
                            this.app,
                            this.result.folderPath,
                            (path) => {
                                this.result.folderPath = path;
                                folderPathInput?.setValue(path);
                            },
                        ).open();
                    }),
            );

        // 4. Language Selector
        let customLangSetting: Setting | null = null;
        const selectedLanguage = getLocale();
        this.result.language =
            selectedLanguage === "custom" ? "" : selectedLanguage;

        new Setting(contentEl)
            .setName(i18n_string("modal-language-label"))
            .addDropdown((dropdown) => {
                for (const [code, name] of Object.entries(COMMON_LANGUAGES)) {
                    dropdown.addOption(code, name);
                }
                dropdown.setValue(selectedLanguage);
                dropdown.onChange((value) => {
                    if (value === "custom") {
                        customLangSetting?.settingEl.show();
                        this.result.language = "";
                    } else {
                        customLangSetting?.settingEl.hide();
                        this.result.language = value;
                    }
                });
            });

        customLangSetting = new Setting(contentEl)
            .setName(i18n_string("modal-custom-language-label"))
            .setDesc(i18n_string("modal-custom-language-desc"))
            .addText((text) =>
                text
                    .setPlaceholder(
                        i18n_string("modal-custom-language-placeholder"),
                    )
                    .onChange((value) => {
                        this.result.language = value.trim();
                    }),
            );

        if (selectedLanguage === "custom") {
            this.result.language = "";
        } else {
            customLangSetting.settingEl.hide();
        }

        // Confirm Button
        new Setting(contentEl).addButton((btn) =>
            btn
                .setButtonText(i18n_string("modal-create-button"))
                .setCta()
                .onClick(async () => {
                    if (this.result.title.trim() === "") {
                        new Notice(i18n_string("modal-notice-empty-title"));
                        return;
                    }
                    const success = await this.createNewNote();
                    if (success) {
                        this.close();
                    }
                }),
        );
    }

    // Cleanup when modal closes
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    async createNewNote() {
        const { title, id, domain, language, folderPath } = this.result;
        const normalizedTitle = title.trim();
        const fileName = `${normalizedTitle}.md`;
        const normalizedFolderPath = normalizeFolderPath(folderPath);
        const filePath = normalizedFolderPath
            ? `${normalizedFolderPath}/${fileName}`
            : fileName;

        try {
            // 1.1 Check for duplicate file name
            if (isInvalidFileName(normalizedTitle)) {
                new Notice(i18n_string("modal-notice-invalid-file-name"));
                return false;
            }

            const existingFile = this.app.vault.getAbstractFileByPath(filePath);
            if (existingFile) {
                new Notice(i18n_string("modal-notice-invalid-title-duplicate"));
                return false;
            }
            // 1.2 ID validation (Only allow letters, numbers, dashes, and underscores)
            if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
                new Notice(i18n_string("modal-notice-invalid-id"));
                return false;
            }

            if (normalizedFolderPath) {
                const pathSegments = normalizedFolderPath
                    .split("/")
                    .filter(Boolean);

                let currentPath = "";
                for (const segment of pathSegments) {
                    currentPath = currentPath
                        ? `${currentPath}/${segment}`
                        : segment;
                    const pathEntry =
                        this.app.vault.getAbstractFileByPath(currentPath);

                    if (pathEntry && !(pathEntry instanceof TFolder)) {
                        new Notice(
                            i18n_string("modal-notice-invalid-folder-path"),
                        );
                        return false;
                    }

                    if (!pathEntry) {
                        await this.app.vault.createFolder(currentPath);
                    }
                }
            }

            // 2. Necessary frontmatter properties for a concept note
            const mandatoryProps: Record<string, unknown> = {
                "og-concept": true,
            };

            const inputProps = {
                title: normalizedTitle,
                id,
                language,
                domain: parseDomainInput(domain),
            };

            // 3. Load user template if specified
            let templateProps: Record<string, unknown> = {};
            let bodyContent = ``;

            const templatePath = this.plugin.settings.conceptNoteTemplatePath;
            if (templatePath.trim() !== "") {
                const templateFile =
                    this.app.vault.getAbstractFileByPath(templatePath);

                if (templateFile instanceof TFile) {
                    const rawTemplate = await this.app.vault.read(templateFile);

                    // match YAML frontmatter if exists
                    const yamlMatch = rawTemplate.match(
                        /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/,
                    );

                    if (yamlMatch && yamlMatch[1]) {
                        try {
                            const parsed: unknown = parseYaml(yamlMatch[1]);
                            templateProps = isRecord(parsed) ? parsed : {};
                        } catch (error) {
                            console.error(
                                i18n_string("modal-notice-template-yaml-error"),
                                error,
                            );
                            new Notice(
                                i18n_string("modal-notice-template-yaml-error"),
                            );
                        }
                        bodyContent = yamlMatch[2] || ""; // 提取用户的正文结构
                    } else {
                        // No frontmatter, treat entire template as body
                        bodyContent = rawTemplate;
                    }
                } else {
                    new Notice(
                        i18n_string(
                            "modal-notice-template-file-not-found",
                        ).replace("{path}", templatePath),
                    );
                }
            }

            // 4. Merge properties by priority: mandatory > modal input > template
            const templateId = getOptionalString(templateProps, "id") || "";
            const templateLanguage =
                getOptionalString(templateProps, "language") || "";
            const templateDomain = normalizeDomain(templateProps.domain);

            const mergedId = inputProps.id || templateId;
            const mergedLanguage = inputProps.language || templateLanguage;
            const mergedDomain =
                inputProps.domain.length > 0
                    ? inputProps.domain
                    : templateDomain;

            const mergedProps: Record<string, unknown> = {
                ...templateProps,
                ...inputProps,
                id: mergedId,
                language: mergedLanguage,
                domain: mergedDomain,
                ...mandatoryProps,
            };

            // 5. Combine frontmatter and body
            const finalYamlString = stringifyYaml(mergedProps);
            let finalFileContent = `---\n${finalYamlString}---\n${bodyContent}`;
            const domainText = mergedDomain.join(", ");

            // 6. replace template variables in the content (if any)
            finalFileContent = finalFileContent
                .replace(/\{\{title\}\}/g, normalizedTitle)
                .replace(/\{\{id\}\}/g, mergedId)
                .replace(/\{\{domain\}\}/g, domainText)
                .replace(/\{\{language\}\}/g, mergedLanguage);

            // 7. Create the new file and open it
            const newFile = await this.app.vault.create(
                filePath,
                finalFileContent,
            );
            await this.app.workspace.getLeaf(false).openFile(newFile);
            new Notice(
                i18n_string("modal-notice-create-success").replace(
                    "{title}",
                    normalizedTitle,
                ),
            );
            return true;
        } catch (error) {
            console.error(i18n_string("modal-notice-create-failed"), error);
            new Notice(i18n_string("modal-notice-create-failed"));
            return false;
        }
    }
}
