const Discord = require("discord.js");
const discordBOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

var message = {
    alertDiscord: async function (text) {
        try {
            var discordClient = new Discord.Client({
                intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMessages],
                partials: ["CHANNEL"]
            })
    
            var finished = false
            var count = 0
            while (count < 3 && !finished) {
                try {
                    await discordClient.login(discordBOT_TOKEN);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    await discordClient.channels.cache.get("1048086603630915664").send(text)
                    var finished = true
                } catch (err) {
                    console.log(err)
                    count++
                }
            }
    
            return finished
        } catch (error) {
            console.log(error)
            return null
        } finally {
            await discordClient.destroy()
        }
    },
}

exports.message = message;