const BigNumber = require('bignumber.js');
const { assert } = require('chai');
const chai = require('chai');
const truffleAssert = require('truffle-assertions');
/* eslint-disable no-undef */
const NFTDToken = artifacts.require('NFTDToken');
const TetherToken = artifacts.require('TetherToken');
const NFTDCommunityRound = artifacts.require('NFTDCommunityRound');

const { advanceTimeAndBlock, itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

contract('NFTDCommunityRound', (accounts) => {
  let token;
  let usdt;
  let communityRound;
  const owner = accounts[0];
  const user1 = accounts[1];
  const user2 = accounts[2];
  const user3 = accounts[3];
  const user4 = accounts[4];
  const user5 = accounts[5];

  before(async () => {
    token = await NFTDToken.deployed();
    usdt = await TetherToken.deployed();
    communityRound = await NFTDCommunityRound.deployed();

    // transfer NFTD to contract
    await token.transfer(communityRound.address, new BigNumber(1000000 * 10 ** 18));

    await usdt.transfer(user1, new BigNumber(100 * 10 ** 6));
    await usdt.transfer(user2, new BigNumber(500 * 10 ** 6));
    await usdt.transfer(user3, new BigNumber(200 * 10 ** 6));
    await usdt.transfer(user4, new BigNumber(50 * 10 ** 6));
    await usdt.transfer(user5, new BigNumber(100 * 10 ** 6));

    const balance = await token.balanceOf(communityRound.address);

    console.log('balance', balance.toString());
  });

  describe('Community Round', () => {
    itShouldThrow('try to purchase before start', async () => {
      await usdt.approve(communityRound.address, new BigNumber(100 * 10 ** 6), { from: user1 });
      await communityRound.purchase(new BigNumber(100 * 10 ** 6), { from: user1 });
    }, 'Purchase is close');
    itShouldThrow('try to purchase before start', async () => {
      await communityRound.openPurchase();
      await usdt.approve(communityRound.address, new BigNumber(100 * 10 ** 6), { from: user1 });
      await communityRound.purchase(new BigNumber(100 * 10 ** 6), { from: user1 });
    }, 'Address is not whitelisted');
    it('Place a purchase', async () => {
      await communityRound.openPurchase();
      await communityRound.whitelistAddresses([user1]);
      await usdt.approve(communityRound.address, new BigNumber(100 * 10 ** 6), { from: user1 });
      await communityRound.purchase(new BigNumber(100 * 10 ** 6), { from: user1 });
      const balance = await usdt.balanceOf(communityRound.address);
      assert.equal(balance.toString(), 100 * 10 ** 6);
    });
    it('Place a purchase and claim', async () => {
      await communityRound.openClaim();
      /* const balance = await communityRound.NFTDBalance(user1);
      console.log(balance.toString()); */
      await communityRound.claim({ from: user1 });
      const balance = await token.balanceOf(user1);
      assert.equal(balance.toString(), 1000 * 10 ** 18);
    });
  });
});
