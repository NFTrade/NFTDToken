// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract NFTDTeamTokens is ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    struct TeamOptions {
        uint256 maxCap;
        uint256 sent;
    }

    mapping(address => TeamOptions) public team;

    uint256 public constant fullLockMonths = 18; // 18 months full lock
    uint256 public constant periodMonths = 3; // release every 3 months
    uint256 public constant numberOfPeriods = 5; // 5 total releases
    uint256 public createdAt; //counter start
    string public constant name = "NFTrade - Team";

    address public tokenAddress;

    constructor(address _tokenAddress) {
        tokenAddress = _tokenAddress;
        createdAt = block.timestamp;

        /* team[0x8eb62f29886c3d69Da21e7DdfB13EFCC9EB3E0FD] = TeamOptions(18098650 ether, 0);
        team[0xD80B0ECD49e1442f71dc6A5bD63E2DE3604a3c9D] = TeamOptions(4686510 ether, 0);
        team[0xba9F77bB2eFDF3F4Ee377f46D20926C6A82bA4c3] = TeamOptions(2350840 ether, 0); */
    }

    function addMember(address _address, uint256 _maxCap) onlyOwner external {
        team[_address] = TeamOptions(_maxCap, 0);
    }

    /**
    @dev Get amount of available team tokens per team member
    @return amount of tokens that can claimed
    */
    function getAvailableTokens(address _address) public view returns (uint256)
    {
        // 2592000 = 1 month;
        // how many months since contract creation
        uint256 months = block.timestamp.sub(createdAt).div(2592000);
        // total lock period
        uint256 totalReleasePeriod = numberOfPeriods.mul(periodMonths);
        uint256 totalLockPeriod = fullLockMonths + totalReleasePeriod;

        if (months >= totalLockPeriod) {
            // lock is over, we can unlock everything we have
            return team[_address].maxCap.sub(team[_address].sent);
        } else if (months < fullLockMonths) {
            // too early, tokens are still under full lock;
            return 0;
        }

        uint256 releasePerPeriod = team[_address].maxCap.div(numberOfPeriods);
        // +1 due to beginning of a month
        uint256 periodsCompleted = 1 + (months - fullLockMonths + 1).div(periodMonths);
        uint256 potentialAmount = releasePerPeriod.mul(periodsCompleted);
        
        return potentialAmount.sub(team[_address].sent);
    }

    /**
    @dev Claim unlocked team tokens
    @param to distination address
    @param amount tokens to send
    */
    function claim(address to, uint256 amount) nonReentrant external {
        require(getAvailableTokens(msg.sender) >= amount, "Requested amount cannot be claimed");
        team[msg.sender].sent = team[msg.sender].sent.add(amount);
        IERC20(tokenAddress).transfer(to, amount);
    }
}
