const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.token);

// for guild-based commands
// rest.put(Routes.applicationGuildCommands(process.env.clientId, process.env.guildId), { body: [] })
// 	.then(() => console.log('Successfully deleted all guild commands.'))
// 	.catch(console.error);

// for global commands
rest.put(Routes.applicationCommands(process.env.clientId), { body: [] })
	.then(() => console.log('Successfully deleted all application commands.'))
	.catch(console.error);