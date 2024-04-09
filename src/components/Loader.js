import React from 'react';
import { Flex, Skeleton } from '@chakra-ui/react'
export const Loader = () => (
    <Flex>
        <Skeleton height='20px' />
        <Skeleton height='20px' />
        <Skeleton height='20px' />
   </Flex>
)