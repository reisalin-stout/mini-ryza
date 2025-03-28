import { Client, GatewayIntentBits } from 'discord.js';

export class Server {
	constructor() {
		this.bot = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.MessageContent,
			],
		});
	}

	async loadConfig(config) {
		this.config = config;
		this.token = this.config.BOT_TOKEN;
	}

	async login() {
		return new Promise((resolve, reject) => {
			this.bot.once('ready', () => {
				console.log(`Logged in as ${this.bot.user.tag}`);
				resolve();
			});

			this.bot.login(this.token).catch(reject);
		});
	}

	async init() {
		try {
			this.guild = await this.bot.guilds.fetch(this.config.SERVER_ID);

			this.guildmaster = await this.guild.members.fetch(this.config.GUILDMASTER_ID);

			this.channels = {};
			for (const [key, channelId] of Object.entries(this.config.CHANNELS)) {
				try {
					const channel = await this.guild.channels.fetch(channelId);
					this.channels[key] = channel;
				} catch (error) {
					console.error(`Error fetching channel with ID ${channelId}:`, error);
				}
			}

			return this;
		} catch (error) {
			console.error('Error initializing server:', error);
			throw error;
		}
	}
}
