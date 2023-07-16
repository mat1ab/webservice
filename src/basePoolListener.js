const ethers = require('ethers');
const AWS = require('aws-sdk');
const addresses = require('./config/farmConfig.json'); 

const PROJ_ROOT = process.env.PROJ_ROOT;
const config = require(`${PROJ_ROOT}/src/config/config.json`);
const basePoolAbi = require(`${PROJ_ROOT}/src/abis/basePool_abi.json`);

const provider = new ethers.providers.WebSocketProvider('wss://testnet.era.zksync.dev/ws');

AWS.config.update({
  region: config.awsRegion,
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function handleTransferEvent(tokenId, to, from, lpTokenAddress, contractAddress) {
  console.log('Transfer event detected:');
  console.log(`- Token ID: ${tokenId}`);
  console.log(`- To: ${to}`);
  console.log(`- From: ${from}`);

  const compositeKey = `${contractAddress}-${to}`; 

  const params = {
      TableName: 'spNftTransferEvents',
      Item: {
        'compositeKey': compositeKey,
        'tokenId': Number(tokenId),
        'lpTokenAddress': lpTokenAddress,
        'userAddress': to,
        'from': from,
        'spNftAddress':contractAddress
      }
  };

  try {
      await dynamoDB.put(params).promise();
      console.log("Added item successfully.");
  } catch (err) {
      console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
  }
}

async function getPastEvents(pairContract) {
  const filter = pairContract.filters.Transfer(null, null, null);
  const events = await pairContract.queryFilter(filter, 0, 'latest');
  
  for (const event of events) {
    const {from, to, tokenId} = event.args;
    await handleTransferEvent(tokenId, to, from, pairContract.lpTokenAddress, pairContract.address);
  }
}

async function start() {
  for (let address of addresses) {
    const pairContract = new ethers.Contract(address.contractAddress, basePoolAbi, provider);
    pairContract.lpTokenAddress = address.lpTokenAddress;  
    await getPastEvents(pairContract);
    pairContract.on("Transfer", async (from, to, tokenId) => { 
        await handleTransferEvent(tokenId, to, from, pairContract.lpTokenAddress, pairContract.address);
    });
  }
}

module.exports = {
  start
};

