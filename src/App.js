import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { ChakraProvider, Container } from '@chakra-ui/react'
import { ColorModeScript } from '@chakra-ui/react'
import theme from './theme/theme'





// ABIs
import RealEstate from './abis/RealEstate.json'
import Escrow from './abis/Escrow.json'

// Config
import config from './config.json';
import { useLoadBlockChainData } from './hooks/load-block-chain-data';
import { store } from './store';
import { SellerContainer } from './containers/Seller';
import { BuyerContainer } from './containers/Buyer';
import { InspectorContainer } from './containers/Inspector';
import { Nav } from './containers/Navbar';

function App() {
  
  const {user}  = store(state => ({
    user: state.user
  }));
  useLoadBlockChainData();

  


  return (
   <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      
      <Nav /> 
      <Container maxW='1600px'>
        
       {
         user.userType === 'SELLER' && <SellerContainer />
       }

       {
          user.userType === 'BUYER' && <BuyerContainer />
       }

       {
          user.userType === 'INSPECTOR' && <InspectorContainer />
       }

          
      </Container>
    </ChakraProvider>

  );
}

export default App;
