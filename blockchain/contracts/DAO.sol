// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RealEstate.sol";

contract DAO {
    // Referencia al contrato de NFTs para verificar la propiedad de tokens
    RealEstate public realEstateNFT;

    struct Proposal {
        uint256 id;
        string description; // Descripcion de la propuesta (ej. "Remodelar cocina de la propiedad #5")
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;      // Si la propuesta ya fue ejecutada
        address proposer;   // Quien creo la propuesta
        mapping(address => bool) voters; // Para asegurar que cada inversor vote solo una vez
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(uint256 id, address proposer, string description);
    event Voted(uint256 proposalId, address voter, bool voteYes);

    constructor(address _realEstateNFTAddress) {
        realEstateNFT = RealEstate(_realEstateNFTAddress);
    }

    // Funcion para crear una nueva propuesta
    function createProposal(string memory _description) public {
        // Solo los duenos de al menos un NFT (o fraccion) pueden crear propuestas
        require(realEstateNFT.balanceOf(msg.sender) > 0, "Solo los duenos de NFT pueden crear propuestas");

        Proposal storage newProposal = proposals[proposalCount];
        newProposal.id = proposalCount;
        newProposal.description = _description;
        newProposal.proposer = msg.sender;

        emit ProposalCreated(proposalCount, msg.sender, _description);
        proposalCount++;
    }

    // Funcion para votar en una propuesta
    function vote(uint256 _proposalId, bool _voteYes) public {
        Proposal storage proposal = proposals[_proposalId];

        // Requerimientos para poder votar:
        // 1. El votante debe poseer al menos un NFT
        require(realEstateNFT.balanceOf(msg.sender) > 0, "Solo los duenos de NFT pueden votar");
        // 2. El votante no debe haber votado antes en esta propuesta
        require(!proposal.voters[msg.sender], "Ya has votado en esta propuesta");

        proposal.voters[msg.sender] = true;

        if (_voteYes) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }

        emit Voted(_proposalId, msg.sender, _voteYes);
    }

    // Funcion de vista para obtener los detalles de una propuesta
    function getProposal(uint256 _proposalId) public view returns (uint256, string memory, uint256, uint256, bool, address) {
        Proposal storage p = proposals[_proposalId];
        return (p.id, p.description, p.yesVotes, p.noVotes, p.executed, p.proposer);
    }

    // Funcion de vista para saber si una wallet ya voto en una propuesta especifica
    function hasVoted(uint256 _proposalId, address _voter) public view returns (bool) {
        return proposals[_proposalId].voters[_voter];
    }

    // (Opcional) Funcion para ejecutar una propuesta. Por ahora, solo la marca como ejecutada.
    // En un futuro, podria interactuar con otros contratos o liberar fondos.
    function executeProposal(uint256 _proposalId) public {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.yesVotes > proposal.noVotes, "La propuesta no tiene suficientes votos a favor");
        require(!proposal.executed, "La propuesta ya fue ejecutada");

        // Logica de ejecucion aqui (por ahora simple)
        proposal.executed = true;

        // Aqui se podria transferir fondos, llamar a otro contrato, etc.
    }
}
