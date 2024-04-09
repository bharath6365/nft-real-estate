//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

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

  address public owner;

  enum ListingStatus {
    LISTED,
    PENDING_INSPECTION,
    INSPECTION_APPROVED,
    SELLER_APPROVED,
    SOLD
  }
  
  modifier onlySeller() {
    require(msg.sender == seller, "Only seller can call this function");
    _;
  }

  modifier onlyOwner() {
    require(msg.sender == owner, "Only owner can call this function");
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
    
    event InspectionCreated(uint256 nftID);
    event InspectionApproved(uint256 nftID);
    event InspectionRejected(uint256 nftID);
    event SellerApproved(uint256 nftID);
    event SellerDeclined(uint256 nftID);
    event SaleCompleted(uint256 nftID);
    event SaleDeclined(uint256 nftID);


  struct Listing {
    ListingStatus status;
    Approval approval;
    address seller;
    address buyer; // Default: 0x0000000000000000000000000000000000000000
    uint256 purchasePrice;  // Default: 0
    uint256 downPayment; // Default: 0
    bool isListed; // Default: false
  }

  struct Approval {
    address inspector;
  }

  mapping(uint256 => Listing) public listings;
  uint256 public listingCount;

   uint256 private downPaymentPercentage = 20; 

  mapping(address => uint256[]) public listingsPendingInspection;
  mapping(address => uint256[]) public listingsPendingSale;
  mapping(address => uint256[]) public listingsPendingBuyerPayment;
  


  constructor(address _nftContractAddress, address _inspector, address payable _seller) {
    nftAddress = _nftContractAddress;
    inspector = _inspector;
    seller = _seller;
    owner = msg.sender;

    listingsPendingInspection[_inspector] = new uint256[](0);
    listingsPendingSale[_seller] = new uint256[](0);
  }

  
  
//    This will list a NFT inside the Escrow blockchain and will transfer the ownership to the contract.
  function list(uint256 _nftID, uint256 _purchasePrice) public payable onlySeller {
    // Needs approval.
    IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);
    // Let's create a listing. If listing already found throw an error,
    require(!listings[_nftID].isListed, "NFT is already listed");

    Listing memory listing = Listing({
        status: ListingStatus.LISTED,
        purchasePrice: _purchasePrice,
        isListed: true,
        approval: Approval({
            inspector: address(inspector)
        }),
        seller: msg.sender,
        buyer: address(0),
        downPayment: 0
    });
    listings[_nftID] = listing;
    listingCount++;
  }

  // Called by the buyer   
  function registerIntentToBuy(uint256 _nftID) public notSeller notInspector isValidListing(_nftID) payable {
    Listing storage listing = listings[_nftID];
    //  Check if the person making the payment has enough funds.

    // Down payment is currently hardcoded to 100 wei.
    uint256 downPayment = calculateDownPayment(_nftID);
    require(msg.value == downPayment, "You don't have enought funds to make a downpayment for this property.");
    
    listing.downPayment = msg.value;
    listing.status = ListingStatus.PENDING_INSPECTION;
    listing.buyer = msg.sender;

    assignListingToInspector(_nftID);

  }

  function approveInspection(uint _nftID) public onlyInspector {
    Listing storage listing = listings[_nftID];
    require(listings[_nftID].status == ListingStatus.PENDING_INSPECTION, "Inspection is not pending.");
    listing.approval.inspector = msg.sender;
    listing.status = ListingStatus.INSPECTION_APPROVED;

    // Remove the listing from the pending inspection list.
    uint256[] storage listingsForInspection = listingsPendingInspection[address(inspector)];
    removeListingFromArray(listingsForInspection, _nftID);

    // Add the listing to the pending sale list.
    listingsPendingSale[listing.seller].push(_nftID);
    emit InspectionApproved(_nftID);


  }

  function rejectInspection(uint _nftID) public onlyInspector {
    Listing storage listing = listings[_nftID];
    require((listings[_nftID].status) == ListingStatus.PENDING_INSPECTION, "Inspection is not pending");
    listing.status = ListingStatus.LISTED;

    // Send make the downpayment refundable to the buyer.
    payable(listing.buyer).transfer(listing.downPayment);
    
    // Remove the listing from the pending inspection list.
    uint256[] storage listingsForInspection = listingsPendingInspection[address(inspector)];
    removeListingFromArray(listingsForInspection, _nftID);

    emit InspectionRejected(_nftID);

  }

  function approveSale(uint _nftID) public onlySeller  {
    require((listings[_nftID].status) == ListingStatus.INSPECTION_APPROVED, "Inspection is not approved");
    Listing storage listing = listings[_nftID];

  
     // Remove the listing from the pending sale list.
    uint256[] storage listingsForSale = listingsPendingSale[address(seller)];
    removeListingFromArray(listingsForSale, _nftID);
    
    listingsPendingBuyerPayment[listing.buyer].push(_nftID);

     listing.status = ListingStatus.SELLER_APPROVED; 

    emit SellerApproved(_nftID);
  }

  function declineSale(uint _nftID) public onlySeller {
    require((listings[_nftID].status) == ListingStatus.INSPECTION_APPROVED, "Inspection is not approved");
    Listing storage listing = listings[_nftID];

    payable(listing.buyer).transfer(listing.downPayment);
     
    listing.approval.inspector = address(0);

    listing.status = ListingStatus.LISTED;
    listing.buyer = address(0);

      // Remove the listing from the pending sale list.
    uint256[] storage listingsForSale = listingsPendingSale[address(seller)];
    removeListingFromArray(listingsForSale, _nftID);
    emit SellerDeclined(_nftID);
  }

   
// Function to be called by the buyer to complete the purchase.
function completePurchase(uint256 _nftID) public notSeller notInspector payable {
    Listing storage listing = listings[_nftID];

    // Require 1: Check if the listing's status is SELLER_APPROVED.
    require(listing.status == ListingStatus.SELLER_APPROVED, "Listing not approved by seller.");

    // Require 2: Ensure the buyer has sent enough funds to cover purchasePrice - downPayment.
    uint256 remainingPayment = listing.purchasePrice - listing.downPayment;
    require(msg.value >= remainingPayment, "Insufficient funds sent.");

    // Update the listing status to SOLD.
    listing.status = ListingStatus.SOLD;
    listing.buyer = msg.sender;

    // Transfer the NFT to the buyer.
    IERC721(nftAddress).transferFrom(address(this), msg.sender, _nftID);

    // Transfer the down payment and the remaining payment to the seller.
    (bool success, ) = payable(listing.seller).call{value: listing.purchasePrice}("");
    require(success, "Failed to send Ether to the seller");

    // If there's any excess payment, refund it to the buyer.
    if (msg.value > remainingPayment) {
        (success, ) = payable(msg.sender).call{value: msg.value - remainingPayment}("");
        require(success, "Failed to refund excess Ether to the buyer");
    }

    // Remove the listing from the pending buyer payment list.
    uint256[] storage listingsForBuyerPayment = listingsPendingBuyerPayment[msg.sender];
    removeListingFromArray(listingsForBuyerPayment, _nftID);


    emit SaleCompleted(_nftID);
}

// Function for the seller to decline the purchase after inspection approval.
function declinePurchase(uint256 _nftID) public notSeller notInspector {
    Listing storage listing = listings[_nftID];

    require(listing.status == ListingStatus.SELLER_APPROVED, "Only approved listings can be declined.");

    // Reset the listing for re-sale.
    listing.status = ListingStatus.LISTED;
    listing.downPayment = 0;
    listing.buyer = address(0);

    // Refund the down payment to the buyer using .call
    (bool success, ) = payable(listing.buyer).call{value: listing.downPayment}("");
    require(success, "Failed to refund down payment to the buyer");

     // Remove the listing from the pending buyer payment list.
    uint256[] storage listingsForBuyerPayment = listingsPendingBuyerPayment[msg.sender];
    removeListingFromArray(listingsForBuyerPayment, _nftID);


    emit SaleDeclined(_nftID);
}




  function getBalance() public view returns (uint) {
    return address(this).balance;
  }

  function calculateDownPayment(uint256 _nftID) public view returns (uint256) {
    // Ensure no division by zero occurs

    Listing memory listing = listings[_nftID];
    uint256 _purchasePrice = listing.purchasePrice;

    uint256 downPayment = (_purchasePrice * downPaymentPercentage) / 100;

    return downPayment;
  }

  function setDownPaymentPercentage(uint256 _percentage) external onlyOwner {
    downPaymentPercentage = _percentage;
  }

  function getUserType(address _userAddress) public view returns (string memory) {
     
     if (_userAddress == seller) return "SELLER";
     
     if (_userAddress == inspector) return "INSPECTOR";
     
    return "BUYER";
  }

  function getListingsPendingInspection(address _address) public view returns (uint256[] memory) {
    return listingsPendingInspection[_address];
  }

  function getListingsPendingSale(address _address) public view returns (uint256[] memory) {
    return listingsPendingSale[_address];
  }

  function getListingsPendingFinalBuyerPayment(address _address) public view returns (uint256[] memory) {
    return listingsPendingBuyerPayment[_address];
  }

  function assignListingToInspector(uint256 _nftID) internal {
    listingsPendingInspection[inspector].push(_nftID);
  }

  function removeListingFromArray(uint256[] storage array, uint256 value) internal {
        uint256 length = array.length;
        for (uint256 i = 0; i < length; i++) {
            if (array[i] == value) {
                array[i] = array[length - 1]; // Move the last element into the deleted spot
                array.pop(); // Remove the last element
                break; // Exit the loop since we found our value
            }
        }
    }

  receive() payable external {}

}
 