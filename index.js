const config = require('./config.js');
const { exec } = require("child_process");
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(config.getToken(), {polling: true});
const whiteList = config.getWhiteList();
const commandsList = {"reply_markup": {"keyboard": [["Cancel", "Status"], ["Set default printer"], ["About"]]}}

console.log("** BOT LISTENING **");

bot.onText(/Start/, (msg) => {
    bot.sendMessage(msg.chat.id, `Welcome ${msg.from.first_name} , I'll be your printer assistant. I could print any file or image you send me.`, commandsList);  
});
bot.onText(/Cancel/, (msg) => { cancelProcess(msg); });
bot.onText(/Status/, (msg) => { checkStatus(msg); });
bot.onText(/Set default printer/, (msg) => { console.log("set"); });

bot.on('document', (doc) => {
    console.log("document received: " , doc.from.id, whiteList.indexOf(doc.from.id+''), doc.document.file_name, doc.document.mime_type);
    if(whiteList.indexOf(doc.from.id+'') != -1){  
        bot.sendMessage(doc.from.id,`File received: ${doc.document.file_name}`, commandsList);
        let filePromise = bot.downloadFile(doc.document.file_id, "downloads");
        filePromise.then((filePath) => { printFile(doc, filePath); });
    }
});

bot.on('photo', (img) => {
    console.log("photo received: " , img.from.id, whiteList.indexOf(img.from.id+''), img.photo);
    if(whiteList.indexOf(img.from.id+'') != -1){  
        bot.sendMessage(img.from.id,`Image received`, commandsList);
        let filePromise = bot.downloadFile(img.photo[2].file_id, "downloads");
        filePromise.then((filePath) => { console.log(filePath); });
    }
});

bot.on('message', (msg) => {  
    if(msg.text){
        console.log("Message received: " +  msg.text, msg.from.id, msg.from.first_name); 
        // bot.sendMessage(msg.from.id,`I could print any file or image you send me.`, commandsList);
    }       
});

function printFile(msg, filePath){
    exec(`lp -d ${config.getPrinter().printer} ${filePath}`, (error, stdout, stderr) => {
        if (error) {
            bot.sendMessage(msg.from.id,`Couldn't send file to printer due to an error. Code 05`, commandsList);
            bot.sendMessage(msg.from.id,`Error: ${error.message}`, commandsList);
            return;
        }
        if (stderr) {            
            bot.sendMessage(msg.from.id,`Couldn't send file to printer due to an error. Code 06`, commandsList);
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        bot.sendMessage(msg.from.id,`File sent to printer ${config.getPrinter().printer}`, commandsList);
    });
}

function checkStatus(msg){
    exec(`lpc status ${config.getPrinter().printer}`, (error, stdout, stderr) => {
        if (error) {
            bot.sendMessage(msg.from.id,`Couldn't check printer status due to an error. Code 03`, commandsList);
            console.log(`getStatus error: ${error.message}`);
            return;
        }
        if (stderr) {            
            bot.sendMessage(msg.from.id,`Couldn't check printer status due to an error. Code 04`, commandsList);
            console.log(`getStatus stderr: ${stderr}`);
            return;
        }
        console.log(`getStatus1 stdout: ${stdout}`);
        var printerStatus = stdout.split('\n')[4];
        var numberFiles = parseInt(printerStatus.split(' ')[0]);
        if(numberFiles > 0) bot.sendMessage(msg.from.id,`There are : ${numberFiles} files on the printer queue.`, commandsList);
        else bot.sendMessage(msg.from.id,`There printer queue is empty.`, commandsList);
    });
}

function cancelProcess(msg){
    exec(`cancel -a ${config.getPrinter().printer}`, (error, stdout, stderr) => {
        if (error) {
            bot.sendMessage(msg.from.id,`Couldn't empty the queue due to an error. Code 01`, commandsList);
            console.log(`getStatus error: ${error.message}`);
            return;
        }
        if (stderr) {
            bot.sendMessage(msg.from.id,`Couldn't empty the queue due to an error. Code 02`, commandsList);
            console.log(`getStatus stderr: ${stderr}`);
            return;
        }
        console.log(`cancelProcess stdout: ${stdout}`);
        bot.sendMessage(msg.from.id,`The printer queue is empty now!`, commandsList);
    });
}