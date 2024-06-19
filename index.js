const express = require("express");
const expressApp = express();
const axios = require("axios");
const path = require("path");
const ethers = require("ethers");
expressApp.use(express.static("static"));
expressApp.use(express.json());
require("dotenv").config();
const { Telegraf } = require("telegraf");
const {getTokenName, calculateInitialLiquidityValue} = require("./utils");
const bot = new Telegraf(process.env.BOT_TOKEN);

expressApp.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

// Replace with your Infura Project ID or other provider URL
const provider = new ethers.InfuraProvider("mainnet", process.env.INFURA_PROJECT_ID);

const UNISWAP_FACTORY_ADDRESS = process.env.UNISWAP_FACTORY_ADDRESS;
const UNISWAP_FACTORY_ABI = [
    "event PairCreated(address indexed token0, address indexed token1, address pair, uint)"
];

// Send message to channel
async function sendToChannel( tokAddr0, tokAddr1, pair) {
    try {
        const {name: tok0Name, sym: tok0Sym} = await getTokenName(tokAddr0);
        let {name: tok1Name, sym: tok1Sym} = await getTokenName(tokAddr1);
        let liquidity = await calculateInitialLiquidityValue(pair, tokAddr0, tokAddr1);

        let content = `New pair at Uniswap V2 v2
                    ${tok1Name} (${tok1Sym}/${tok0Sym})
                    Initial Liquidity: $${liquidity}
                    Token contract:
                    ${tokAddr1}
                    DEXTOOLS:
                    https://www.dextools.io/app/ether/pair-explorer/${pair}

        `
        let url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage?chat_id=@ClimaxUniswapToken&text=${content}`;
        let response = await axios.post(url);
        console.log(`Message sent to channel:`);
    } catch (error) {
        console.error(`Error sending message to channel`, error);
    }
}

// Create a contract instance
const uniswapFactoryContract = new ethers.Contract(
    UNISWAP_FACTORY_ADDRESS,
    UNISWAP_FACTORY_ABI,
    provider
);
//-----------------------Pair created--------------------------
uniswapFactoryContract.on('PairCreated', (token0, token1, pair, event) => {
    sendToChannel(token0, token1, pair);
    console.log(`New pair created! Token0: ${token0}, Token1: ${token1}, Pair Address: ${pair}`);
    console.log(event);
});
//------------A user joined the channel --------------------------
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
      `https://api.coingecko.com/api/v2/simple/price?ids=ethereum&vs_currencies=usd`
    )
    .then((response) => {
      console.log(response.data);
      rate = response.data.ethereum;
      const message = `Hello, today the ethereum price is ${rate.usd}USD`;
      bot.telegram.sendMessage(ctx.chat.id, message, {});
    });
});
sendToChannel("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0xEc195eD35664C19aAb6e6110ddbF79f4526d6a55", 
    "0xc5796B35317132F0A54bdc4479D61A11Ddc0d87d");
bot.launch().then(() => {
    console.log('Bot is running and listening for updates...');
}).catch(err => {
    console.error('Error starting bot:', err);
})