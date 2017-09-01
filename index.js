const TelegramBot = require('node-telegram-bot-api');
const token = '419514087:AAHnS7lf9bu2wLp2zk-eF0FueNHT1YHY0CY';
const bot = new TelegramBot(token, {polling: true});

console.log("** BOT LISTENING **");

bot.onText(/Start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome " +  msg.from.first_name);  
});

bot.onText(/Time/, (msg) => {
    bot.sendMessage(msg.chat.id, new Date());  
});

bot.onText(/Bullshit/, (msg) => {
    bot.sendMessage(msg.chat.id, ":hankey:");  
});

// bot.sendPhoto(msg.chat.id,"https://www.somesite.com/image.jpg" );
// bot.sendPhoto(msg.chat.id,"https://www.somesite.com/image.jpg" );
//  bot.sendLocation(msg.chat.id,44.97108, -104.27719);

bot.on('message', (msg) => {
    console.log("Message received: " +  msg.text);   
    
    bot.sendMessage(msg.chat.id, "Response:", {
        "reply_markup": {"keyboard": [["Start", "Time"],   ["Test"], ["Bullshit"]]}
    });

    var what = "idiot";
    if (msg.text.includes(what)) {
        bot.kickChatMember(msg.chat.id,  msg.from.id);
    }          
});