const ethers = require('ethers');
const provider = new ethers.providers.WebSocketProvider('wss://testnet.era.zksync.dev/ws');
const factoryAddress = '0x19f15De2Da77B17983A6171F61ECEdcC2784BB0d'; 
const factoryAbi = require("../ABI/factory_abi.json");


let factory = new ethers.Contract(factoryAddress, factoryAbi, provider);

// listen to PairCreated events
factory.on("PairCreated", (token0, token1, pairAddress, event) => {
  console.log(`Pair created: ${pairAddress} with token pair ${token0} and ${token1}`);
});
