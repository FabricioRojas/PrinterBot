const config = require('./config.js');
const fs = require('fs');
const { exec } = require("child_process");
const TelegramBot = require('node-telegram-bot-api');
const { Console } = require('console');
const bot = new TelegramBot(config.getToken(), {polling: true});
const whiteList = config.getWhiteList();
const commandsList = { "reply_markup": { "keyboard": [["Double", "Pages"], ["Landscape", "Cancel"], ["Set default printer", "Reset"], ["Status", "About"], ["Size", "Hoyo"]]}};

var doubledSided = "";
var pages = '';
var size = '';
var doubledSidedLand = '';
var receivedImage = null;
var customPrinter = null;
var setPages = null;
var setSize = null;

console.log("** BOT LISTENING **");

bot.onText(/start/, (msg) => {
    bot.sendMessage(msg.chat.id, `Welcome ${msg.from.first_name} , I'll be your printer assistant. I could print any file or image you send me.`, commandsList);  
});
bot.onText(/About/, (msg) => {
    bot.sendMessage(msg.chat.id, `Welcome ${msg.from.first_name} , I'll be your printer assistant. I could print any file or image you send me.`, commandsList);  
});
bot.onText(/Cancel/, (msg) => { cancelProcess(msg); });
bot.onText(/Status/, (msg) => { checkStatus(msg); });
bot.onText(/Set default printer/, (msg) => { 
    bot.sendMessage(msg.from.id,`Which printer do you want to set as default? (Type "Reset" to set the default config)`, commandsList);
    customPrinter = true; 
});
bot.onText(/Size/, (msg) => { 
    bot.sendMessage(msg.from.id,`Set the page size you want to print ( a4, a5 )`, commandsList);
    setSize = true;
});
bot.onText(/Double/, (msg) => { 
    if(msg.text) doubledSided = ' -o sides=two-sided-long-edge';
    bot.sendMessage(msg.from.id,`Print mode has been changed to doubled sided`, commandsList);
});

bot.onText(/Landscape/, (msg) => { 
    if(msg.text) doubledSidedLand = ' -o sides=two-sided-short-edge';
    bot.sendMessage(msg.from.id,`Print mode has been changed to doubled sided landscape`, commandsList);
});
bot.onText(/Pages/, (msg) => { 
    bot.sendMessage(msg.from.id,`Set the pages you want to print ( comma separated numbers: 1,2,3 )`, commandsList);
    setPages = true; 
});
bot.onText(/Reset/, (msg) => {
    msg.text = "";
    setPrinter(msg);
    bot.sendMessage(msg.from.id,`All parameters reseted`, commandsList);
});

bot.on('document', (doc) => {
    console.log("document received: " , doc.from.id, whiteList.indexOf(doc.from.id+''), doc.document.file_name, doc.document.mime_type);
    if(whiteList.indexOf(doc.from.id+'') != -1){  
        bot.sendMessage(doc.from.id,`File received: ${doc.document.file_name}`, commandsList);
        let filePromise = bot.downloadFile(doc.document.file_id, "/var/www/development/PrinterBot/downloads");
        filePromise.then((filePath) => { printFile(doc, filePath); });
    }
});

bot.on('photo', (img) => {
    console.log("photo received: " , img.from.id, whiteList.indexOf(img.from.id+''), img.photo);
    if(whiteList.indexOf(img.from.id+'') != -1){  
        bot.sendMessage(img.from.id,`Image received, now select which resolution you want to print:`, commandsList);
        bot.sendMessage(img.from.id,`0: low, 1: medium, 2: high`, commandsList);
        receivedImage = img.photo;
    }
});

bot.on('message', (msg) => {  
    if(msg.text){
        if(whiteList.indexOf(msg.from.id+'') != -1){
            if (receivedImage && parseInt(msg.text) > 0) printImage(msg);
            if (customPrinter){
                if(msg.text.toLocaleLowerCase == "reset")msg.text = "";
                setPrinter(msg);         
                customPrinter = null;
            }
            if (setPages){
                if(msg.text) pages = ` -P "${msg.text}"`;
                setPages = null;
                bot.sendMessage(msg.from.id,`Pages to print: ${msg.text}`, commandsList);
            }
            if (setSize){
                if (msg.text) size = ` -o media="${msg.text}" `;
                setSize = null;
                bot.sendMessage(msg.from.id,`Page size set to: ${msg.text}`, commandsList);
            }
        }
        console.log("Message received: " +  msg.text, msg.from.id, msg.from.first_name);
        // bot.sendMessage(msg.from.id,`I could print any file or image you send me.`, commandsList);
    }       
});

function printImage(msg){
    if(receivedImage[parseInt(msg.text)]){
        let filePromise = bot.downloadFile(receivedImage[parseInt(msg.text)].file_id, "/var/www/development/PrinterBot/downloads");
        filePromise.then((filePath) => { 
            printFile(msg, filePath); 
            receivedImage = null;
        });
    }else{
        bot.sendMessage(msg.from.id,`Unknown resolution, please try one of these: (Just the numbers)`, commandsList);
        bot.sendMessage(msg.from.id,`0: low, 1: medium, 2: high`, commandsList);
    }
}

function printFile(msg, filePath){
    exec(`lp -d ${getPrinter(msg)} ${filePath}${pages}${size}${doubledSided != '' ? doubledSided : doubledSidedLand} -o page-bottom=0 -o page-left=0 -o page-top=0 -o page-right=0`, (error, stdout, stderr) => {
        if (error) {
            resetParams(msg);
            bot.sendMessage(msg.from.id,`Couldn't send file to printer due to an error. Code 05`, commandsList);
            bot.sendMessage(msg.from.id,`Error: ${error.message}`, commandsList);
            return;
        }
        if (stderr) {        
            resetParams(msg);    
            bot.sendMessage(msg.from.id,`Couldn't send file to printer due to an error. Code 06`, commandsList);
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        bot.sendMessage(msg.from.id,`File sent to printer ${getPrinter(msg)}`, commandsList);
        resetParams(msg);
    });
}

function checkStatus(msg){
    exec(`lpc status ${getPrinter(msg)}`, (error, stdout, stderr) => {
        if (error) {
            bot.sendMessage(msg.from.id,`Couldn't check printer status due to an error. Code 03`, commandsList);
            console.log(`checkStatus error: ${error.message}`);
            return;
        }
        if (stderr) {            
            bot.sendMessage(msg.from.id,`Couldn't check printer status due to an error. Code 04`, commandsList);
            console.log(`checkStatus stderr: ${stderr}`);
            return;
        }
        if(stdout){
            console.log(`checkStatus stdout: ${stdout}`);
            var printerStatus = stdout.split('\n')[4];
            var numberFiles = parseInt(printerStatus.split(' ')[0]);
            if(numberFiles > 0) bot.sendMessage(msg.from.id,`There are : ${numberFiles} files on the printer queue.`, commandsList);
            else bot.sendMessage(msg.from.id,`There printer queue is empty.`, commandsList);
        }else{
            bot.sendMessage(msg.from.id,`It seems the printer "${getPrinter(msg)}" couldn't be found`, commandsList);
        }
    });

function cancelProcess(msg){
    resetParams(msg);
    exec(`cancel -a ${getPrinter(msg)}`, (error, stdout, stderr) => {
        if (error) {
            bot.sendMessage(msg.from.id,`Couldn't empty the queue due to an error. Code 01`, commandsList);
            console.log(`cancelProcess error: ${error.message}`);
            return;
        }
        if (stderr) {
            bot.sendMessage(msg.from.id,`Couldn't empty the queue due to an error. Code 02`, commandsList);
            console.log(`cancelProcess stderr: ${stderr}`);
            return;
        }
        console.log(`cancelProcess stdout: ${stdout}`);
        bot.sendMessage(msg.from.id,`The printer queue is empty now!`, commandsList);
    });
}

function getPrinter(msg){
    printer = config.getPrinter().printer;
    try{ 
        var bf = fs.readFileSync("printer.txt");
        printer = bf.toString() != '' ? bf.toString() : printer;
    }catch(err){
        console.log(`getPrinter err: ${err}`);
        bot.sendMessage(msg.from.id,`Couldn't get the default printer due to an error. Code 07`, commandsList);
    }
    return printer;
}

function setPrinter(msg){
    resetParams(msg);
    try{ 
        fs.writeFileSync('printer.txt', msg.text)
        bot.sendMessage(msg.from.id,`"${getPrinter(msg)}" is now the default printer`, commandsList);
    }catch(err){
        console.log(`setPrinter err: ${err}`);
        bot.sendMessage(msg.from.id,`Couldn't set the default printer due to an error. Code 08`, commandsList);
    }
    return printer;
}

function resetParams(msg){
    doubledSided = "";
    doubledSidedLand = "";
    pages = '';
    bot.sendMessage(msg.from.id,`Print mode has been changed to one sided`, commandsList);
    bot.sendMessage(msg.from.id,`Pages to print: All pages`, commandsList);
}
