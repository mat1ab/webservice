const express = require("express");
const ethers = require("ethers");

const contractABI = require("./ABI_JSON");

const app = express();
const port = process.env.PORT || 3000;

const listenEvents = async () => {
  const contractAddress = "0x19513856a9e98AeaaF14617404a9571EF798C1A1";
  const provider = new ethers.providers.WebSocketProvider('wss://testnet.era.zksync.dev/ws');

  const contract = new ethers.Contract(contractAddress, contractABI, provider);

  while (true) {
    try {
      console.log("Fetching events...");

      const events = await contract.queryFilter("Transfer");

      console.log(`*************Fetched ${events.length} events:`);
      events.forEach(event => {
        console.log(JSON.stringify(event, null, 4));
      });
    } catch (error) {
      console.error(`Error while fetching events: ${error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 50000));
  }
};

app.get("/", (req, res) => {
  res.send("ZkSync event listener is running");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  listenEvents();
});
