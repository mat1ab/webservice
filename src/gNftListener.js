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

    if (from && from !== '0x0000000000000000000000000000000000000000') {
        try {
            const getParamsFrom = {
                TableName: 'gNftTransferEvents',
                Key: {
                    'userAddress': from,
                }
            };

            const result = await dynamoDB.get(getParamsFrom).promise();
            const existingTokenIds = result.Item.tokenIds;

            if (existingTokenIds && existingTokenIds.values && existingTokenIds.values.includes(tokenId.toString())) {
                existingTokenIds.values = existingTokenIds.values.filter(id => id !== tokenId.toString());

                const updateParamsFrom = {
                    TableName: 'gNftTransferEvents',
                    Key: {
                        'userAddress': from,
                    },
                    UpdateExpression: "SET tokenIds = :tokenIds",
                    ExpressionAttributeValues: {
                        ":tokenIds": existingTokenIds
                    },
                    ReturnValues: "UPDATED_NEW"
                };

                await dynamoDB.update(updateParamsFrom).promise();
                console.log("Removed tokenId from old userAddress successfully.");
            } else {
                console.log("tokenId not found in the 'from' address or 'from' address does not exist in the table.");
            }
        } catch (err) {
            console.error("Unable to delete tokenId from 'from' address. Error JSON:", JSON.stringify(err, null, 2));
        }
    }

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

let latestBlock = 0; // add a variable to keep track of the latest processed block

async function getPastEvents(contract) {
    let filter = contract.filters.Transfer();

    // only get events from blocks after the latest processed block
    let events = await contract.queryFilter(filter, latestBlock + 1, 'latest');

    for (let event of events) {
        const {args} = event;
        await handleEvent(args.tokenId, args.to);

        // update the latest processed block
        latestBlock = event.blockNumber;
    }
}

async function start() {
    const contract = new ethers.Contract(address, gNftAbi, provider);
    await getPastEvents(contract);

    // setup the real-time listener
    contract.on("Transfer", async ( to, tokenId ) => {
        await handleEvent(tokenId, to);
    });

    // check for new events every minute
    setInterval(async () => {
        await getPastEvents(contract);
    }, 60000);
}


module.exports = {
  start
};
