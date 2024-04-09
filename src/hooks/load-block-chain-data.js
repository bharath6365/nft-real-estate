import React , {useEffect} from 'react';
import { ethers } from 'ethers';
import { useToast } from '@chakra-ui/react';
import  config  from '../config.json';
import realEstateABI from '../abis/RealEstate.json';
import escrowABI from '../abis/Escrow.json';
import { store } from '../store';

let provider

const loadBlockChainData = async (toast) => {
  try {
    if (window.ethereum) {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      } else {
        window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
      }
  
      window.ethereum && window.ethereum.on('accountsChanged', (accounts) => {
        toast({
          title: 'Account changed.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      });
  
      if (provider) {

        const network = await provider.getNetwork();
        const signer = provider.getSigner();
        const realEstateContract = new ethers.Contract(config[network.chainId].realEstate.address, realEstateABI.abi, signer);
        const escrowContract = new ethers.Contract(config[network.chainId].escrow.address, escrowABI.abi, signer);

        escrowContract.on("InspectionCreated", (_nftID) => {
          alert(`Inspection Created for NFT ID: ${_nftID}`);
          // Update your UI here based on the received _nftID
      });
  
        // Get the address of the user.
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
  
        if (!address) {
          alert('Please connect metamask to this site. Then hit reload')
        }

        
        store.setState({escrowContract});
        store.setState({realEstateContract});

        const userType = await escrowContract.getUserType(address)    
        store.setState({user: {
          isLoggedIn: true,
          userType,
          userAddress: address
        }})
  

       
      }
  } catch (err) {
    console.error(err);
    alert('Error loading blockchain data')
  }
    
}

export const useLoadBlockChainData = () => {
  const toast = useToast();

  useEffect(() => {
    loadBlockChainData(toast).catch(console.error);
  }, [toast]);
}
