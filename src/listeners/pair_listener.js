const ethers = require('ethers');
const pairAbi = require("../abis/pair_abi.json");
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});


const providerUrl = 'wss://testnet.era.zksync.dev/ws';
const provider = new ethers.providers.WebSocketProvider(providerUrl);
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const pairAddress = '0x1d44075F5A593Ce83d7e88FDC4494A234a0dCd58';
const pairContract = new ethers.Contract(pairAddress, pairAbi, provider);

let counter = 0;
async function storeEventToDynamoDB(userID, transactionHash, eventName, blockNumber, metaData) {
  const params = {
    TableName: 'test-events', 
    Item: {
      'UserID': userID,
      'TransactionHash': transactionHash,
      'EventName': eventName,
      'BlockNumber': blockNumber,
      'MetaData': metaData,
    }
  };

  try {
    await dynamoDB.put(params).promise();
    console.log(`Successfully stored event ${eventName} with transaction hash ${transactionHash}`);
  } catch (err) {
    console.error(`Error occurred when storing event: ${err}`);
  }
}


pairContract.on('Swap', async (arg0, arg1, arg2, arg3, arg4, arg5, arg6, event) => {
  try {
      counter++;
      const timestamp = new Date().toISOString();
      
      console.log(`Listening no.#${counter} swap event at ${timestamp}:`);
      console.log(`transaction target address: ${arg3}`);

      // Check if arg6 is an object, if so, stringify it
      if (typeof arg6 === 'object' && arg6 !== null) {
          console.log(`transaction details (arg6): ${JSON.stringify(arg6, null, 2)}`);
          if(arg6.transactionHash){
              console.log(`Transaction Hash: ${arg6.transactionHash}`);
              console.log(`Address: ${arg6.address}`);
              const userID =  arg6.args[5].toString();
              const metaData = JSON.stringify(arg6); 
              await storeEventToDynamoDB(userID, arg6.transactionHash, arg6.event, arg6.blockNumber, metaData);
          } else {
              console.log(`Transaction Hash not found`);
          }
      } else {
          console.log(`transaction details (arg6): ${arg6}`);
      }
  } catch (error) {
      console.error(`Pair listener: An error occurred while processing the swap event: ${error}`);
  }
});



provider.on('error', (error) => {
    console.error(`Provider error: ${error}`);
});

provider.on('open', () => {
    console.log(`Connected to ${providerUrl}`);
});

provider.on('close', () => {
    console.log(`Connection closed`);
});
