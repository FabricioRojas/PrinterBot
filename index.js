const TelegramBot = require('node-telegram-bot-api');
const apiToken = require('./token.js');
const bot = new TelegramBot(apiToken.get(), {polling: true});
const ptp = require("pdf-to-printer");
const whiteList = ["395625211", "339062381"];

console.log("** BOT LISTENING **");

bot.onText(/Start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome " +  msg.from.first_name + ", I'll be your printer assistant.");  
});

bot.onText(/Time/, (msg) => {
    bot.sendMessage(msg.chat.id, new Date());  
});

bot.on('document', (doc) => {
    console.log("document received: " , doc.from.id, whiteList.indexOf(doc.from.id+''), doc.document.file_name, doc.document.mime_type);
    if(whiteList.indexOf(doc.from.id+'') != -1){  
        let filePromise = bot.downloadFile(doc.document.file_id, "downloads");
        const options = {
            printer: "DCPL2500D"
        };
        filePromise.then((filePath) => {
            ptp.print(filePath, options)
                .then("then", console.log)
                .catch("catch", console.error);
        });
    }
});

bot.on('photo', (img) => {
    console.log("photo received: " , img.from.id, whiteList.indexOf(img.from.id+''), img.photo);
});

bot.on('message', (msg) => {  
    if(msg.text){
        console.log("Message received: " +  msg.text, msg.from.id, msg.from.first_name); 
        // bot.sendMessage(msg.chat.id, , {
        //     "reply_markup": {"keyboard": [["Start", "Time"],   ["Test"]]}
        // });
        // var what = "idiot";
        // if (msg.text.includes(what)) {
        //     bot.kickChatMember(msg.chat.id,  msg.from.id);
        // }   
    }       
});