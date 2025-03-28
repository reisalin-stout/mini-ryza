import { MessageFlags } from 'discord.js';
import {
	checkAndBuildVerify,
	buildVerificationModal,
	checkAndGiveRole,
	checkAndGiveNickname,
	SendPendingVerifyPost,
} from './scripts/verify.js';
import { Server } from './scripts/server.js';

async function setupBot() {
	// Create server instance
	const server = new Server();

	// Setup listeners before login
	setupEventListeners(server);

	// Login and initialize\
	await server.loadConfig('./credentials.json');
	await server.login();
	await server.init();

	// Perform post-login setup
	await checkAndBuildVerify(server);
	console.log('Mini Ryza is ready!');

	return server;
}

function setupEventListeners(server) {
	server.bot.on('interactionCreate', async (interaction) => {
		try {
			// Non-Member Button Handler
			if (interaction.isButton() && interaction.customId === 'non_member_verification') {
				await checkAndGiveRole(server, interaction.user.id, 'Guest');
			}

			// Verification Button Handler
			if (interaction.isButton() && interaction.customId === 'member_verification') {
				const modal = buildVerificationModal(server);
				await interaction.showModal(modal);
			}

			// Modal Submission Handler
			if (interaction.isModalSubmit() && interaction.customId === 'verification_modal') {
				const username = interaction.fields.getTextInputValue('username_input');
				const screenshot = interaction.fields.getTextInputValue('screenshot_input');

				await SendPendingVerifyPost(
					server,
					server.channels.TD_PENDING,
					interaction.user.id,
					username,
					screenshot
				);

				await checkAndGiveRole(server, interaction.user.id, 'Guest');

				await interaction.reply({
					content:
						'Your verification request has been forwarded. You have been given a temporary Guest role while it is being processed.',
					components: [],
					flags: MessageFlags.Ephemeral,
				});
			}

			// Cancel Verification Handler
			if (interaction.isButton() && interaction.customId === 'deny_membership_request') {
				await interaction.update({
					content: 'Verification process cancelled.',
					components: [],
				});
			}

			// Accept Membership Request Handler
			if (interaction.isButton() && interaction.customId === 'accept_membership_request') {
				const inputString = interaction.message.embeds[0].description;

				const userIdMatch = inputString.match(/<@(\d+)>/);
				const userId = userIdMatch ? userIdMatch[1] : null;

				const usernameMatch = inputString.match(/\*\*(.*?)\*\*/);
				const username = usernameMatch ? usernameMatch[1] : null;

				await checkAndGiveRole(server, userId, 'Member');
				await checkAndGiveNickname(server, userId, username);

				await interaction.update({
					content: 'User was verified.',
					components: [],
				});
			}
		} catch (error) {
			console.error('Error in interaction handler:', error);
		}
	});

	// You can add more event listeners here as needed
	server.bot.on('error', (error) => {
		console.error('Discord bot error:', error);
	});
}

// Initialize the bot
setupBot().catch(console.error);
