const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ListingStatus = {
    LISTED: 0,
    PENDING_INSPECTION: 1,
    INSPECTION_APPROVED: 2,
    SOLD: 3
  };

describe('Escrow', () => {
    let buyer, seller, inspector, realEstate, escrow
    beforeEach(async () => {
        [buyer, inspector, seller] = await ethers.getSigners()
        // Deployment
          const realEstateFactory = await ethers.getContractFactory('RealEstate')
          realEstate  = await realEstateFactory.deploy()
          
          // Create/mint NFT.
          let transaction = await realEstate.connect(seller).mint('https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS')
          await transaction.wait()
    
          const escrowFactory = await ethers.getContractFactory('Escrow')
          // Create escrow
           escrow = await escrowFactory.deploy(
            realEstate.address,
            inspector.address,
            seller.address,
          );

        //   Approve the transaction
        transaction =  await realEstate.connect(seller).approve(escrow.address, 1)

        // Update the ownership
        transaction = await escrow.connect(seller).list(1, tokens(0.25))
        await transaction.wait()
    });

    describe('deployment', async () => {
        it('deploys successfully', async () => {
            expect(escrow.address).to.not.equal(0x0)
             expect(realEstate.address).to.not.equal(0x0)
        });
    });


   describe('Escrow constructor', async () => { 
    it('should have the correct values', async () => {
        const nftAddress = await escrow.nftAddress()
        expect(nftAddress).to.equal(realEstate.address)
        expect(await escrow.seller()).to.equal(seller.address)
    });
   })

   describe('Listing', async () => {
      it('should update the status of the escrow', async () => {
         const listing = await escrow.listings(1)
         expect(listing.status).to.equal(ListingStatus.LISTED)
         expect(listing.seller).to.equal(seller.address)
      });

      it('should update the purchase price', async () => {
          const listing = await escrow.listings(1)
          expect(listing.purchasePrice).to.equal(tokens(0.25))
      });

      it('should update isListed property', async () => {
          const listing = await escrow.listings(1)
            expect(listing.isListed).to.equal(true)
        })

       it('should not update buyer address', async () => {
              const listing = await escrow.listings(1)
              expect(listing.buyer).to.equal(ethers.constants.AddressZero)
        })

        it('should update inspector address', async () => {
            const listing = await escrow.listings(1)
            expect(listing.approval.inspector).to.equal(inspector.address)
        })

        it('should not update downpayment', async () => {
            const listing = await escrow.listings(1)
            expect(listing.downPayment).to.equal(0)
        })

   })

   describe('Buyer Intent', () => {
    let downPayment;
    let oldBalance;

    beforeEach(async () => {
        downPayment = await escrow.calculateDownPayment(1);
        oldBalance = await ethers.provider.getBalance(buyer.address);
        await escrow.connect(buyer).registerIntentToBuy(1, { value: downPayment });
    });

    it('should update the buyer address', async () => {
        const listing = await escrow.listings(1);
        expect(listing.buyer).to.equal(buyer.address);
    });

    it('should update the status of the escrow', async () => {
        const listing = await escrow.listings(1);
        expect(listing.status).to.equal(ListingStatus.PENDING_INSPECTION);
    });

    it('should deduct the downpayment from the buyer', async () => {
        // Note: Since the transaction was already made in beforeEach, you can't repeat it here.
        // Instead, compare balances or use events/logs to verify the deduction if necessary.
        const newBalance = await ethers.provider.getBalance(buyer.address);
        // The assertion needs to account for gas costs if you're directly comparing old and new balances.
        // This approach may require adjustments since the actual transaction and gas cost happened in beforeEach.
        expect(newBalance).to.be.lessThan(oldBalance);
    });
   });

   describe('Inspection', () => {
    let downPayment;
    let tx

    beforeEach(async () => {
        downPayment = await escrow.calculateDownPayment(1);
        await escrow.connect(buyer).registerIntentToBuy(1, { value: downPayment });
    });

    describe('Inspection Approval', () => {
        beforeEach(async () => {
           tx =  await escrow.connect(inspector).approveInspection(1);
           await tx.wait();
        });

        it('Should emit inspection approved event', async () => {
            await expect(tx).to.emit(escrow, 'InspectionApproved').withArgs(1);
        });

        it('Should update the status of the escrow', async () => {
          const listing = await escrow.listings(1);
          expect(listing.status).to.equal(ListingStatus.INSPECTION_APPROVED);
        });

        it('should remove the listing from the pending inspection list',async () => {
            const pendingInspectionListing = await escrow.listingsPendingInspection(inspector.address);
            expect(pendingInspectionListing).to.equal(0);
        })

        it('should add entry to listings pending sale', async () => {
            const pendingSaleListing = await escrow.listingsPendingSale(seller.address);
            expect(pendingSaleListing).to.equal(1);
        })
    });

    describe('Inspection Rejection', () => {
        let buyerOldBalance;
      
        beforeEach(async () => {
            buyerOldBalance = await ethers.provider.getBalance(buyer.address);
            tx = await escrow.connect(inspector).rejectInspection(1);
            await tx.wait();
        });

        it('Should emit inspection rejected event', async () => {
            await expect(tx).to.emit(escrow, 'InspectionRejected').withArgs(1);
        });

        it('Should update the status of the escrow', async () => {
            const listing = await escrow.listings(1);
            expect(listing.status).to.equal(ListingStatus.LISTED);
        });

        it('should remove the listing from the pending inspection list',async () => {
            const pendingInspectionListing = await escrow.listingsPendingInspection(inspector.address);
            expect(pendingInspectionListing).to.equal(0);
        })

        it('should refund the buyer the downpayment amount', async () => {
            const newBalance = await ethers.provider.getBalance(buyer.address);
            expect(newBalance).to.be.greaterThan(buyerOldBalance);
        });
    });

    
   });

})
