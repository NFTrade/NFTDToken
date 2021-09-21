const NFTDToken = artifacts.require('NFTDToken');
const NFTDTeamTokens = artifacts.require('NFTDTeamTokens');

const deployCollections = async (deployer, network, accounts) => {
  await deployer.deploy(NFTDToken);

  const token = await NFTDToken.deployed();

  await deployer.deploy(NFTDTeamTokens, token.address);
};

module.exports = deployCollections;
