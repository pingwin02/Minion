const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
	.setName('info')
	.setDescription('Uzyskaj informacje o użytkowniku lub serwerze')
	.addSubcommand(subcommand =>
		subcommand
			.setName('user')
			.setDescription('Informacje o użytkowniku')
			.addUserOption(option => option.setName('nick').setDescription('Nick użytkownika')))
	.addSubcommand(subcommand =>
		subcommand
			.setName('server')
			.setDescription('Informacje o serwerze')),
	async execute(interaction) {
		if (interaction.options.getSubcommand() === 'user') {
			const user = interaction.options.getUser('nick');
			if (user) {
				await interaction.reply({ content: `Nick: **${user.username}**\nID: **${user.id}**`, ephemeral: true });
				
			} else {
				await interaction.reply({ content: `Twój nick: **${interaction.user.username}**\nTwoje ID: **${interaction.user.id}**`, ephemeral: true });
			}
		} else if (interaction.options.getSubcommand() === 'server') {
			await interaction.reply({ content: `Nazwa serwera: **${interaction.guild.name}**\nIlość użytkowników: **${interaction.guild.memberCount}**`, ephemeral: true });
		}
	},

};