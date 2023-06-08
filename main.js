PROJ_ROOT=process.env.PROJ_ROOT
const logger = require(`${PROJ_ROOT}/src/config/winston`);
const ethers = require('ethers');
const SwapListener = require(`${PROJ_ROOT}/src/swapListener`);
const AddLiqListener = require(`${PROJ_ROOT}/src/addLiqListener`);
const PairCreatedListener = require(`${PROJ_ROOT}/src/pairCreatedListener`)

const providerUrl = 'wss://testnet.era.zksync.dev/ws';
let provider;

async function keepAlive() {
  try {
    logger.info("Keep alive: latest block is " + await provider.getBlockNumber());
    console.log("Keep alive: latest block is ", await provider.getBlockNumber());
  } catch (err) {
    logger.error(`Error occurred in keepAlive: ${err}`);
    console.error("Error occurred in keepAlive: ", err);
  } finally {
    setTimeout(keepAlive, 60000);  // 60 seconds
  }
}

async function startSwapListener() {
  try {
    await SwapListener.start(provider);
  } catch (err) {
    logger.error(`Error occurred in SwapListener.start: ${err}`);
    console.error("Error occurred in SwapListener.start:", err);
    setTimeout(startSwapListener, 30000);  // 30 seconds
  }
}

async function startAddLiqListener() {
  try {
    await AddLiqListener.start(provider);
  } catch (err) {
    logger.error(`Error occurred in AddLiqListener.start: ${err}`);
    console.error("Error occurred in AddLiqListener.start:", err);
    setTimeout(startAddLiqListener, 30000);  // 30 seconds
  }
}

async function startPairCreatedListener() {
  try {
    await PairCreatedListener.start(provider);
  } catch (err) {
    logger.error(`Error occurred in AddLiqListener.start: ${err}`);
    console.error("Error occurred in AddLiqListener.start:", err);
    setTimeout(startAddLiqListener, 30000);  // 30 seconds
  }
}
function connectToProvider() {
  provider = new ethers.providers.WebSocketProvider(providerUrl);

  provider.on("error", () => {
    logger.error("WebSocket error occurred, trying to reconnect...");
    console.error("WebSocket error occurred, trying to reconnect...");
    setTimeout(connectToProvider, 30000);
  });

  provider.on("close", () => {
    console.error("WebSocket connection closed, trying to reconnect...");
    setTimeout(connectToProvider, 30000);
  });

  provider.on("end", () => {
    console.error("WebSocket connection ended, trying to reconnect...");
    setTimeout(connectToProvider, 30000);
  });

  startSwapListener();
  startAddLiqListener();
  startPairCreatedListener();
  keepAlive();
}

connectToProvider();
