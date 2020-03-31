const config = require('./config.js');
const ptp = require("pdf-to-printer");
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(config.getToken(), {polling: true});
const whiteList = config.getWhiteList();

console.log("** BOT LISTENING **");

bot.onText(/Start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome " +  msg.from.first_name + ", I'll be your printer assistant.");  
});

bot.on('document', (doc) => {
    console.log("document received: " , doc.from.id, whiteList.indexOf(doc.from.id+''), doc.document.file_name, doc.document.mime_type);
    if(whiteList.indexOf(doc.from.id+'') != -1){  
        let filePromise = bot.downloadFile(doc.document.file_id, "downloads");
        filePromise.then((filePath) => {
            ptp.print(filePath, config.getPrinter())
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
    }       
});