const { Client, LocalAuth} = require('whatsapp-web.js');
const {getChannel} = require("./util/discord-utils");
const {bot} = require("./discord-manager");


const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: 'auth'
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

console.log('Connecting to Whatsapp...')

client.on('ready', () => {
    console.log(`Whatsapp Connnected to server ${client.info.wid.server} | Logged in as ${client.info.wid.user}`);
});

client.on('disconnected', async () => {
    console.log("Whatsapp disconnected");
    getChannel(bot, bot.controlRoom).send({ content: 'Whatsapp Disconnected' });
    await client.destroy();
    await client.initialize();
})

client.on('authenticated', () => {
    getChannel(bot, bot.controlRoom).send({ content: 'Whatsapp Authenticated' });
})

client.initialize();

module.exports = {
    wa: client
};
