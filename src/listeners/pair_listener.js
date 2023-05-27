// const ethers = require('ethers');
// const pairAbi = require("../abis/pair_abi.json");
// const AWS = require('aws-sdk');
// AWS.config.update({region: 'us-east-1'});

// const providerUrl = 'wss://testnet.era.zksync.dev/ws';
// const provider = new ethers.providers.WebSocketProvider(providerUrl);
// const dynamoDB = new AWS.DynamoDB.DocumentClient();

// const pairAddresses = require('../assets/pair_address.json');

// let counter = 0;

// async function storeEventToDynamoDB(userID, transactionHash, eventName, blockNumber, eventData, timestamp, pairAddress) {
//   const params = {
//     TableName: 'test-events', 
//     Item: {
//       'UserID': userID,
//       'TransactionHash': transactionHash,
//       'EventName': eventName,
//       'BlockNumber': blockNumber,
//       'EventData': eventData,
//       'Timestamp': timestamp,
//       'PairAddress': pairAddress,
//     }
//   };

//   try {
//     await dynamoDB.put(params).promise();
//     console.log(`Successfully stored event ${eventName} with transaction hash ${transactionHash}`);
//   } catch (err) {
//     console.error(`Error occurred when storing event: ${err}`);
//   }
// }

// async function handleSwapEvent(userID, amount0In, amount1In, amount0Out, amount1Out, to, event) {
//   try {
//     counter++;
//     const timestamp = new Date().toISOString();
//     console.log(`Listening no.#${counter} swap event at ${timestamp}:`);

//     console.log(`Transaction target address: ${to}`);

//     if(event.transactionHash){
//       console.log(`Transaction Hash: ${event.transactionHash}`);
//       console.log(`Address: ${event.address}`);
//       const eventData = JSON.stringify(event); 
//       await storeEventToDynamoDB(userID, event.transactionHash, event.event, event.blockNumber, eventData, timestamp, event.address);
//     } else {
//       console.log(`Transaction Hash not found`);
//     }
//   } catch (error) {
//     console.error(`Pair listener: An error occurred while processing the swap event: ${error}`);
//   }
// }

// pairAddresses.forEach(pairAddress => {
//   const pairContract = new ethers.Contract(pairAddress, pairAbi, provider);
//   pairContract.on('Swap', handleSwapEvent);
// });
