const express = require("express");
const expressApp = express();
const axios = require("axios");
const path = require("path");
const ethers = require("ethers");
expressApp.use(express.static("static"));
expressApp.use(express.json());
require("dotenv").config();

const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

expressApp.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

// Replace with your Infura Project ID or other provider URL
const provider = new ethers.InfuraProvider("mainnet", process.env.INFURA_PROJECT_ID);

const UNISWAP_FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const UNISWAP_FACTORY_ABI = [
    "event PairCreated(address indexed token0, address indexed token1, address pair, uint)"
];
// Create a contract instance
const uniswapFactoryContract = new ethers.Contract(
    UNISWAP_FACTORY_ADDRESS,
    UNISWAP_FACTORY_ABI,
    provider
);

uniswapFactoryContract.on('PairCreated', (token0, token1, pair, event) => {
    bot.telegram.sendMessage(
        process.env.TELEGRAM_CHANNEL_ID,
        `New pair created! Token0: ${token0}, Token1: ${token1}, Pair Address: ${pair}`,
        {}
    );
    console.log(`New pair created! Token0: ${token0}, Token1: ${token1}, Pair Address: ${pair}`);
    console.log(event);
});

bot.command("start", (ctx) => {
  console.log(ctx.from);
  console.log(ctx.chat.id);
  bot.telegram.sendMessage(
    ctx.chat.id,
    "Hello there! Welcome to the Climax Telegram Ethereum Bot.\nI respond to /ethereum. Please try it",
    {}
  );
});

bot.command("ethereum", (ctx) => {
  var rate;
  console.log(ctx.from);
  axios
    .get(
      `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`
    )
    .then((response) => {
      console.log(response.data);
      rate = response.data.ethereum;
      const message = `Hello, today the ethereum price is ${rate.usd}USD`;
      bot.telegram.sendMessage(ctx.chat.id, message, {});
    });
});

bot.launch();
// expressApp.use(bot.webhookCallback("/secret-path"));
// bot.telegram.setWebhook('<YOUR_CAPSULE_URL>/secret-path')

// const port = process.env.PORT || 8100;
// expressApp.listen(port, () => {
//   console.log("Listening on port " + port);
// });
