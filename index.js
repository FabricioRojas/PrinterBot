const TelegramBot = require('node-telegram-bot-api');
const token = '419514087:AAHnS7lf9bu2wLp2zk-eF0FueNHT1YHY0CY';
const bot = new TelegramBot(token, {polling: true});
const ptp = require("pdf-to-printer");

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

bot.on('document', (doc) => {
    console.log("document received: " , doc.document.file_name, doc.document.file_id, doc.document.mime_type);  
    let filePromise = bot.downloadFile(doc.document.file_id, "downloads");
    const options = {
        printer: "DCPL2500D"
    };
    filePromise.then((filePath) => {
        ptp.print(filePath, options)
            .then("then", console.log)
            .catch("catch", console.error);
    });
});

// bot.sendPhoto(msg.chat.id,"https://www.somesite.com/image.jpg" );
// bot.sendPhoto(msg.chat.id,"https://www.somesite.com/image.jpg" );
//  bot.sendLocation(msg.chat.id,44.97108, -104.27719);

bot.on('message', (msg) => {  
    if(msg.text){
        console.log("Message received: " +  msg.text); 
        bot.sendMessage(msg.chat.id, "Response:", {
            "reply_markup": {"keyboard": [["Start", "Time"],   ["Test"], ["Bullshit"]]}
        });

        var what = "idiot";
        if (msg.text.includes(what)) {
            bot.kickChatMember(msg.chat.id,  msg.from.id);
        }   
    }       
});