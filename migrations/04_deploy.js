const NFTDToken = artifacts.require('NFTDToken');
const RewardPayout = artifacts.require('RewardPayout');

const deployCollections = async (deployer, network, accounts) => {
  // await deployer.deploy(NFTDToken);
  /* const token = await NFTDToken.at('0x8e0fe2947752be0d5acf73aae77362daf79cb379');
  await deployer.deploy(RewardPayout, token.address, 1679659200); */
};

module.exports = deployCollections;
