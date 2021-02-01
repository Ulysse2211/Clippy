// Importation des librairies
const config = require("./src/config.json");
const Discord = require("discord.js");
const client = new Discord.Client({ fetchAllMembers: true });
const util = require("util");
const fs = require("fs-extra");

// Handler
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

const commandfiles = fs.readdirSync("./src/commandes/").filter(file => file.endsWith(".js"));
for (const file of commandfiles) {
    const command = require(`./src/commandes/${file}`);
    client.commands.set(command.name, command)
};
client.on("ready", () => {
    console.log("Hello world!");
    client.user.setPresence({ status: "online", activity: { name: `${config.prefix}help`, type: "WATCHING" } });
});
client.on("message", (message) => {
    if (!message.content.startsWith(config.prefix) || message.author.bot) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return;
    
    // Arguments
    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}!`;
        if (command.usage) {
            reply += `\nThe proper usage would be: \`${config.prefix}${command.name} ${command.usage}\``;
            return message.channel.send(reply);
        };
    };
    // Execution
    try {
        command.execute(client, message, args);
    } catch (error) {
        console.error(error);
        return message.channel.send('there was an error trying to execute that command!');
    };

    // Anti mp
    if (command.guildOnly && message.channel.type === 'dm') {
        return message.reply('I can\'t execute that command inside DMs!');
    };

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }
    
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
        message.react("⏰");
    };
})

// Login
client.login(config.token);