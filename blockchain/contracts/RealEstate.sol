// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RealEstate is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId;

    // --- State for Fractional Ownership ---
    uint256 public constant TOTAL_FRACTIONS_PER_PROPERTY = 1000;
    uint256 public fractionPriceInWei = 0.01 ether; // Example: 0.01 ETH per fraction
    mapping(uint256 => mapping(address => uint256)) public fractionalOwnership;
    mapping(uint256 => uint256) public fractionsSold;

    // --- State for Offers ---
    struct Offer {
        address offerer;
        uint256 amount;
        bool isActive;
    }
    mapping(uint256 => Offer) public highestOffer;

    // --- Events ---
    event OfferMade(uint256 indexed tokenId, address indexed offerer, uint256 amount);
    event FractionsPurchased(uint256 indexed tokenId, address indexed buyer, uint256 count, uint256 totalCost);

    constructor(address initialOwner)
        ERC721("RealiChain", "REAL")
        ERC721Enumerable()
        Ownable(initialOwner)
    {}

    function safeMint(address to, string memory uri) public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function purchaseFractions(uint256 tokenId, uint256 numberOfFractions) public payable nonReentrant {
        require(tokenId < _nextTokenId, "Token does not exist.");
        require(numberOfFractions > 0, "Must purchase at least one fraction.");
        require(fractionsSold[tokenId] + numberOfFractions <= TOTAL_FRACTIONS_PER_PROPERTY, "Not enough fractions available.");

        uint256 totalCost = fractionPriceInWei * numberOfFractions;
        require(msg.value == totalCost, "Incorrect Ether amount sent.");

        fractionsSold[tokenId] += numberOfFractions;
        fractionalOwnership[tokenId][msg.sender] += numberOfFractions;

        emit FractionsPurchased(tokenId, msg.sender, numberOfFractions, totalCost);
    }

    function makeOffer(uint256 tokenId) public payable nonReentrant {
        require(tokenId < _nextTokenId, "Token does not exist.");
        require(msg.value > 0, "Offer amount must be greater than zero.");
        require(msg.value > highestOffer[tokenId].amount, "Offer must be higher than the current highest offer.");

        // Refund the previous highest bidder if they exist
        if (highestOffer[tokenId].isActive) {
            (bool sent, ) = highestOffer[tokenId].offerer.call{value: highestOffer[tokenId].amount}("");
            require(sent, "Failed to refund previous offerer");
        }

        highestOffer[tokenId] = Offer(msg.sender, msg.value, true);
        emit OfferMade(tokenId, msg.sender, msg.value);
    }

    // --- View Functions ---
    function getFractionsOwned(uint256 tokenId, address owner) public view returns (uint256) {
        return fractionalOwnership[tokenId][owner];
    }

    // The following functions are overrides required by Solidity.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
