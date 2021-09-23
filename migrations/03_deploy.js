const NFTDToken = artifacts.require('NFTDToken');
const TetherToken = artifacts.require('TetherToken');
const NFTDCommunityRound = artifacts.require('NFTDCommunityRound');

const deployCollections = async (deployer, network, accounts) => {
  await deployer.deploy(TetherToken);

  const token = await NFTDToken.deployed();
  const usdt = await TetherToken.deployed();

  await deployer.deploy(NFTDCommunityRound, token.address, usdt.address);
};

module.exports = deployCollections;
