// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Reputation.sol";

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
    mapping(uint256 => address) public fractionContracts;
    Reputation public reputationContract;

    // --- State for Rental ---
    struct Rental {
        address tenant;
        uint256 rentPricePerDay; // Price in Wei per day
        uint256 rentedUntil;     // Timestamp when the rent expires
        bool isListed;           // True if the property is listed for rent
    }
    mapping(uint256 => Rental) public rentalInfo;
    mapping(address => uint256) public pendingWithdrawals; // Rental income pending for withdrawal

    // --- Events ---
    event OfferMade(uint256 indexed tokenId, address indexed offerer, uint256 amount);
    event FractionsPurchased(uint256 indexed tokenId, address indexed buyer, uint256 count, uint256 totalCost);
    event PropertyListedForRent(uint256 indexed tokenId, uint256 pricePerDay);
    event PropertyRented(uint256 indexed tokenId, address indexed tenant, uint256 rentedUntil);
    event PropertyUnlistedForRent(uint256 indexed tokenId);
    event RentWithdrawn(address indexed owner, uint256 amount);
    event OfferAccepted(uint256 indexed tokenId, address indexed owner, address indexed offerer, uint256 amount);
    event OfferWithdrawn(uint256 indexed tokenId, address indexed offerer);
    event PropertyFractionalized(uint256 indexed tokenId, address indexed fractionContract);
    event Rated(address indexed rater, address indexed rated, uint256 indexed tokenId, uint8 rating);

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
        require(msg.value > highestOffer[tokenId].amount, "La oferta debe ser mayor que la oferta mas alta actual.");

        // Refund the previous highest bidder if they exist
        if (highestOffer[tokenId].isActive) {
            (bool sent, ) = highestOffer[tokenId].offerer.call{value: highestOffer[tokenId].amount}("");
            require(sent, "Failed to refund previous offerer");
        }

        highestOffer[tokenId] = Offer(msg.sender, msg.value, true);
        emit OfferMade(tokenId, msg.sender, msg.value);
    }

    function acceptOffer(uint256 tokenId) public nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can accept an offer.");
        Offer storage offer = highestOffer[tokenId];
        require(offer.isActive, "No active offer to accept.");

        address offerer = offer.offerer;
        uint256 amount = offer.amount;

        // Mark offer as inactive before transfer to prevent re-entrancy
        offer.isActive = false;
        offer.offerer = address(0);
        offer.amount = 0;

        // Transfer NFT to the offerer
        _transfer(msg.sender, offerer, tokenId);

        // Send the funds to the original owner
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send Ether to the owner.");

        emit OfferAccepted(tokenId, msg.sender, offerer, amount);
    }

    function setReputationContract(address _reputationContractAddress) external onlyOwner {
        reputationContract = Reputation(_reputationContractAddress);
    }

    function setFractionContract(uint256 tokenId, address fractionContractAddress) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(fractionContracts[tokenId] == address(0), "Already fractionalized");
        fractionContracts[tokenId] = fractionContractAddress;
        emit PropertyFractionalized(tokenId, fractionContractAddress);
    }

    function withdrawOffer(uint256 tokenId) public nonReentrant {
        Offer storage offer = highestOffer[tokenId];
        require(offer.offerer == msg.sender, "Only the offerer can withdraw this offer.");
        require(offer.isActive, "No active offer to withdraw.");

        uint256 amount = offer.amount;

        // Mark offer as inactive before transfer
        offer.isActive = false;
        offer.offerer = address(0);
        offer.amount = 0;
        
        // Refund the offerer
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to refund offerer.");

        emit OfferWithdrawn(tokenId, msg.sender);
    }

    // --- Rental Functions ---

    function listPropertyForRent(uint256 tokenId, uint256 rentPricePerDay) public {
        require(ownerOf(tokenId) == msg.sender, "Only the property owner can list it for rent.");
        require(rentPricePerDay > 0, "Rent price must be positive.");

        rentalInfo[tokenId].rentPricePerDay = rentPricePerDay;
        rentalInfo[tokenId].isListed = true;

        emit PropertyListedForRent(tokenId, rentPricePerDay);
    }

    function unlistPropertyForRent(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Only the property owner can unlist it.");
        Rental storage rental = rentalInfo[tokenId];
        require(rental.isListed, "Property is not listed for rent.");
        require(block.timestamp >= rental.rentedUntil, "Cannot unlist while property is rented.");

        rental.isListed = false;

        emit PropertyUnlistedForRent(tokenId);
    }

    function rentProperty(uint256 tokenId, uint256 durationInDays) public payable nonReentrant {
        require(tokenId < _nextTokenId, "Token does not exist.");
        Rental storage rental = rentalInfo[tokenId];
        require(rental.isListed, "Property is not listed for rent.");
        require(block.timestamp >= rental.rentedUntil, "Property is currently rented.");
        require(durationInDays > 0, "Rental duration must be at least 1 day.");

        uint256 totalRentCost = rental.rentPricePerDay * durationInDays;
        require(msg.value == totalRentCost, "Incorrect Ether amount for rent.");

        // Update rental status
        rental.tenant = msg.sender;
        rental.rentedUntil = block.timestamp + (durationInDays * 1 days);

        // Distribute rent to fractional owners
        // This is a simplified distribution. In a real-world scenario with many owners,
        // an iterable mapping or a more advanced structure would be needed to avoid high gas fees.
        // For this example, we can't iterate, so we use a pull pattern.
        // The logic below is conceptual and needs a list of owners to work directly.
        // A better approach is to let owners withdraw their share.

        // The payment is held in the contract, and owners withdraw their share.
        // This part requires knowing all fractional owners, which is not directly iterable.
        // We will credit earnings to be withdrawn later.
        // This is a complex problem. For now, we will just hold the funds and add a withdraw function.
        // A full implementation requires tracking all owners.
        // Let's credit the owner of the NFT for simplicity for now.
        address fractionContractAddress = fractionContracts[tokenId];
        if (fractionContractAddress != address(0)) {
            // La propiedad esta fraccionada, enviar fondos al contrato de fraccion.
            (bool sent, ) = fractionContractAddress.call{value: msg.value}("");
            require(sent, "Failed to forward rent to fraction contract");
        } else {
            // La propiedad no esta fraccionada, acreditar al dueno.
            address propertyOwner = ownerOf(tokenId);
            pendingWithdrawals[propertyOwner] += msg.value;
        }

        emit PropertyRented(tokenId, msg.sender, rental.rentedUntil);
    }

    function rateRental(uint256 tokenId, uint8 rating) public {
        Rental storage rental = rentalInfo[tokenId];
        address owner = ownerOf(tokenId);

        require(rental.rentedUntil > 0, "Property was not rented");
        require(block.timestamp > rental.rentedUntil, "Cannot rate before rental period ends");
        require(msg.sender == owner || msg.sender == rental.tenant, "Only owner or tenant can rate");

        address userToRate;
        if (msg.sender == owner) {
            userToRate = rental.tenant;
        } else {
            userToRate = owner;
        }

        // Create a unique ID for this specific rental transaction to prevent re-rating
        uint256 transactionId = uint256(keccak256(abi.encodePacked(tokenId, rental.rentedUntil)));

        reputationContract.addRating(userToRate, rating, transactionId);

        emit Rated(msg.sender, userToRate, tokenId, rating);
    }

    function withdrawRent() public nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No rent to withdraw.");

        pendingWithdrawals[msg.sender] = 0;

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send Ether");

        emit RentWithdrawn(msg.sender, amount);
    }

    // --- View Functions ---
    function getFractionsOwned(uint256 tokenId, address owner) public view returns (uint256) {
        return fractionalOwnership[tokenId][owner];
    }

    function getFractionsSold(uint256 tokenId) public view returns (uint256) {
        return fractionsSold[tokenId];
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