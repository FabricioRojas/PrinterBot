# PrinterBot
Is a simple Telegram Bot that receives files and print them



## Installation

You must creat a new file called **config.js** on root directyory with this content:

```
const API_TOKEN = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const WHITE_LIST = ["XXXXXXXXX"];
const PRINTER = {printer: "XXXXXXXXX"};

module.exports = {
    getToken: function () {
        return API_TOKEN;
    },
    getWhiteList: function () {
        return WHITE_LIST;
    },
    getPrinter: function () {
        return PRINTER;
    }
};
```

- **API_TOKEN** : Is the token provided by "BotFather" after you create a new bot
- **WHITE_LIST** : Is the list of authorized Telegram users ids that will have access to your bot
- **PRINTER** : Is the default's printer name
