PROJ_ROOT=process.env.PROJ_ROOT
const ethers = require('ethers');
const provider = new ethers.providers.WebSocketProvider('wss://testnet.era.zksync.dev/ws');
const atCorePairAddresses = require(`${PROJ_ROOT}/src/assets/pair_address.json`);
const pairAbi = require(`${PROJ_ROOT}/src/abis/at_core_pair_abi.json`);
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const logger = require(`${PROJ_ROOT}/src/config/winston`);

let counter = 0;

async function getTransactionDetails(transactionHash) {
  try {
    const transaction = await provider.getTransaction(transactionHash);
    logger.info(`From:${transaction.from}`);
    console.log('From:', transaction.from);
    return transaction.from.toString();
  } catch (error) {
    logger.error(`Error getting transaction details:${err}`);
    console.error('Error getting transaction details:', error);
    return null;
  }
}

async function storeEventToDynamoDB(userID, transactionHash, eventName, blockNumber, eventData, timestamp, atCorePairAddress) {
  const params = {
    TableName: 'ADP1',
    Item: {
      'UserID': userID,
      'TransactionHash': transactionHash,
      'EventName': eventName,
      'BlockNumber': blockNumber,
      'EventData': eventData,
      'Timestamp': timestamp,
      'PairAddress': atCorePairAddress
    }
  };

  try {
    await dynamoDB.put(params).promise();
    logger.info(`Successfully stored event ${eventName} with transaction hash ${transactionHash}`);
    console.log(`Successfully stored event ${eventName} with transaction hash ${transactionHash}`);
  } catch (err) {
    logger.error(`Error occurred when storing event: ${err}`);
    console.error(`Error occurred when storing event: ${err}`);
  }
}

async function handleMintEvent(sender, amount0, amount1, event) {
  counter++;
  const timestamp = Math.floor(Date.now() / 1000);
  const transactionHash = event.transactionHash;
  const userID = await getTransactionDetails(transactionHash);
  logger.info(`Listening no.#${counter} Mint event at ${timestamp}:`);
  console.log(`Listening no.#${counter} Mint event at ${timestamp}:`);

  // Store the event data to DynamoDB
  await storeEventToDynamoDB(
    userID,
    transactionHash,
    'Mint',
    event.blockNumber,
    JSON.stringify(event),
    timestamp,
    event.address
  );
  logger.info(`Event object: ${JSON.stringify(event, null, 2)}`);
  console.log(`Event object: ${JSON.stringify(event, null, 2)}`);
}

async function handleBurnEvent(sender, amount0, amount1, to, event) {
  counter++;
  const timestamp = Math.floor(Date.now() / 1000);
  const transactionHash = event.transactionHash;
  const userID = await getTransactionDetails(transactionHash);
  logger.info(`Listening no.#${counter} Burn event at ${timestamp}:`);
  console.log(`Listening no.#${counter} Burn event at ${timestamp}:`);

  // Store the event data to DynamoDB
  await storeEventToDynamoDB(
    userID,
    transactionHash,
    'Burn',
    event.blockNumber,
    JSON.stringify(event),
    timestamp,
    event.address
  );
  logger.info(`Event object: ${JSON.stringify(event, null, 2)}`);
  console.log(`Event object: ${JSON.stringify(event, null, 2)}`);
}

function start(provider) {
  atCorePairAddresses.forEach(atCorePairAddress => {
    logger.info('Starting to listen for Mint and Burn events...');
    console.log('Starting to listen for Mint and Burn events...');
    const pairContract = new ethers.Contract(atCorePairAddress, pairAbi, provider);
    pairContract.on('Mint', handleMintEvent);
    pairContract.on('Burn', handleBurnEvent);
  });
}

module.exports = {
  start
};
