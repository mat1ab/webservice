const ethers = require('ethers');
const AWS = require('aws-sdk');

const PROJ_ROOT = process.env.PROJ_ROOT;
const config = require(`${PROJ_ROOT}/src/config/config.json`);
const gNftAbi = require(`${PROJ_ROOT}/src/abis/gNft_abi.json`);
const address = config.gNftAddress;
const provider = new ethers.providers.WebSocketProvider('wss://testnet.era.zksync.dev/ws');

AWS.config.update({
  region: config.awsRegion,
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function handleEvent(tokenId, to, from) {
  console.log('Transfer event detected:');
  console.log(`- Token ID: ${tokenId}`);
  console.log(`- To: ${to}`);
  console.log(`- From: ${from}`);

  // 删除"from"地址的tokenId（如果存在）
  if (from !== '0x0000000000000000000000000000000000000000') {
      const deleteParamsFrom = {
          TableName: 'gNftTransferEvents',
          Key: {
              'userAddress': from,
          },
          UpdateExpression: "DELETE tokenIds :tokenId",
          ExpressionAttributeValues: {
              ":tokenId": dynamoDB.createSet([tokenId.toString()])
          },
          ReturnValues: "UPDATED_NEW"
      };

      try {
          await dynamoDB.update(deleteParamsFrom).promise();
          console.log("Removed tokenId from old userAddress successfully.");
      } catch (err) {
          console.error("Unable to delete tokenId from 'from' address. Error JSON:", JSON.stringify(err, null, 2));
      }
  }

  // 向"to"地址添加tokenId
  const addParamsTo = {
      TableName: 'gNftTransferEvents',
      Key: {
          'userAddress': to,
      },
      UpdateExpression: "ADD tokenIds :tokenId",
      ExpressionAttributeValues: {
          ":tokenId": dynamoDB.createSet([tokenId.toString()])
      },
      ReturnValues: "UPDATED_NEW"
  };

  try {
      await dynamoDB.update(addParamsTo).promise();
      console.log("Added tokenId to new userAddress successfully.");
  } catch (err) {
      console.error("Unable to add tokenId to 'to' address. Error JSON:", JSON.stringify(err, null, 2));
  }
}

let latestBlock = 0;  

async function getPastEvents(contract) {
    let filter = contract.filters.Transfer();

    let events = await contract.queryFilter(filter, latestBlock + 1, 'latest');

    for (let event of events) {
        const {args} = event;
        await handleEvent(args.tokenId, args.to, args.from);

        latestBlock = event.blockNumber;
    }
}

async function start() {
    const contract = new ethers.Contract(address, gNftAbi, provider);
    await getPastEvents(contract);

    contract.on("Transfer", async (from, to, tokenId) => {
        await handleEvent(tokenId, to, from);
    });

    setInterval(async () => {
        await getPastEvents(contract);
    }, 60000);
}


module.exports = {
  start
};
