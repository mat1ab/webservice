const ethers = require('ethers');
const SwapListener = require('./swapListener');

const providerUrl = 'wss://testnet.era.zksync.dev/ws';
let provider;

function keepAlive() {
  setInterval(async () => {
    try {
      console.log("Keep alive: latest block is ", await provider.getBlockNumber());
    } catch (err) {
      console.error("Error occurred in keepAlive: ", err);
    }
  }, 30000);  // 30 seconds
}

function connectToProvider() {
  provider = new ethers.providers.WebSocketProvider(providerUrl);

  provider.on("error", () => {
    console.error("WebSocket error occurred, trying to reconnect...");
    setTimeout(connectToProvider, 3000);
  });

  provider.on("close", () => {
    console.error("WebSocket connection closed, trying to reconnect...");
    setTimeout(connectToProvider, 3000);
  });

  provider.on("end", () => {
    console.error("WebSocket connection ended, trying to reconnect...");
    setTimeout(connectToProvider, 3000);
  });

  SwapListener.start(provider);
  keepAlive();
}

connectToProvider();
