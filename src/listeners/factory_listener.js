const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
const provider = new ethers.providers.WebSocketProvider('wss://testnet.era.zksync.dev/ws');
const factoryAddress = '0xec10d31F75840c768C5b94A9094Fbac21BD985C9'; 
const factoryAbi = require("../abis/factory_abi.json");

let factory = new ethers.Contract(factoryAddress, factoryAbi, provider);

// Get the path of the file
const filePath = path.join(__dirname, './assets/pair_address.json');

// Initialize the file if it doesn't exist
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify([]));
}

// Listen to PairCreated events
factory.on("PairCreated", (token0, token1, pairAddress, event) => {
  console.log(`Pair created: ${pairAddress} with token pair ${token0} and ${token1}`);

  // Read the file
  const data = JSON.parse(fs.readFileSync(filePath));

  // Add the new pair address
  data.push({
    address: pairAddress,
    token0: token0,
    token1: token1
  });

  // Write the file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
});
