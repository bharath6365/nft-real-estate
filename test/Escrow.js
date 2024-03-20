const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    let buyer, seller, inspector, realEstate, escrow
    beforeEach(async () => {
        [buyer, seller, inspector, lender] = await ethers.getSigners()
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
            lender.address,
            inspector.address,
            seller.address,
          );

        //   Approve the transaction
        transaction =  await realEstate.connect(seller).approve(escrow.address, 1)

        // Update the ownership
        transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5))
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
        expect(await escrow.lender()).to.equal(lender.address)
        expect(await escrow.inspector()).to.equal(inspector.address)
        expect(await escrow.seller()).to.equal(seller.address)
    });
   })

   describe('Listing', async () => {
      it('should update ownership', async () => {
        expect(await realEstate.ownerOf(1)).to.equal(escrow.address)
        expect(await escrow.isListed(1)).to.equal(true)
      })

      it('should update purchase price', async () => {
        expect(await escrow.purchasePrice(1)).to.equal(tokens(10))
      })

      it('should update escrow amount',async () => {
        expect(await escrow.escrowAmount(1)).to.equal(tokens(5))
      })
   })

   describe('Deposit money',  () => {
    it('updates contract balance', async () => {
        const transaction = await escrow.connect(buyer).depositEarnest(1, {value: tokens(5)})
        await transaction.wait()
        expect(await escrow.getBalance()).to.equal(tokens(5))
    })
   })
})
