PROJ_ROOT = process.env.PROJ_ROOT
const ethers = require('ethers');
const pairAbi = require(`${PROJ_ROOT}/src/abis/pair_abi.json`);
const logger = require(`${PROJ_ROOT}/src/config/winston`);
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});


const pairAddresses = require(`${PROJ_ROOT}/src/assets/pair_address.json`);

const dynamoDB = new AWS.DynamoDB.DocumentClient();

let counter = 0;
let chalk;

import('chalk').then((module) => {
  chalk = module.default;
});

async function storeEventToDynamoDB(userID, transactionHash, eventName, blockNumber, eventData, timestamp, pairAddress, amount0In, amount1In, amount0Out, amount1Out, hasSwapped) {
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

async function handleSwapEvent(to, event) {
  try {
    counter++;
    const timestamp = Math.floor(Date.now() / 1000);
    const userID = event.args[event.args.length - 1];
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

function start(provider) {
  pairAddresses.forEach(pairAddress => {
    const pairContract = new ethers.Contract(pairAddress, pairAbi, provider);
    pairContract.on('Swap', handleSwapEvent);
  });
}

module.exports = {
  start
};
