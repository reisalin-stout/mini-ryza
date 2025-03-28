import {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';

export class VerificationManager {
	constructor(server) {
		this.server = server;
	}

	async checkAndBuildVerify() {
		const channel = this.server.channels.CH_VERIFY;
		console.log('Checking for verification post...');
		const messages = await channel.messages.fetch({ limit: 10 });
		const existingVerifyMessage = messages.find(
			(msg) => msg.embeds.length > 0 && msg.embeds[0].title === 'Server Membership Verification'
		);

		if (!existingVerifyMessage) {
			console.log('Building post...');
			const verifyMemberButton = new ButtonBuilder()
				.setCustomId('member_verification')
				.setLabel('Verify Membership')
				.setStyle(ButtonStyle.Primary);

			const nonMemberButton = new ButtonBuilder()
				.setCustomId('non_member_verification')
				.setLabel('Non-Member Access')
				.setStyle(ButtonStyle.Secondary);

			const row = new ActionRowBuilder().addComponents(verifyMemberButton, nonMemberButton);

			const verifyEmbed = new EmbedBuilder()
				.setTitle('Server Membership Verification')
				.setDescription(
					'You will be asked to state your IGN and add a screenshot showing both your character sheet and your clubs tab.\n\n' +
						'Only verified members can:\n' +
						'- Post in trade channels\n' +
						'- Participate in giveaways'
				)
				.setColor('Orange');

			await channel.send({
				embeds: [verifyEmbed],
				components: [row],
			});
			console.log('Verification post built and sent.');
		}
	}

	buildVerificationModal() {
		const modal = new ModalBuilder()
			.setCustomId('verification_modal')
			.setTitle('Membership Verification');

		const usernameInput = new TextInputBuilder()
			.setCustomId('username_input')
			.setLabel('In-Game Username')
			.setStyle(TextInputStyle.Short)
			.setRequired(true);

		const screenshotInput = new TextInputBuilder()
			.setCustomId('screenshot_input')
			.setLabel('Screenshot Link')
			.setStyle(TextInputStyle.Short)
			.setPlaceholder('Direct link to screenshot showing your IGN and the club page [P].')
			.setRequired(true);

		modal.addComponents(
			new ActionRowBuilder().addComponents(usernameInput),
			new ActionRowBuilder().addComponents(screenshotInput)
		);

		return modal;
	}

	async checkAndGiveRole(userId, roleName) {
		try {
			let user = await this.server.guild.members.fetch(userId);
			let cachedRole = this.server.guild.roles.cache.find((role) => role.name === roleName);

			if (!user) {
				return { success: false, message: `User ${userId} not found.` };
			}

			if (!cachedRole) {
				return { success: false, message: `Role ${roleName} not found.` };
			}

			await user.roles.add(cachedRole);

			return { success: true, message: `Assigned the ${roleName} role.` };
		} catch (error) {
			console.error(`Error assigning ${roleName} role:`, error);
			return { success: false, message: 'Unable to process your request.' };
		}
	}

	async checkAndGiveNickname(userId, nickname) {
		try {
			let user = await this.server.guild.members.fetch(userId);

			if (!user) {
				return { success: false, message: `User ${userId} not found.` };
			}

			await user.setNickname(nickname);

			return { success: true, message: `Gave the nickname ${nickname}.` };
		} catch (error) {
			console.error(`Error assigning nickname:`, error);
			return { success: false, message: 'Unable to process your request.' };
		}
	}

	async manageVerificationResult(userId, success, roleName = 'Member') {
		if (success) {
			return await this.checkAndGiveRole(userId, roleName);
		}
		return { success: false, message: 'Verification failed.' };
	}

	async sendPendingVerifyPost(thread, userId, username, link) {
		try {
			const verifyMemberButton = new ButtonBuilder()
				.setCustomId('accept_membership_request')
				.setLabel('Accept')
				.setStyle(ButtonStyle.Success);

			const nonMemberButton = new ButtonBuilder()
				.setCustomId('deny_membership_request')
				.setLabel('Deny')
				.setStyle(ButtonStyle.Danger);

			const row = new ActionRowBuilder().addComponents(verifyMemberButton, nonMemberButton);

			const verifyEmbed = new EmbedBuilder()
				.setTitle('New membership verification request.')
				.setDescription(
					`<@${userId}> asked to be verified as **${username}**` + `\n[Submitted Link](${link})`
				)
				.setColor('Grey');

			await thread.send({
				embeds: [verifyEmbed],
				components: [row],
			});
			console.log(`${userId} asked to be verified as ${username}`);
		} catch (error) {
			console.error('Error sending pending verify post:', error);
		}
	}
}

// Export individual functions for backwards compatibility
export function buildVerificationModal(server) {
	const manager = new VerificationManager(server);
	return manager.buildVerificationModal();
}

export async function checkAndBuildVerify(server) {
	const manager = new VerificationManager(server);
	return manager.checkAndBuildVerify();
}

export async function checkAndGiveRole(server, userId, roleName) {
	const manager = new VerificationManager(server);
	return manager.checkAndGiveRole(userId, roleName);
}

export async function checkAndGiveNickname(server, userId, nickname) {
	const manager = new VerificationManager(server);
	return manager.checkAndGiveNickname(userId, nickname);
}

export async function SendPendingVerifyPost(server, thread, userId, username, link) {
	const manager = new VerificationManager(server);
	return manager.sendPendingVerifyPost(thread, userId, username, link);
}
