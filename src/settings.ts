/** Plugin settings tabs **/

import { App, PluginSettingTab, Setting } from "obsidian";
import OpenPluginCmdr from "./main";
import { SearchInAllPlugins } from "./modals";
import i18next from "i18next";

export default class OpenPluginSettingTab extends PluginSettingTab {
	plugin: OpenPluginCmdr;

	constructor(app: App, plugin: OpenPluginCmdr) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("p", { text: i18next.t("settingsTab.desc")}).style.textAlign = "center";

		const buttonSettings = new Setting(containerEl)
			.setClass("open-plugin-settings-header");
		buttonSettings.addButton((button) =>
			button
				.setButtonText(i18next.t("settingsTab.addNew"))
				.onClick(async () => {
					//open the search modal
					const searchModal = new SearchInAllPlugins(this.app, this.plugin, async (result) => {
						//add the plugin to the list
						this.plugin.settings.pluginCmdr.push(result);
						await this.plugin.saveSettings();
						await this.plugin.addNewCommands(undefined, result);
						this.display();
					});
					searchModal.open();
				})
				.setClass("add-plugin-button")
		)
			.infoEl.style.display = "none";
		buttonSettings.addExtraButton((button) =>
			button
				.setIcon("reset")
				.setTooltip(i18next.t("settingsTab.refresh"))
				.onClick(async () => {
					//refresh the list of plugins
					await this.plugin.removeDeletedPlugins();
					this.display();
				})
		);


		for (const plugin of this.plugin.settings.pluginCmdr) {
			const pluginSettings = new Setting(containerEl)
				.setName(plugin.name)
				.addText((text) => {
					text
						.setValue(plugin.commandName ?? plugin.name)
						.onChange(async (value) => {
							//change the name of the commands
							const oldPlugin = JSON.parse(JSON.stringify(plugin));
							plugin.commandName = value;
							await this.plugin.saveSettings();
							await this.plugin.addNewCommands(oldPlugin, plugin);
						})
						.inputEl.ariaLabel = i18next.t("settingsTab.commandName");
					this.addTooltip(i18next.t("settingsTab.commandName"), text.inputEl);
				})
				.setClass("open-plugin-settings-item")
				.addButton((button) =>
					button
						.setIcon("trash")
						.setTooltip(i18next.t("settingsTab.remove"))
						.onClick(async () => {
							//remove the plugin from the list
							this.plugin.settings.pluginCmdr = this.plugin.settings.pluginCmdr.filter((p) => p.id !== plugin.id);
							await this.plugin.saveSettings();
							await this.plugin.removeCommands();

							this.display();
						})
				);
			if (!this.plugin.checkIfPluginIsEnabled(plugin.id)) {
				console.log("disabled", plugin.id);
				pluginSettings
					.setDesc(i18next.t("settingsTab.disabled"))
					.setClass("disabled");
			}
		}
	}

	addTooltip(text: string, cb: HTMLElement) {
		cb.onfocus = () => {
			const tooltip = cb.parentElement?.createEl("div", { text, cls: "tooltip" });
			if (tooltip) {
				const rec = cb.getBoundingClientRect();
				tooltip.style.top = `${rec.top + rec.height + 5}px`;
				tooltip.style.left = `${rec.left + rec.width / 2}px`;
			}
		};
		cb.onblur = () => {
			cb.parentElement?.querySelector(".tooltip")?.remove();
		};
	}



}
