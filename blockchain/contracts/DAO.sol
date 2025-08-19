// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RealEstate.sol";

contract DAO {
    // Referencia al contrato de NFTs para verificar la propiedad de tokens
    RealEstate public realEstateNFT;

    struct Proposal {
        uint256 id;
        uint256 tokenId; // ID del token de la propiedad a la que se refiere la propuesta
        string description; // Descripcion de la propuesta
        uint256 yesVotes; // Votos ponderados por fracciones
        uint256 noVotes; // Votos ponderados por fracciones
        bool executed; // Si la propuesta ya fue ejecutada
        address proposer; // Quien creo la propuesta
        mapping(address => bool) voters; // Para asegurar que cada inversor vote solo una vez
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(uint256 id, address proposer, string description);
    event Voted(uint256 proposalId, address voter, bool voteYes);

    constructor(address _realEstateNFTAddress) {
        realEstateNFT = RealEstate(_realEstateNFTAddress);
    }

    // Funcion para crear una nueva propuesta asociada a una propiedad especifica
    function createProposal(uint256 _tokenId, string memory _description) public {
        // Solo los dueños de fracciones de la propiedad pueden crear propuestas
        require(realEstateNFT.fractionalOwnership(_tokenId, msg.sender) > 0, "Solo los propietarios de fracciones de este inmueble pueden crear propuestas");

        Proposal storage newProposal = proposals[proposalCount];
        newProposal.id = proposalCount;
        newProposal.tokenId = _tokenId;
        newProposal.description = _description;
        newProposal.proposer = msg.sender;

        emit ProposalCreated(proposalCount, msg.sender, _description);
        proposalCount++;
    }

    // Funcion para votar en una propuesta (voto ponderado)
    function vote(uint256 _proposalId, bool _voteYes) public {
        Proposal storage proposal = proposals[_proposalId];
        uint256 voterWeight = realEstateNFT.fractionalOwnership(proposal.tokenId, msg.sender);

        // Requerimientos para poder votar:
        // 1. El votante debe poseer fracciones de la propiedad asociada a la propuesta
        require(voterWeight > 0, "Solo los propietarios de fracciones de este inmueble pueden votar");
        // 2. El votante no debe haber votado antes en esta propuesta
        require(!proposal.voters[msg.sender], "Ya has votado en esta propuesta");

        proposal.voters[msg.sender] = true;

        if (_voteYes) {
            proposal.yesVotes += voterWeight;
        } else {
            proposal.noVotes += voterWeight;
        }

        emit Voted(_proposalId, msg.sender, _voteYes);
    }

    // Funcion de vista para obtener los detalles de una propuesta
    function getProposal(uint256 _proposalId) 
        public 
        view 
        returns (uint256 id, string memory description, uint256 yesVotes, uint256 noVotes, bool executed, address proposer)
    {
        Proposal storage p = proposals[_proposalId];
        return (p.id, p.description, p.yesVotes, p.noVotes, p.executed, p.proposer);
    }

    // Funcion de vista para saber si una wallet ya voto en una propuesta especifica
    function hasVoted(uint256 _proposalId, address _voter) public view returns (bool) {
        return proposals[_proposalId].voters[_voter];
    }

    // Funcion para ejecutar una propuesta si alcanza la mayoria de fracciones
    function executeProposal(uint256 _proposalId) public {
        Proposal storage proposal = proposals[_proposalId];
        uint256 totalFractionsSold = realEstateNFT.fractionsSold(proposal.tokenId);

        // Requerimientos para ejecutar:
        // 1. La propuesta no debe haber sido ejecutada antes
        require(!proposal.executed, "La propuesta ya fue ejecutada");
        // 2. Los votos a favor deben superar la mitad del total de fracciones vendidas
        require(proposal.yesVotes > (totalFractionsSold / 2), "La propuesta no alcanzo la mayoria de votos (mas del 50% de las fracciones)");

        // Logica de ejecucion aqui (por ahora simple)
        proposal.executed = true;

        // En un futuro, podria interactuar con otros contratos o liberar fondos.
    }
}