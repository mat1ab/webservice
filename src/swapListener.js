const ethers = require('ethers');
const AWS = require('aws-sdk');

const PROJ_ROOT = process.env.PROJ_ROOT;

const pairAbi = require(`${PROJ_ROOT}/src/abis/pair_abi.json`);
const logger = require(`${PROJ_ROOT}/src/winston`);
const config = require(`${PROJ_ROOT}/src/config/config.json`); 

AWS.config.update({
  region: config.awsRegion,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

let counter = 0;
let chalk;

import('chalk').then((module) => {
  chalk = module.default;
});

async function loadPairAddressesFromDB() {
  const params = {
      TableName: 'TokenPairs',
      ProjectionExpression: "pairAddress",
  };

  try {
      const result = await dynamoDB.scan(params).promise();
      console.log('1111111',result);
      return result.Items.map(item => item.pairAddress);
  } catch (error) {
      console.error("Error fetching pair addresses from database:", error);
      return [];
  }
}


async function storeEventToDynamoDB(userID, transactionHash, eventName, blockNumber, eventData, timestamp, pairAddress) {
  const params = {
    TableName: 'ADP1', 
    Item: {
      'UserID': userID,
      'TransactionHash': transactionHash,
      'EventName': eventName,
      'BlockNumber': blockNumber,
      'EventData': eventData,
      'Timestamp': timestamp,
      'PairAddress': pairAddress
    }
  };

  try {
    await dynamoDB.put(params).promise();
    logger.info(`Successfully stored event ${eventName} with transaction hash ${transactionHash}`);
    console.log(`Successfully stored event ${eventName} with transaction hash ${transactionHash}`);
  } catch (err) {
    logger.error(`Error occurred when storing event: ${err}`);
    console.error(chalk.red(`Error occurred when storing event: ${err}`));
  }
}

async function handleSwapEvent(userID, amount0In, amount1In, amount0Out, amount1Out, to, event) {
  try {
    counter++;
    const timestamp = Math.floor(Date.now() / 1000);
    const userID = to.toString();
    console.log(chalk.green(`Listening no.#${counter} swap event at ${timestamp}:`));
    logger.info(`Listening no.#${counter} swap event at ${timestamp}:`);

    console.log(`Transaction target address: ${to}`);
    logger.info(`Transaction target address: ${to}`);

    if (event.transactionHash) {
      console.log(`Transaction Hash: ${event.transactionHash}`);
      console.log(`Address: ${event.address}`);
      const eventData = JSON.stringify(event);
      await storeEventToDynamoDB(
        userID,
        event.transactionHash,
        event.event,
        event.blockNumber,
        eventData,
        timestamp,
        event.address
      );
    } else {
      logger.info(`Pair listener: Transaction Hash not found`);
      console.log(chalk.red(`Pair listener: Transaction Hash not found`));
    }
  } catch (error) {
    logger.error(`Pair listener: An error occurred while processing the swap event: ${error}`);
    console.error(chalk.red(`Pair listener: An error occurred while processing the swap event: ${error}`));
  }
}

async function start(provider) {
  const listenForSwapEvents = async () => {
    const pairAddresses = await loadPairAddressesFromDB();
    pairAddresses.forEach(pairAddress => {
      const pairContract = new ethers.Contract(pairAddress, pairAbi, provider);
      pairContract.on('Swap', handleSwapEvent);
    });
  };


  await listenForSwapEvents();

  setInterval(async () => {
    await listenForSwapEvents();
  }, 30000);
}

module.exports = {
  start
};



