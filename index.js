require('dotenv').config()
const { Sequelize, DataTypes} = require('sequelize');
const QRCode = require('qrcode');
const QRCodeTerminal = require('qrcode-terminal');

const { bot } = require('./discord-manager');
const { wa } = require('./wa-manager');
const {getDisplayName, cleanChatName} = require("./util/wa-utils");
const {ChannelType, WebhookType} = require("discord.js");
const {getChannel, getGuild} = require("./util/discord-utils");

const token = process.env.BOT_TOKEN;
const db = new Sequelize('sqlite://db/storage.db', {
    logging: false,
    define: {
        timestamps: false,
        freezeTableName: true,
    },
});

(async() => {
    try {
        console.log('Connecting to database...')
        await db.authenticate();
        console.log('Database Connected');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }

    await db.sync();

    const Chat = db.define('chat', {
        DC_CHAT: DataTypes.STRING,
        WA_CHAT: DataTypes.STRING,
        WID: DataTypes.STRING
    })

    await db.sync();
    await Chat.sync();

    bot.db.file = db;
    bot.db.Chat = Chat;

    console.log('Connecting to Discord...');
    bot.login(token);

    wa.on('qr', async (qr) => {
        console.log('QR RECEIVED');
        console.log(qr);
        QRCodeTerminal.generate(qr, {small: true});
        getChannel(bot, bot.controlRoom).send({ content: 'Whatsapp Authentication - Scan to login', files: [(await QRCode.toBuffer(qr))] });
    });

    wa.on('message', async(message) => {
        getGuild(bot);

        let chat = await wa.getChatById(message.from);
        let author = await message.getContact();

        let chatName = '';
        if(chat.isGroup) {
            chatName = cleanChatName(chat.name);
        }
        else {
            chatName = cleanChatName(getDisplayName(author));
        }

        let chatChannel = null;
        bot.guild.channels.cache.forEach(channel => {
            if(channel.name === chatName) {
                chatChannel = channel;
            }
        })

        if(!chatChannel) {
            chatChannel = await bot.guild.channels.create({
                name: chatName,
                type: ChannelType.GuildText
            });
            await chatChannel.setParent(await getChannel(bot, bot.category));

            bot.chats[chatName] = {
                wa: chat.isGroup ? chat.name : getDisplayName(author),
                wid: message.from
            };
            await Chat.create({
                DC_CHAT: chatName,
                WA_CHAT: bot.chats[chatName].wa,
                WID: bot.chats[chatName].wid
            })
        }

        let webhook = null;
        (await chatChannel.fetchWebhooks()).forEach(w => {
            if(w.type === WebhookType.Incoming && w.name === 'WHATSAPP') {
                webhook = w;
            }
        })

        if(!webhook) {
            webhook = await chatChannel.createWebhook({ name: 'WHATSAPP', avatar: 'assets/whatsapp.png'});
        }

        let msg = message.body;
        if(message.hasQuotedMsg) {
            let quote = await message.getQuotedMessage();
            if(quote.body !== '') {
                msg = `> ${quote.body} \n${msg}`;
            }
            else if(quote.hasMedia) {
                msg = `> media \n${msg}`;
            }
        }

        const payload = {
            username: getDisplayName(author),
            avatarURL: (await author.getProfilePicUrl()) || 'https://i.imgur.com/OkHGUWC.png'
        };

        if(msg !== '' || msg !== ' ') {
            payload.content = msg;
        }

        if(message.hasMedia) {
            let media = await message.downloadMedia();
            let bufferedMedia = new Buffer.from(media.data, "base64");
            payload.files = [bufferedMedia];
        }

        webhook.send(payload);
    });

    bot.on('messageCreate', async message => {
        if (message.author.bot || message.webhookId || !bot.chats[message.channel.name]) return;
        let chat = await wa.getChatById(bot.chats[message.channel.name].wid);
        await chat.sendMessage(message.content);
    })
})();
