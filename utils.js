const { ethers } = require("ethers");
const axios = require("axios");
const gql = require("graphql-tag");

async function getTokenName(tokenAddress) {
  // Initialize Ethereum provider (like Infura)
  const provider = new ethers.InfuraProvider(
    "mainnet",
    process.env.INFURA_PROJECT_ID
  );

  // Define the ERC-20 ABI (you can find this on Etherscan or the contract's source)
  const abi = [
    {
      inputs: [],
      name: "name",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  // Create a Contract instance
  const tokenContract = new ethers.Contract(tokenAddress, abi, provider);

  try {
    // Call the name() function of the ERC-20 contract
    const name = await tokenContract.name();
    const sym = await tokenContract.symbol();
    return { name, sym };
  } catch (error) {
    console.error("Error fetching token name:", error);
    return null;
  }
}

async function getTokenBalance(pairAddress) {
  // Initialize Ethereum provider (like Infura)
  const provider = new ethers.InfuraProvider(
    "mainnet",
    process.env.INFURA_PROJECT_ID
  );

  // Define the ERC-20 ABI (you can find this on Etherscan or the contract's source)
  const abi = [
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  ];

  // Create a Contract instance
  const tokenContract = new ethers.Contract(pairAddress, abi, provider);

  try {
    // Call the name() function of the ERC-20 contract
    const reserves = await tokenContract.getReserves();
    return {
      token1Balance: reserves.reserve0,
      token2Balance: reserves.reserve1,
    };
  } catch (error) {
    console.error("Error fetching pair token name:", error);
    return null;
  }
}

async function getTokenPrice(tokenAddr) {
  const query = `
      {
        token(id: "${tokenAddr.toLowerCase()}") {
          derivedETH
        }
        bundle(id: "1") {
          ethPrice
        }
      }
    `;
  try {
    const response = await axios.post(
      "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2",
      {
        query,
      }
    );

    return (
      parseFloat(response.data.data.token.derivedETH) *
      parseFloat(response.data.data.bundle.ethPrice)
    );
  } catch (e) {
    console.error("Error fetching token price:", e);
    return null;
  }
}
async function calculateInitialLiquidityValue(pairAddr, tok0Addr, tok1Addr) {
  try {
    const token0Price = await getTokenPrice(tok0Addr);
    const token1Price = await getTokenPrice(tok1Addr);

    const { token1Balance, token2Balance } = await getTokenBalance(pairAddr);

    return token0Price * +token1Balance.toString() + token1Price * +token2Balance.toString();
  } catch (e) {
    console.error("Error fetching token price:", e);
    return null;
  }
}

module.exports = {
  getTokenName,
  calculateInitialLiquidityValue,
};
