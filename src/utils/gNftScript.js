const ethers = require('ethers');
const AWS = require('aws-sdk');
const path = require('path');
const PROJ_ROOT = process.env.PROJ_ROOT;
const config = require(`${PROJ_ROOT}/src/config/config.json`);
const gNftAbi = require(`${PROJ_ROOT}/src/abis/gNft_abi.json`);
const address = config.gNftAddress;
let provider = new ethers.providers.WebSocketProvider('wss://testnet.era.zksync.dev/ws');

const listenerId = path.basename(__filename, '.js'); 

AWS.config.update({
  region: config.awsRegion,
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const contract = new ethers.Contract(address, gNftAbi, provider);

async function handleEvent(tokenId, to, from) {
    console.log('Transfer event detected:');
    console.log(`- Gnft Token ID: ${tokenId}`);
    console.log(`- To: ${to}`);
    console.log(`- From: ${from}`);

    if (from && from !== '0x0000000000000000000000000000000000000000') {
        try {
            const getParamsFrom = {
                TableName: 'gNftTransferEvents',
                Key: {
                    'userAddress': from,
                }
            };
            let resultFrom = await dynamoDB.get(getParamsFrom).promise();
            let existingTokenIdsFrom = resultFrom.Item && resultFrom.Item.tokenIds ? resultFrom.Item.tokenIds : [];

            let tokenIdIndex = existingTokenIdsFrom.indexOf(Number(tokenId));
            if (tokenIdIndex > -1) {
                existingTokenIdsFrom.splice(tokenIdIndex, 1);
            }

            const updateParamsFrom = {
                TableName: 'gNftTransferEvents',
                Key: {
                    'userAddress': from,
                },
                UpdateExpression: "SET tokenIds = :tokenIds",
                ExpressionAttributeValues: {
                    ":tokenIds": existingTokenIdsFrom
                },
                ReturnValues: "UPDATED_NEW"
            };
            await dynamoDB.update(updateParamsFrom).promise();
            console.log("从旧的用户地址成功移除了tokenId。");
        } catch (err) {
            console.error("无法从'from'地址移除tokenId。错误信息：", err);
        }
    }

    try {
        const getParamsTo = {
            TableName: 'gNftTransferEvents',
            Key: {
                'userAddress': to,
            }
        };

        const resultTo = await dynamoDB.get(getParamsTo).promise();
        let existingTokenIdsTo = resultTo.Item && resultTo.Item.tokenIds ? resultTo.Item.tokenIds : [];
    
        if (!existingTokenIdsTo.includes(Number(tokenId))) {
            existingTokenIdsTo.push(Number(tokenId));
        }

        const updateParamsTo = {
            TableName: 'gNftTransferEvents',
            Key: {
                'userAddress': to,
            },
            UpdateExpression: "SET tokenIds = :tokenIds",
            ExpressionAttributeValues: {
                ":tokenIds": existingTokenIdsTo
            },
            ReturnValues: "UPDATED_NEW"
        };
    
        await dynamoDB.update(updateParamsTo).promise();
        console.log("成功向新的用户地址添加了tokenId。");
    } catch (err) {
        console.error("无法向'to'地址添加tokenId。错误信息：", err);
    }
}

async function getLastBlock() {
    const getParams = {
      TableName: 'LastProcessedBlock',
      Key: {
        'listenerId': listenerId,
      }
    };
  
    let result = await dynamoDB.get(getParams).promise();
    if (!result.Item) {
      await setLastBlock(0);
      return 0;
    }
  
    return result.Item.blockNumber ? result.Item.blockNumber : 0;
  }
  
  async function setLastBlock(blockNumber) {
    const putParams = {
      TableName: 'LastProcessedBlock',
      Item: {
        'listenerId': listenerId,
        'blockNumber': blockNumber
      }
    };
  
    await dynamoDB.put(putParams).promise();
  }
  

  async function getPastEvents() {
    let lastBlock = await getLastBlock();
    let filter = contract.filters.Transfer();
  
    let events = await contract.queryFilter(filter, lastBlock + 1, 'latest');
    let newLastBlock = lastBlock;
  
    if (events.length > 0) {
      for (let event of events) {
        const {args, blockNumber} = event;
        await handleEvent(args.tokenId, args.to, args.from);
        if (blockNumber > newLastBlock) {
          newLastBlock = blockNumber;
        }
      }
    } else {
      newLastBlock = await provider.getBlockNumber();
    }
  
    if (newLastBlock > lastBlock) {
      await setLastBlock(newLastBlock);
    }
  }
  

getPastEvents().catch(console.error);


async function runHistoryDataScript() {
    try {
        console.log('Starting to get past events...');
        await getPastEvents();
        console.log('Past events fetched and processed.');
    } catch (error) {
        console.error('Error running history data script:', error);
    }
}

module.exports = {
    runHistoryDataScript
};

