//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";


 


// This needs to create a NFT contract, so it should be a ERC721 contract.
contract RealEstate is ERC721URIStorage {
  using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    constructor() ERC721("RealEstate", "REAL_ESTATE_NFT") {}

    function mint(string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        return newItemId;
    }
    
    // Total amount of NFT's minted.
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
}
