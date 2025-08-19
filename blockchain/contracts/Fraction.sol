// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Fraction
 * @dev Contrato para fraccionalizar un NFT (ERC721) en múltiples tokens (ERC20).
 * El contrato actúa como un "vault" que posee el NFT y emite tokens de fracción.
 */
contract Fraction is ERC20, Ownable {
    IERC721 public realEstateNFT;
    uint256 public tokenId;
    address public initialOwner;
    uint256 public pricePerFraction; // Precio por cada fracción en wei

    mapping(address => uint256) public released;
    uint256 public totalReleased;

    event PaymentReceived(address from, uint256 amount);
    event PaymentReleased(address to, uint256 amount);

    /**
     * @dev Constructor que inicializa el nombre y símbolo de los tokens de fracción.
     */
      constructor(
    string memory _name,
    string memory _symbol
) ERC20(_name, _symbol) Ownable(msg.sender) {}

    function initialize(
        address _realEstateNFTAddress,
        uint256 _tokenId,
        uint256 _supply,
        address _initialOwner,
        uint256 _pricePerFraction // Precio inicial por fracción
    ) external {
        require(tokenId == 0, "Already initialized"); // Solo se puede inicializar una vez
        realEstateNFT = IERC721(_realEstateNFTAddress);
        tokenId = _tokenId;
        initialOwner = _initialOwner;
        pricePerFraction = _pricePerFraction;

        _mint(_initialOwner, _supply * (10**18));

        // Transferir el NFT al contrato de fracción
        realEstateNFT.transferFrom(_initialOwner, address(this), _tokenId);
    }

    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    /**
     * @dev Permite al propietario del contrato (el propietario original del NFT)
     * "desfraccionalizar" el NFT, quemando todas las fracciones y recuperando el NFT.
     * Esto solo es posible si el propietario ha recuperado todas las fracciones circulantes.
     */
    function purchase(uint256 numberOfTokens) external payable {
        require(pricePerFraction > 0, "La venta de fracciones no esta habilitada");
        require(numberOfTokens > 0, "Debe comprar al menos una fraccion");

        uint256 cost = (numberOfTokens / (10**18)) * pricePerFraction;
        require(msg.value == cost, "Fondos insuficientes para la compra");

        uint256 ownerBalance = balanceOf(initialOwner);
        require(ownerBalance >= numberOfTokens, "El propietario no tiene suficientes fracciones para vender");

        // El propietario debe haber aprobado este contrato para transferir sus tokens
        _transfer(initialOwner, msg.sender, numberOfTokens);

        // Transferir los fondos al propietario inicial
        (bool sent, ) = initialOwner.call{value: msg.value}("");
        require(sent, "Error al transferir fondos al propietario");
    }

    function redeem() external onlyOwner {
        require(balanceOf(owner()) == totalSupply(), "Debes poseer todas las fracciones para redimir el NFT");

        // Quema todas las fracciones.
        _burn(owner(), totalSupply());

        // Devuelve el NFT al propietario.
        realEstateNFT.transferFrom(address(this), owner(), tokenId);
    }

    function withdraw() public {
        uint256 totalReceived = address(this).balance + totalReleased;
        uint256 userBalance = balanceOf(msg.sender);
        uint256 totalFractions = totalSupply();

        if (userBalance == 0 || totalFractions == 0) {
            return; // No hay nada que retirar
        }

        uint256 proportionalShare = (totalReceived * userBalance) / totalFractions;
        uint256 amountToWithdraw = proportionalShare - released[msg.sender];

        require(amountToWithdraw > 0, "No funds to withdraw");

        released[msg.sender] += amountToWithdraw;
        totalReleased += amountToWithdraw;

        (bool sent, ) = msg.sender.call{value: amountToWithdraw}("");
        require(sent, "Failed to send Ether");

        emit PaymentReleased(msg.sender, amountToWithdraw);
    }
}
