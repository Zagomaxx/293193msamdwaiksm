// Discord Js
const { Client, Collection, Intents } = require('discord.js');
const client = new Client({ 
    partials: ["CHANNEL"], 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_INTEGRATIONS,
        Intents.FLAGS.GUILD_WEBHOOKS,
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MESSAGE_TYPING,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGE_TYPING,
    ],
    autoReconnect: true,
    disableEveryone: true,
    fetchAllMembers: true,
});
const twitchAPI = require('twitch-api-v5');
client.discord = require('discord.js');
client.chalk = require("chalk");
client.fs = require("fs");
client.discordTranscripts = require('discord-html-transcripts');
client.config = require('./config.json');
client.on("error", console.error);
client.on("warn", console.warn);
client.login(client.config.bot.token);

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

client.commands = new Collection();
const commands = [];
const commandFiles = client.fs.readdirSync(`./comandi`).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./comandi/${file}`);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
};

const rest = new REST({ version: '9' }).setToken(client.config.bot.token);
(async () => {
	try {
		await rest.put(
			Routes.applicationGuildCommands(client.config.bot.clientid, client.config.server.idguild),
			{ body: commands },
		);
	} catch (error) {
		console.error(error);
	}
})();

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
  
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
  
    try {
      await command.execute(interaction, client, client.config);
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: 'C\'è stato un errore nell\'eseguire questo comando!',
        ephemeral: true
      });
    };
  })

const eventFiles = client.fs.readdirSync(`./events`).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    client.on(event.name, (...args) => event.execute(...args, client));
};

client.on('ready', () => {
  console.log('BOT ONLINE')
  client.user.setActivity(`${client.config.bot.nomebot}`, { type: 'STREAMING' })
});


client.on('guildMemberAdd', member => {
  member.guild.channels.cache.get(client.config.stanze.benvenuto).send(`Benvenuto <@${member.id}>, sul team **Heaven - Italian Team** per entrar a far parte del nostro team apri un ticket in <#1078696457089056789>`); 
  member.roles.add(member.guild.roles.cache.get(client.config.ruoli.benvenuto))
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.message.partial) await reaction.message.fetch();
    if (reaction.partial) await reaction.fetch();
    if (user.bot) return;
    if (!reaction.message.guild) return;
    if (reaction.message.channel.id == client.config.stanze.giochi) {
        if (reaction.emoji.name === "✅") {
            await reaction.message.guild.members.cache.get(user.id).roles.add("id_ruolo_gioco");
        }
    }
}
);

client.on('messageReactionRemove', async (reaction, user) => {
    if (reaction.message.partial) await reaction.message.fetch();
    if (reaction.partial) await reaction.fetch();
    if (user.bot) return;
    if (!reaction.message.guild) return;
    if (reaction.message.channel.id == client.config.stanze.giochi) {
        if (reaction.emoji.name === "✅") {
            await reaction.message.guild.members.cache.get(user.id).roles.remove("id_ruolo_gioco");
        }
    }
}
);

client.on('messageCreate', message => {
  if(client.config.parole_bannate.some(word => message.content.toLowerCase().includes(word))){
    message.delete()
  }})