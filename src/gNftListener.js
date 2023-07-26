const ethers = require('ethers');
const AWS = require('aws-sdk');

const PROJ_ROOT = process.env.PROJ_ROOT;
const config = require(`${PROJ_ROOT}/src/config/config.json`);
const gNftAbi = require(`${PROJ_ROOT}/src/abis/gNft_abi.json`);
const address = config.gNftAddress;


AWS.config.update({
  region: config.awsRegion,
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function handleEvent(tokenId, to, from) {
    console.log('Transfer event detected:');
    console.log(`- Gnft Token ID: ${tokenId}`);
    console.log(`- To: ${to}`);
    console.log(`- From: ${from}`);

    // 如果from地址存在且不为0
    if (from && from !== '0x0000000000000000000000000000000000000000') {
        try {
            const getParamsFrom = {
                TableName: 'gNftTransferEvents',
                Key: {
                    'userAddress': from,
                }
            };
            let resultFrom = await dynamoDB.get(getParamsFrom).promise();
            // 如果tokenIds存在，则将其转化为数组，否则初始化为空数组
            let existingTokenIdsFrom = resultFrom.Item && resultFrom.Item.tokenIds ? resultFrom.Item.tokenIds : [];

            // 从列表中移除当前的tokenId
            let tokenIdIndex = existingTokenIdsFrom.indexOf(Number(tokenId));
            if (tokenIdIndex > -1) {
                existingTokenIdsFrom.splice(tokenIdIndex, 1);
            }

            // 更新from地址的tokenId列表
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

    // 处理to地址
    try {
        const getParamsTo = {
            TableName: 'gNftTransferEvents',
            Key: {
                'userAddress': to,
            }
        };

        const resultTo = await dynamoDB.get(getParamsTo).promise();
        // 如果tokenIds存在，则将其转化为数组，否则初始化为空数组
        let existingTokenIdsTo = resultTo.Item && resultTo.Item.tokenIds ? resultTo.Item.tokenIds : [];
    
        // 检查tokenId是否已经存在于existingTokenIdsTo
        if (!existingTokenIdsTo.includes(Number(tokenId))) {
            // 将新的tokenId添加到existingTokenIds列表
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
async function start(provider) {
    const contract = new ethers.Contract(address, gNftAbi, provider);
    provider.on("*", (result) => {
        console.log(result);
    });
    contract.on("Transfer", (from, to, tokenId) => { 
        console.log('xxxxx_____gNft____xxxxxxx');
        handleEvent(tokenId, to, from)
            .catch(err => {
                console.error('Error handling event:', err);
            });
    });
}

module.exports = {
  start
};
