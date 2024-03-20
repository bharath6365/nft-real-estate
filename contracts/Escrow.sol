//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}



contract Escrow {
  address public inspector;
  address payable public seller;
  address public nftAddress;
  
  modifier onlySeller() {
    require(msg.sender == seller, "Only seller can call this function");
    _;
  }
  

  modifier notSeller() {
    require(msg.sender != seller, "Seller cannot call this function");
    _;
  }

  modifier onlyInspector(){
    require(msg.sender == inspector, "Only inspector can call this function");
    _;
  }

  modifier notInspector() {
    require(msg.sender != inspector, "Inspector cannot call this function");
    _;
  }

    modifier isValidListing(uint256 _nftID) {
        require(listings[_nftID].isListed, "NFT is not listed");
        _;
    }


  struct Listing {
    string status;
    Approval approval;
    address seller;
    address buyer; // Default: 0x0000000000000000000000000000000000000000
    uint256 purchasePrice;  // Default: 0
    uint256 downPayment; // Default: 0
    bool isListed; // Default: false
  }

  struct Approval {
    address inspector;
    address seller;
    address buyer;
  }

//   mapping(uint256 => bool) public isListed;
//   mapping(uint256 => uint256) public purchasePrice;
//   mapping (uint256 => uint256)  public escrowAmount;
//   mapping(uint256 => address) public buyer;

mapping(uint256 => Listing) public listings;
  


  constructor(address _nftContractAddress, address _inspector, address payable _seller) {
    nftAddress = _nftContractAddress;
    inspector = _inspector;
    seller = _seller;
  }

  
  
//    This will list a NFT inside the Escrow blockchain and will transfer the ownership to the contract.
  function list(uint256 _nftID, uint256 _purchasePrice ) public payable onlySeller {
    // Needs approval.
    IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);
    // Let's create a listing. If listing already found throw an error,
    require(!listings[_nftID].isListed, "NFT is already listed");

    Listing memory listing = Listing({
        status: 'LISTED',
        purchasePrice: _purchasePrice,
        isListed: true,
        approval: Approval({
            inspector: address(0),
            seller: address(0),
            buyer: address(0)
        }),
        seller: msg.sender,
        buyer: address(0),
        downPayment: 0
    });
    listings[_nftID] = listing;
  }

  // Called by the buyer   

  function registerIntentToBuy(uint256 _nftID) public notSeller notInspector isValidListing(_nftID) payable {
    Listing storage listing = listings[_nftID];
    //  Check if the person making the payment has enough funds.

    // Down payment passed should be 20% of value, which will get detected.
    require(msg.value == 100, "You don't have enought funds to make a downpayment this property.");
    
    listing.downPayment = msg.value;
    listing.status = 'PENDING_INSPECTION';

  }

  receive() external payable {
    // This contract should be able to receive funds.
  }

  function getBalance() public view returns (uint) {
    return address(this).balance;
  }
}
 