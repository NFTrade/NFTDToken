const NFTDToken = artifacts.require('NFTDToken');
const RewardPayout = artifacts.require('RewardPayout');

const deployCollections = async (deployer, network, accounts) => {
  // await deployer.deploy(NFTDToken);
  const token = await NFTDToken.deployed();
  await deployer.deploy(RewardPayout, token.address, 1679659200);
};

module.exports = deployCollections;
