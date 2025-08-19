// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Reputation {

    struct UserReputation {
        uint256 totalRating;
        uint256 ratingCount;
    }

    mapping(address => UserReputation) public reputations;
    mapping(bytes32 => bool) public hasRated;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addRating(address _user, uint8 _rating, uint256 _transactionId) external {
        bytes32 ratingId = keccak256(abi.encodePacked(msg.sender, _user, _transactionId));
        require(!hasRated[ratingId], "Transaction already rated");
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");

        reputations[_user].totalRating += _rating;
        reputations[_user].ratingCount++;
        hasRated[ratingId] = true;
    }

    function getAverageRating(address _user) public view returns (uint256) {
        UserReputation storage reputation = reputations[_user];
        if (reputation.ratingCount == 0) {
            return 0;
        }
        return reputation.totalRating / reputation.ratingCount;
    }
}
