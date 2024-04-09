import React from 'react';
import { Flex, Box, Text, Button, useColorModeValue, Image } from '@chakra-ui/react';
import { store } from '../store'; // Adjust the import path according to where your store is defined

export const Nav = () => {
  const { user } = store(state => ({ user: state.user }));

  // Use color mode value to switch between light and dark theme colors
  const navbarBg = useColorModeValue('gray.800', 'gray.900'); // Darker background for both themes
  const buttonBg = useColorModeValue('teal.300', 'teal.500'); // Vibrant button color

  return (
    <Flex bg={navbarBg} color="white" justifyContent="space-between" alignItems="center" p={4} boxShadow="sm">
      <Box>
        <Image src="/real-estate.webp" alt="Real Estate" boxSize="50px" />
      </Box>
      <Box>
        <Button backgroundColor={buttonBg} _hover={{ bg: 'teal.600' }} variant="solid">
          {user.isLoggedIn ? user.userType : 'Guest'}
        </Button>
      </Box>
    </Flex>
  );
};
