const ethers = require('ethers');
const provider = new ethers.providers.WebSocketProvider('wss://testnet.era.zksync.dev/ws');
const pairAddress = '0xfd13C46Bb7B722AF3E7Ead3b7236f939c0cd3adA';
const pairAbi = require("../abis/pair_abi.json");;
let pair = new ethers.Contract(pairAddress, pairAbi, provider);
let counter = 0;

pair.on("Swap", function() {
  try {
    counter++;
    const timestamp = new Date().toISOString();

    console.log(`Listening no.#${counter} swap event  at ${timestamp}:`);
    console.log(`transaction target address: ${arguments[3]}`);

    // Check if argument 6 is an object, if so, stringify it
    if (typeof arguments[6] === 'object' && arguments[6] !== null) {
      console.log(`transaction details (argument 6): ${JSON.stringify(arguments[6], null, 2)}`);
    } else {
      console.log(`transaction details (argument 6): ${arguments[6]}`);
    }
  } catch (error) {
    console.error(`Pair listener: An error occurred while processing the swap event: ${error}`);
  }
});

provider.on('error', (error) => {
  console.error(`Pair listener: An error occurred with the provider: ${error}`);
});
