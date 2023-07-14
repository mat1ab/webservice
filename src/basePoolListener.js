const ethers = require('ethers');

const PROJ_ROOT = process.env.PROJ_ROOT;
const config = require(`${PROJ_ROOT}/src/config/config.json`);
const contractAddress = config.arr_eth_nftPool;
const basePoolAbi = require(`${PROJ_ROOT}/src/abis/basePool_abi.json`);

const provider = new ethers.providers.WebSocketProvider('wss://testnet.era.zksync.dev/ws');
const pairContract = new ethers.Contract(contractAddress, basePoolAbi, provider);

async function start() {
  pairContract.on("*", (event) => {
    console.log(event);
  });
}

module.exports = {
  start
};

