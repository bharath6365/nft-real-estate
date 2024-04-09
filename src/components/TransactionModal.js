import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Button,
  Text,
  VStack
} from '@chakra-ui/react';
import { ethers } from 'ethers';

const TransactionModal = ({ isOpen, onClose, transactionDetails }) => {
    const { transaction, receipt } = transactionDetails || {};
    if (!receipt || !transaction) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Transaction Details</ModalHeader>
                <ModalBody overflowY='scroll' maxH='440px'>
                    <VStack spacing={3} align="start">
                        <Text wordBreak="break-word">Transaction Hash: {transaction.hash}</Text>
                        <Text wordBreak="break-word">Block Hash: {receipt.blockHash}</Text>
                        <Text>Block Number: {receipt.blockNumber}</Text>
                        <Text>Transaction Index: {receipt.transactionIndex}</Text>
                        <Text>From: {transaction.from}</Text>
                        <Text>To: {transaction.to}</Text>
                        <Text>Nonce: {transaction.nonce}</Text>
                        <Text>Gas Limit: {transaction.gasLimit.toString()}</Text>
                        <Text>Gas Price: {transaction.gasPrice.toString()} wei</Text>
                        <Text>Gas Used: {receipt.gasUsed.toString()}</Text>
                        <Text>Cumulative Gas Used: {receipt.cumulativeGasUsed.toString()}</Text>
                        <Text>Effective Gas Price: {receipt.effectiveGasPrice.toString()} wei</Text>
                        <Text>Value: {ethers.utils.formatEther(transaction.value)} ETH</Text>
                        {receipt.status !== undefined && <Text>Status: {receipt.status === 1 ? 'Success' : 'Failed'}</Text>}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button colorScheme='blue' mr={3} onClick={onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default TransactionModal;
