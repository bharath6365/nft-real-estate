// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const { ethers } = require('hardhat');

const etherPrice = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}


async function main() {
  const [seller, inspector, buyer, ...rest] = await ethers.getSigners()
  const realEstateFactory = await ethers.getContractFactory('RealEstate')
  const realEstate  = await realEstateFactory.deploy()
  await realEstate.deployed()

  console.log(`Deployed Real Estate Contract at: ${realEstate.address}`)
  console.log(`Minting 3 properties...\n`)
  for (let i = 0; i < 3; i++) {
    const transaction = await realEstate.connect(seller).mint(`https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i + 1}.json`)
    await transaction.wait()
  }
  
  const Escrow = await ethers.getContractFactory('Escrow')
  const escrow = await Escrow.deploy(
    realEstate.address,
    inspector.address,
    seller.address,
  )
  await escrow.deployed()

  console.log(`Deployed Escrow Contract at: ${escrow.address}`)
  console.log(`Listing 3 properties...\n`)
  
  let transaction
  for (let i = 0; i < 3; i++) {
    // Approve properties...
    transaction = await realEstate.connect(seller).approve(escrow.address, i + 1)
    await transaction.wait()
  }

  transaction = await escrow.connect(seller).list(1, etherPrice(20))
  await transaction.wait()

  transaction = await escrow.connect(seller).list(2, etherPrice(15))
  await transaction.wait()

  transaction = await escrow.connect(seller).list(3, etherPrice(10))
  await transaction.wait()

  console.log(`Finished.`)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
