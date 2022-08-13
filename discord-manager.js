const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.db = {};
client.chats = {};

client.once('ready', async() => {
    console.log(`Discord Connected | Logged in as ${client.user.tag}`);
    client.guild = await client.guilds.fetch(process.env.GUILD_ID);
    await client.guild.channels.fetch();

    client.category = null;
    client.controlRoom = null;
    let chats = await client.db.Chat.findAll();
    client.guild.channels.cache.forEach(channel => {
        if (channel.type === ChannelType.GuildCategory && channel.name.toLowerCase() === 'whatsapp') {
            client.category = channel;

            channel.children.cache.forEach(async child => {
                if(child.name === 'control-room') {
                    client.controlRoom = child;
                }
                else {
                    let chatFound = false;
                    chats.forEach(chat => {
                        if(chat.DC_CHAT === child.name) {
                            chatFound = true;
                        }
                    })
                    if(!chatFound) child.delete();
                }
            });
        }
    });

    if(!client.category) {
        client.category = await client.guild.channels.create({
            name: 'whatsapp',
            type: ChannelType.GuildCategory
        });
    }

    if(!client.controlRoom) {
        client.controlRoom = await client.guild.channels.create({
            name: 'control-room',
            type: ChannelType.GuildText
        });
        await client.controlRoom.setParent(client.category);
    }

    for (const chat of chats) {
        let childFound = false;
        client.category.children.cache.forEach(child => {
            if(chat.DC_CHAT === child.name) {
                childFound = true;
            }
        })
        if(childFound) {
            client.chats[chat.DC_CHAT] = {
                wa: chat.WA_CHAT,
                wid: chat.WID
            };
        }
        else {
            await client.db.Chat.destroy({
                where: {
                    DC_CHAT: chat.DC_CHAT
                }
            });
        }
    }
});

module.exports = {
    bot: client
}
