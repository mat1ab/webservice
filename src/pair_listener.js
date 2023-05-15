const ethers = require('ethers');
const provider = new ethers.providers.WebSocketProvider('wss://testnet.era.zksync.dev/ws');
const pairAddress = '0x3412aaDa3f72a81828210F1A8fb7fd8f4bd32907';
const pairAbi = require("../ABI/pair_abi.json");;
let pair = new ethers.Contract(pairAddress, pairAbi, provider);

// listen to Swap event
pair.on("Swap", (amount0In, amount1In, amount0Out, amount1Out, to, event) => {
  console.log(`swap event: 
  amount0In: ${amount0In.toString()} 
  amount1In: ${amount1In.toString()} 
  amount0Out: ${amount0Out.toString()} 
  amount1Out: ${amount1Out.toString()} 
  to: ${to}`);
});
