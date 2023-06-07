const ethers = require('ethers');

const provider = new ethers.providers.WebSocketProvider('wss://testnet.era.zksync.dev/ws');
const atCorePairAddresses = require('./assets/AtCorePair_address.json');
const pairAbi = require("./abis/AtCorePair_abi.json");

let counter = 0;

async function getTransactionDetails(transactionHash) {
  try {
    const transaction = await provider.getTransaction(transactionHash);
    console.log('Transaction Details:');
    // console.log(transaction);
    console.log('From:', transaction.from);
  } catch (error) {
    console.error('Error getting transaction details:', error);
  }
}

function handleMintEvent(sender, amount0, amount1, event) {
  counter++;
  const timestamp = new Date().toISOString();
  console.log(`Listening no.#${counter} Mint event at ${timestamp}:`);
  console.log(`Sender: ${sender}`);
  console.log(`Amount0: ${amount0.toString()}`);
  console.log(`Amount1: ${amount1.toString()}`);
  
  // Get and log the transaction details
  const transactionHash = event.transactionHash;
  console.log(`Transaction Hash: ${transactionHash}`);
  getTransactionDetails(transactionHash);

  // Log the entire event object
  console.log(`Event object: ${JSON.stringify(event, null, 2)}`);
}

function handleBurnEvent(sender, amount0, amount1, to, event) {
  counter++;
  const timestamp = new Date().toISOString();
  console.log(`Listening no.#${counter} Burn event at ${timestamp}:`);
  console.log(`Sender: ${sender}`);
  console.log(`Amount0: ${amount0.toString()}`);
  console.log(`Amount1: ${amount1.toString()}`);
  console.log(`To: ${to}`);
  
  // Get and log the transaction details
  const transactionHash = event.transactionHash;
  console.log(`Transaction Hash: ${transactionHash}`);
  getTransactionDetails(transactionHash);

  // Log the entire event object
  console.log(`Event object: ${JSON.stringify(event, null, 2)}`);
}

function start() {
  atCorePairAddresses.forEach(atCorePairAddress => {
    console.log('Starting to listen for Mint and Burn events...');
    const pairContract = new ethers.Contract(atCorePairAddress, pairAbi, provider);
    pairContract.on('Mint', handleMintEvent);
    pairContract.on('Burn', handleBurnEvent);
  });
}

// Start listening to events
start();
