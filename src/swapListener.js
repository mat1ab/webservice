
const ethers = require('ethers');
const pairAbi = require("./abis/pair_abi.json");
const AWS = require('aws-sdk'),
      {
        DynamoDBDocument
      } = require("@aws-sdk/lib-dynamodb"),
      {
        DynamoDB
      } = require("@aws-sdk/client-dynamodb");
AWS.config.update({region: 'us-east-1'});

const pairAddresses = require('./assets/pair_address.json');

const dynamoDB = DynamoDBDocument.from(new DynamoDB());

let counter = 0;
let chalk;

import('chalk').then((module) => {
  chalk = module.default;
});

async function storeEventToDynamoDB(userID, transactionHash, eventName, blockNumber, eventData, timestamp, pairAddress) {
  const params = {
    TableName: 'test-events', 
    Item: {
      'UserID': userID,
      'TransactionHash': transactionHash,
      'EventName': eventName,
      'BlockNumber': blockNumber,
      'EventData': eventData,
      'Timestamp': timestamp,
      'PairAddress': pairAddress,
    }
  };

  try {
    await dynamoDB.put(params);
    console.log(`Successfully stored event ${eventName} with transaction hash ${transactionHash}`);
  } catch (err) {
    console.error(chalk.red(`Error occurred when storing event: ${err}`));
  }
}

async function handleSwapEvent(userID, amount0In, amount1In, amount0Out, amount1Out, to, event) {
  try {
    counter++;
    const timestamp = new Date().toISOString();
    console.log(chalk.green(`Listening no.#${counter} swap event at ${timestamp}:`));

    console.log(`Transaction target address: ${to}`);

    if(event.transactionHash){
      console.log(`Transaction Hash: ${event.transactionHash}`);
      console.log(`Address: ${event.address}`);
      const eventData = JSON.stringify(event); 
      await storeEventToDynamoDB(userID, event.transactionHash, event.event, event.blockNumber, eventData, timestamp, event.address);
    } else {
      console.log(chalk.red(`Pair listener: Transaction Hash not found`));
    }
  } catch (error) {
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
