const BigNumber = require('bignumber.js');
const { assert } = require('chai');
const chai = require('chai');
const truffleAssert = require('truffle-assertions');
/* eslint-disable no-undef */
const NFTDToken = artifacts.require('NFTDToken');
const TeamMemberTokens = artifacts.require('TeamMemberTokens');

const { advanceTimeAndBlock, itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

BigNumber.config({ EXPONENTIAL_AT: 50 });

const month = 2629746;

contract('NFTDTeamTokens', (accounts) => {
  let token;
  let teamMemberTokens;
  const totalAmount = new BigNumber(web3.utils.toWei(String(2700000)));
  const owner = accounts[0];
  const teamMember = accounts[1];

  before(async () => {
    start = await web3.eth.getBlock('latest');
    token = await NFTDToken.new();
    teamMemberTokens = await TeamMemberTokens.new(token.address, teamMember);

    await token.transfer(teamMemberTokens.address, totalAmount);

    const balance = await token.balanceOf(teamMemberTokens.address);

    console.log('balance', balance.toString());
  });

  describe('Team Tokens', () => {
    it('checks available amount on start', async () => {
      const available = await teamMemberTokens.available();

      assert.equal(available, 0);
    });

    it('first claim', async () => {
      const firstClaimTimestamp = await teamMemberTokens.firstClaimTimestamp();

      const currentBlock = await web3.eth.getBlock('latest');
      const advancement = firstClaimTimestamp - currentBlock.timestamp;
      await advanceTimeAndBlock(advancement);

      const available = await teamMemberTokens.available();

      const amountExpected = totalAmount.dividedBy(5);

      assert.equal(available.toString(), amountExpected.toString());

      await teamMemberTokens.withdraw({ from: teamMember });

      const balance = await token.balanceOf(teamMember);

      assert.equal(available.toString(), balance.toString());
    });

    it('nothing to claim one month later', async () => {
      await advanceTimeAndBlock(month); // one month

      const available = await teamMemberTokens.available();

      assert.equal(available.toString(), 0);
    });

    it('second claim availble but dont claim', async () => {
      await advanceTimeAndBlock(month * 2); // two more months

      const available = await teamMemberTokens.available();

      const amountExpected = totalAmount.dividedBy(5);

      assert.equal(available.toString(), amountExpected.toString());
    });

    it('claim two periods at once', async () => {
      await advanceTimeAndBlock(month * 3); // three more months

      const available = await teamMemberTokens.available();

      const amountExpected = totalAmount.dividedBy(5).multipliedBy(2);

      assert.equal(available.toString(), amountExpected.toString());

      await teamMemberTokens.withdraw({ from: teamMember });

      const totalClaimed = totalAmount.dividedBy(5).multipliedBy(3);

      const balance = await token.balanceOf(teamMember);

      assert.equal(totalClaimed.toString(), balance.toString());
    });

    it('claim all at the end', async () => {
      await advanceTimeAndBlock(month * 6); // three more months

      const available = await teamMemberTokens.available();

      const amountExpected = totalAmount.dividedBy(5).multipliedBy(2);

      assert.equal(available.toString(), amountExpected.toString());

      await teamMemberTokens.withdraw({ from: teamMember });

      const totalClaimed = totalAmount;

      const balance = await token.balanceOf(teamMember);

      assert.equal(totalClaimed.toString(), balance.toString());
    });
  });
});
