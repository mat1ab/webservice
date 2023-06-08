const ethers = require('ethers');
const AWS = require('aws-sdk');

const PROJ_ROOT = process.env.PROJ_ROOT;
const factoryAbi = require(`${PROJ_ROOT}/src/abis/factory_abi.json`);
const factoryAddress = '0xec10d31F75840c768C5b94A9094Fbac21BD985C9';

AWS.config.update({
    region: 'us-east-1',
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

function handlePairCreatedEvent(token0, token1, pairAddress) {
    console.log('PairCreated event detected:');
    console.log(`- token0: ${token0}`);
    console.log(`- token1: ${token1}`);
    console.log(`- pairAddress: ${pairAddress}`);
    
    const params = {
        TableName: 'TokenPairs',
        Item: {
            token0: token0,
            token1: token1,
            pairAddress: pairAddress
        }
    };
    
    dynamodb.put(params, (err, data) => {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Added item:", JSON.stringify(data, null, 2));
        }
    });
}

function start(provider) {
    let factory = new ethers.Contract(factoryAddress, factoryAbi, provider);
    factory.on("PairCreated", handlePairCreatedEvent);
}

module.exports = {
    start
};
