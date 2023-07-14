// const ethers = require('ethers');
// const AWS = require('aws-sdk');

// PROJ_ROOT=process.env.PROJ_ROOT;
// const provider = new ethers.providers.WebSocketProvider('wss://testnet.era.zksync.dev/ws');
// const config = require(`${PROJ_ROOT}/src/config/config.json`); 
// const logger = require(`${PROJ_ROOT}/src/winston`);
// const esArrTokenAbi = require(`${PROJ_ROOT}/src/abis/esArrToken_abi.json`);

// const esArrTokenAddress = config.esArrTokenAddress;
// AWS.config.update({
//   region: config.awsRegion,
// });

// const dynamoDB = new AWS.DynamoDB.DocumentClient();
// let counter = 0;

// async function getTransactionDetails(transactionHash) {
//   try {
//     const transaction = await provider.getTransaction(transactionHash);
//     logger.info(`From:${transaction.from}`);
//     console.log('From:', transaction.from);
//     return transaction.from.toString();
//   } catch (error) {
//     logger.error(`Error getting transaction details:${error}`);
//     console.error('Error getting transaction details:', error);
//     return null;
//   }
// }

// async function storeEventToDynamoDB(userID, transactionHash, eventName, blockNumber, eventData, timestamp, esArrTokenAddress) {
//   const params = {
//     TableName: 'ADP1',
//     Item: {
//       'UserID': userID,
//       'TransactionHash': transactionHash,
//       'EventName': eventName,
//       'BlockNumber': blockNumber,
//       'EventData': eventData,
//       'Timestamp': timestamp,
//       'PairAddress': esArrTokenAddress
//     }
//   };

//   try {
//     await dynamoDB.put(params).promise();
//     logger.info(`Successfully stored event ${eventName} with transaction hash ${transactionHash}`);
//     console.log(`Successfully stored event ${eventName} with transaction hash ${transactionHash}`);
//   } catch (err) {
//     logger.error(`Error occurred when storing event: ${err}`);
//     console.error(`Error occurred when storing event: ${err}`);
//   }
// }

// async function handleRedeemEvent(sender, amount0, amount1, event) {
//   counter++;
//   const timestamp = Math.floor(Date.now() / 1000);
//   const transactionHash = event.transactionHash;
//   const userID = await getTransactionDetails(transactionHash);
//   logger.info(`Listening no.#${counter} Redeem event at ${timestamp}:`);
//   console.log(`Listening no.#${counter} Redeem event at ${timestamp}:`);


//   await storeEventToDynamoDB(
//     userID,
//     transactionHash,
//     'Redeem',
//     event.blockNumber,
//     JSON.stringify(event),
//     timestamp,
//     event.address
//   );
//   logger.info(`Event object: ${JSON.stringify(event, null, 2)}`);
//   console.log(`Event object: ${JSON.stringify(event, null, 2)}`);
// }

// async function handleConvertEvent(sender, amount0, amount1, to, event) {
//   counter++;
//   const timestamp = Math.floor(Date.now() / 1000);
//   const transactionHash = event.transactionHash;
//   const userID = await getTransactionDetails(transactionHash);
//   logger.info(`Listening no.#${counter} Convert event at ${timestamp}:`);
//   console.log(`Listening no.#${counter} Convert event at ${timestamp}:`);

//   await storeEventToDynamoDB(
//     userID,
//     transactionHash,
//     'Convert',
//     event.blockNumber,
//     JSON.stringify(event),
//     timestamp,
//     event.address
//   );
//   logger.info(`Event object: ${JSON.stringify(event, null, 2)}`);
//   console.log(`Event object: ${JSON.stringify(event, null, 2)}`);
// }


// async function handleCancelRedeemEvent(sender, amount0, amount1, to, event) {
//     counter++;
//     const timestamp = Math.floor(Date.now() / 1000);
//     const transactionHash = event.transactionHash;
//     const userID = await getTransactionDetails(transactionHash);
//     logger.info(`Listening no.#${counter} CancelRedeem event at ${timestamp}:`);
//     console.log(`Listening no.#${counter} CancelRedeem event at ${timestamp}:`);
  
//     await storeEventToDynamoDB(
//       userID,
//       transactionHash,
//       'CancelRedeem',
//       event.blockNumber,
//       JSON.stringify(event),
//       timestamp,
//       event.address
//     );
//     logger.info(`Event object: ${JSON.stringify(event, null, 2)}`);
//     console.log(`Event object: ${JSON.stringify(event, null, 2)}`);
//   }

// async function handleAllocateEvent(sender, amount0, amount1, to, event) {
//     counter++;
//     const timestamp = Math.floor(Date.now() / 1000);
//     const transactionHash = event.transactionHash;
//     const userID = await getTransactionDetails(transactionHash);
//     logger.info(`Listening no.#${counter} Allocate event at ${timestamp}:`);
//     console.log(`Listening no.#${counter} Allocate event at ${timestamp}:`);
  
//     await storeEventToDynamoDB(
//       userID,
//       transactionHash,
//       'Allocate',
//       event.blockNumber,
//       JSON.stringify(event),
//       timestamp,
//       event.address
//     );
//     logger.info(`Event object: ${JSON.stringify(event, null, 2)}`);
//     console.log(`Event object: ${JSON.stringify(event, null, 2)}`);
//   }

// async function handleDeallocateEvent(sender, amount0, amount1, to, event) {
//     counter++;
//     const timestamp = Math.floor(Date.now() / 1000);
//     const transactionHash = event.transactionHash;
//     const userID = await getTransactionDetails(transactionHash);
//     logger.info(`Listening no.#${counter} Deallocate event at ${timestamp}:`);
//     console.log(`Listening no.#${counter} Deallocate event at ${timestamp}:`);
  
//     await storeEventToDynamoDB(
//       userID,
//       transactionHash,
//       'Deallocate',
//       event.blockNumber,
//       JSON.stringify(event),
//       timestamp,
//       event.address
//     );
//     logger.info(`Event object: ${JSON.stringify(event, null, 2)}`);
//     console.log(`Event object: ${JSON.stringify(event, null, 2)}`);
//   }

// async function start(provider) {
//     const listenForEsArrEvents = async () => {
//       const pairAddress = esArrTokenAddress;
//       const pairContract = new ethers.Contract(pairAddress, esArrTokenAbi, provider);

//       pairContract.on('Redeem', handleRedeemEvent);
//       pairContract.on('Convert', handleConvertEvent);
//       pairContract.on('CancelRedeem', handleCancelRedeemEvent);
//       pairContract.on('Allocate', handleAllocateEvent);
//       pairContract.on('Deallocate', handleDeallocateEvent);

//     };
  
//     await listenForEsArrEvents();
  
//     setInterval(async () => {
//       await listenForEsArrEvents();
//     }, 30000);
//   }
  
// module.exports = {
//   start
// };

