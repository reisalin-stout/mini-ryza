import {
	BuildVerificationModal,
	CheckAndAssignRole,
	CheckAndRemoveRole,
	CheckAndAssignNickname,
	SetupPendingVerificationPost,
} from './functions.js';
import { MessageFlags } from 'discord.js';

export class EventManager {
	listen(server) {
		this.server = server;
		this.server.bot.on('interactionCreate', async (interaction) => {
			try {
				// Non-Member Button Handler
				if (interaction.isButton() && interaction.customId === 'non_member_verification') {
					const result = await CheckAndAssignRole(this.server, interaction.user.id, 'Guest');
					console.log(result.message);
				}

				// Verification Button Handler
				if (interaction.isButton() && interaction.customId === 'member_verification') {
					const modal = BuildVerificationModal();
					await interaction.showModal(modal);
				}

				// Modal Submission Handler
				if (interaction.isModalSubmit() && interaction.customId === 'verification_modal') {
					const username = interaction.fields.getTextInputValue('username_input');
					const screenshot = interaction.fields.getTextInputValue('screenshot_input');

					await SetupPendingVerificationPost(this.server, interaction.user.id, username, screenshot);

					const result = await CheckAndAssignRole(this.server, interaction.user.id, 'Guest');
					console.log(result.message);

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

					await CheckAndAssignRole(this.server, userId, 'Member');
					await CheckAndRemoveRole(this.server, userId, 'Guest');
					await CheckAndAssignNickname(this.server, userId, username);

					await interaction.update({
						content: 'User was verified.',
						components: [],
					});
				}
			} catch (error) {
				console.error('Error in interaction handler:', error);
			}
		});

		// Error handler
		this.server.bot.on('error', (error) => {
			console.error('Discord bot error:', error);
		});
	}
}
