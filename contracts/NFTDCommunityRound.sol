// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract NFTDCommunityRound is Ownable {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  struct Purchase {
    uint256 amount;
    bool claimed;
  }

  bool public purchaseOpen = false;
  bool public claimOpen = false;
  uint256 public maxPurchaseAmount = 200 * 10 ** 6; // 200 usdt
  uint256 public NFTDPrice = 0.1 * 10 ** 6; // 0.1 usdt
  uint256 public roundAmount = 100000 * 10 ** 6; // 100,000 usdt
  uint256 public totalPurchases = 0;

  // purcahses of users
  mapping(address => Purchase) public purchases;
  // whitelist list
  mapping (address => bool) whitelist;

  IERC20 NFTDToken;
  IERC20 USDTToken;

  constructor(address _NFTDToken, address _USDTToken) {
    NFTDToken = IERC20(_NFTDToken);
    USDTToken = IERC20(_USDTToken);
  }

  function openPurchase() external onlyOwner {
    purchaseOpen = true;
  }

  function closePurchase() external onlyOwner {
    purchaseOpen = false;
  }

  function openClaim() external onlyOwner {
    claimOpen = true;
  }

  function closeClaim() external onlyOwner {
    claimOpen = false;
  }

  function whitelistAddresses(address[] memory users) external onlyOwner {
    for (uint i = 0; i < users.length; i++) {
      whitelist[users[i]] = true;
    }
  }

  function eligibilityOf(address user) public view returns (bool) {
    return whitelist[user];
  }

  function amountPurchased(address user) public view returns (uint256) {
    return purchases[user].amount;
  }

  function claimed(address user) public view returns (bool) {
    return purchases[user].claimed;
  }

  function NFTDBalance(address user) public view returns (uint256) {
    uint256 purchaseAmount = purchases[user].amount;
    return (purchaseAmount.div(NFTDPrice)).mul(10 ** 18);
  }

  function purchase(uint256 amount) public {
    require(purchaseOpen, 'Purchase is close');
    require(whitelist[msg.sender], 'Address is not whitelisted');
    require(purchases[msg.sender].amount + amount <= maxPurchaseAmount, 'More than max purchase per user');
    require(totalPurchases + amount <= roundAmount, 'More than round amount');
    require(!purchases[msg.sender].claimed, 'User already claimed');
    purchases[msg.sender].amount = purchases[msg.sender].amount + amount;
    totalPurchases = totalPurchases + amount;
    USDTToken.transferFrom(msg.sender, address(this), amount);
  }

  function claim() public {
    require(claimOpen, 'Claim is close');
    require(whitelist[msg.sender], 'Address is not whitelisted');
    require(!purchases[msg.sender].claimed, 'User already claimed');
    uint256 purchaseAmount = purchases[msg.sender].amount;
    uint256 claimAmount = (purchaseAmount.div(NFTDPrice)).mul(10 ** 18);
    purchases[msg.sender].claimed = true;
    NFTDToken.transfer(msg.sender, claimAmount);
  }

  function emergencyAssetWithdrawal(address asset) external onlyOwner {
    IERC20 token = IERC20(asset);
    token.safeTransfer(Ownable.owner(), token.balanceOf(address(this)));
  }
}