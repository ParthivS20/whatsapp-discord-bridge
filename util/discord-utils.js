const getChannel = (bot, channel) => {
    let id = channel.id || channel;
    let newChannel = bot.guild.channels.cache.get(id);
    return newChannel || bot.guild.channels.fetch(id);
}

const getGuild = bot => {
    let id = process.env.GUILD_ID;
    let newGuild = bot.guilds.cache.get(id);
    bot.guild = newGuild || bot.guilds.cache.get(id);
    return bot.guild;
}

module.exports = {
    getChannel: getChannel,
    getGuild: getGuild
}
