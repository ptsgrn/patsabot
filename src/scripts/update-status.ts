import { Bot } from "@core/bot";

export default class UpdateStatusBot extends Bot {
	public info: Bot["info"] = {
		id: "update-status",
		description: "อัปเดตสถานะบอต",
		name: "update-status",
		frequency: "@daily",
	};

	async run() {
		await this.bot.save(
			`ผู้ใช้:${this.config.bot.username}/timestamp`,
			"{{subst:#timel:r}}",
			"อัปเดตสถานะ",
		);
		this.log.info("Status updated");
	}
}
