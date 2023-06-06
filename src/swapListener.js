const ethers = require('ethers');
const pairAbi = require("./abis/pair_abi.json");
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const pairAddresses = require('./assets/pair_address.json');

const dynamoDB = new AWS.DynamoDB.DocumentClient();

let counter = 0;
let chalk;

import('chalk').then((module) => {
  chalk = module.default;
});

async function storeEventToDynamoDB(userID, transactionHash, eventName, blockNumber, eventData, timestamp, pairAddress, amount0In, amount1In, amount0Out, amount1Out) {
  const params = {
    TableName: 'ADP1', 
    Item: {
      'UserID': userID, 
      'Timestamp': timestamp,
      'TransactionHash': transactionHash,
      'EventName': eventName,
      'BlockNumber': blockNumber,
      'PairAddress': pairAddress,
      'Amount0In': amount0In,
      'Amount1In': amount1In,
      'Amount0Out': amount0Out,
      'Amount1Out': amount1Out,
      'HasSwapped': 1, 
      'EventData': eventData
    }
  };

  try {
    await dynamoDB.put(params).promise();
    console.log(`Successfully stored event ${eventName} with transaction hash ${transactionHash}`);
  } catch (err) {
    console.error(chalk.red(`Error occurred when storing event: ${err}`));
  }
}

async function handleSwapEvent(userID, amount0In, amount1In, amount0Out, amount1Out, to, event) {
  try {
    counter++;
    const timestamp = Math.floor(Date.now() / 1000);
    const userID = event.args[event.args.length - 1];
    const amount0In = event.args[1];
    const amount1In = event.args[2];
    const amount0Out = event.args[3];
    const amount1Out = event.args[4];
    console.log(chalk.green(`Listening no.#${counter} swap event at ${timestamp}:`));

    console.log(`Transaction target address: ${to}`);

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
        event.address,
        amount0In,
        amount1In,
        amount0Out,
        amount1Out
      );
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
    pairContract.on('Swap', (userID, amount0In, amount1In, amount0Out, amount1Out, to, event) => 
      handleSwapEvent(userID, amount0In, amount1In, amount0Out, amount1Out, to, event)
    );
  });
}


module.exports = {
  start
};
