const BigNumber = require('bignumber.js');
const { assert } = require('chai');
const chai = require('chai');
const truffleAssert = require('truffle-assertions');
/* eslint-disable no-undef */
const NFTDToken = artifacts.require('NFTDToken');
const NFTDTeamTokens = artifacts.require('NFTDTeamTokens');

const { advanceTimeAndBlock, itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

function monthDiff(t2, t1) {
  const d1 = new Date(t1 * 1000);
  const d2 = new Date(t2 * 1000);
  let months;
  months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth();
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
}

contract('NFTDTeamTokens', (accounts) => {
  let token;
  let teamTokens;
  let user1MaxCap;
  let user2MaxCap;
  let user3MaxCap;
  let user4MaxCap;
  let teamTokensAmount;
  const owner = accounts[0];
  const user1 = accounts[1];
  const user2 = accounts[2];
  const user3 = accounts[3];
  const user4 = accounts[4];
  const user5 = accounts[5];
  let start;
  let current;

  const advanceMonthsSinceStart = async (months) => {
    const currentBlock = await web3.eth.getBlock('latest');
    const advancement = 2592000 * months + start.timestamp - currentBlock.timestamp;
    return advanceTimeAndBlock(advancement);
  };

  before(async () => {
    start = await web3.eth.getBlock('latest');
    token = await NFTDToken.deployed();
    teamTokens = await NFTDTeamTokens.deployed();
    let totalSupply = await token.totalSupply();
    totalSupply = totalSupply.toString();
    user1MaxCap = totalSupply * 0.02;
    user2MaxCap = totalSupply * 0.03;
    user3MaxCap = totalSupply * 0.04;
    user4MaxCap = totalSupply * 0.105;
    teamTokensAmount = user1MaxCap + user2MaxCap + user3MaxCap + user4MaxCap;

    await token.transfer(teamTokens.address, new BigNumber(teamTokensAmount));

    const balance = await token.balanceOf(teamTokens.address);

    console.log('balance', balance.toString());

    await teamTokens.addMember(user1, new BigNumber(user1MaxCap));
    await teamTokens.addMember(user2, new BigNumber(user2MaxCap));
    await teamTokens.addMember(user3, new BigNumber(user3MaxCap));
    await teamTokens.addMember(user4, new BigNumber(user4MaxCap));
  });

  describe('Team Tokens', () => {
    it('checks available amount on start', async () => {
      const user1AvailableTokens = await teamTokens.getAvailableTokens(user1);

      assert.equal(user1AvailableTokens, 0);
    });

    it('no available amount after 10 months', async () => {
      current = await advanceMonthsSinceStart(10);
      console.log(monthDiff(current.timestamp, start.timestamp));
      const user1AvailableTokens = await teamTokens.getAvailableTokens(user1);

      assert.equal(user1AvailableTokens, 0);
    });

    it('no available amount after 15 months', async () => {
      current = await advanceMonthsSinceStart(15);
      console.log(monthDiff(current.timestamp, start.timestamp));
      const user1AvailableTokens = await teamTokens.getAvailableTokens(user1);

      assert.equal(user1AvailableTokens, 0);
    });

    it('checks available amount after 18 months and 1 hour', async () => {
      current = await advanceMonthsSinceStart(18);
      const advancement = 3600;
      current = await advanceTimeAndBlock(advancement);
      console.log(monthDiff(current.timestamp, start.timestamp));
      const user1AvailableTokens = await teamTokens.getAvailableTokens(user1);

      assert.equal(user1AvailableTokens.toString(), user1MaxCap / 5);

      await teamTokens.claim(user1, user1AvailableTokens, { from: user1 });

      const user1Balance = await token.balanceOf(user1);

      assert.equal(user1AvailableTokens.toString(), user1Balance.toString());
    });

    itShouldThrow('cannot claim again after 19 months', async () => {
      current = await advanceMonthsSinceStart(19);
      console.log(monthDiff(current.timestamp, start.timestamp));

      const user1AvailableTokens = await teamTokens.getAvailableTokens(user1);

      assert.equal(user1AvailableTokens.toString(), 0);

      await teamTokens.claim(user1, 5000000000, { from: user1 });
    }, 'Requested amount cannot be claimed');

    it('claims for user 2 after 19 months', async () => {
      const user2AvailableTokens = await teamTokens.getAvailableTokens(user2);

      assert.equal(user2AvailableTokens.toString(), user2MaxCap / 5);

      await teamTokens.claim(user2, user2AvailableTokens, { from: user2 });

      const user2Balance = await token.balanceOf(user2);

      assert.equal(user2AvailableTokens.toString(), user2Balance.toString());
    });

    it('claims for user 2 after 21 months and 1 hour', async () => {
      current = await advanceMonthsSinceStart(21);
      const advancement = 3600;
      current = await advanceTimeAndBlock(advancement);
      console.log(monthDiff(current.timestamp, start.timestamp));
      const user2AvailableTokens = await teamTokens.getAvailableTokens(user2);

      assert.equal(user2AvailableTokens.toString(), user2MaxCap / 5);

      await teamTokens.claim(user2, user2AvailableTokens, { from: user2 });

      const user2Balance = await token.balanceOf(user2);

      assert.equal(user2AvailableTokens.toString() * 2, user2Balance.toString());
    });

    it('claims for user 3 after 21 months for the first time', async () => {
      const user3AvailableTokens = await teamTokens.getAvailableTokens(user3);

      assert.equal(user3AvailableTokens.toString(), (user3MaxCap / 5) * 2);

      await teamTokens.claim(user3, user3AvailableTokens, { from: user3 });

      const user3Balance = await token.balanceOf(user3);

      assert.equal(user3AvailableTokens.toString(), user3Balance.toString());
    });

    itShouldThrow('claim from non team member', async () => {
      await teamTokens.claim(user5, 55555555555, { from: user5 });
    }, 'Requested amount cannot be claimed');

    it('claims for user 2 after 30 months and one hour', async () => {
      current = await advanceMonthsSinceStart(30);
      const advancement = 3600;
      current = await advanceTimeAndBlock(advancement);
      console.log(monthDiff(current.timestamp, start.timestamp));

      const user2BalanceBefore = await token.balanceOf(user2);

      const user2AvailableTokens = await teamTokens.getAvailableTokens(user2);

      console.log(user2AvailableTokens.toString(), user2MaxCap, user2BalanceBefore.toString());
      // already claimed twice
      assert.equal(user2AvailableTokens.toString(), (user2MaxCap / 5) * 3);

      await teamTokens.claim(user2, user2AvailableTokens, { from: user2 });

      const user2Balance = await token.balanceOf(user2);

      assert.equal(user2MaxCap, user2Balance.toString());
    });

    itShouldThrow('claims for user 1 more than available', async () => {
      const user1AvailableTokens = await teamTokens.getAvailableTokens(user1);
      await teamTokens.claim(user1, user1AvailableTokens + 15, { from: user1 });
    }, 'Requested amount cannot be claimed');

    it('claims partial for user 1', async () => {
      current = await advanceMonthsSinceStart(35);
      console.log(monthDiff(current.timestamp, start.timestamp));

      const user1AvailableTokens = await teamTokens.getAvailableTokens(user1);

      const user1BalanceBefore = await token.balanceOf(user1);

      await teamTokens.claim(user1, new BigNumber(user1AvailableTokens / 2), { from: user1 });

      const user1Balance = await token.balanceOf(user1);

      console.log(user1BalanceBefore.toString(), user1Balance.toString());

      const before = user1BalanceBefore / 10 ** 18;
      const avail = user1AvailableTokens / 10 ** 18;

      const balanceAfter = before + avail / 2;

      console.log(before, avail);

      assert.equal(user1Balance.toString(), balanceAfter * 10 ** 18);
    });
  });
});
