import React, { useEffect, useState } from 'react';
import {Heading, Button, Flex, Spacer, useToast, useDisclosure} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { store } from '../store'; // Adjust the import path as needed
import PropertyCard from '../components/PropertyCard/PropertyCard'; // Component to display each property
import { useListedProperties } from '../hooks/load-listed-properties';
import { useInspectionPendingProperties } from '../hooks/load-inspection-pending-properties';
import { NotFound } from '../components/NotFound';
import TransactionModal from '../components/TransactionModal';




export const InspectorContainer = () => {
    const {toast} = useToast();
    const {escrowContract} = store(state => ({
       escrowContract: state.escrowContract
    }))
    const [isTxPending, setIsTxPending] = useState(false);
    const [activeProperty, setActiveProperty] = useState(null);

    const [transactionDetails, setTransactionDetails] = useState({});
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [activeAction, setActiveAction] = useState({index: null, action: null});

    
    const displayTransactionDetails = async (transactionPromise) => {
        setIsTxPending(true);
        try {
            const transaction = await transactionPromise;
            const receipt = await transaction.wait();
            setTransactionDetails({transaction, receipt});
            onOpen(); // Open the modal
        } catch (err) {
            console.error(err);
            toast({
                title: 'Transaction failed',
                description: 'Something went wrong with your transaction.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsTxPending(false);
            setActiveAction({index: null, action: null});
        }
    };// New state for tracking transaction status

    const approveProperty = async (property, index) => {
        try {
        setIsTxPending(true)
        setActiveProperty(index)
        setActiveAction({index, action: 'approve'});
        // Convert the listing id to a uint256
        const listingId = Number(property.id);
        
        await displayTransactionDetails(escrowContract.approveInspection(listingId));
        } catch(err) {
           console.error(err)
        
        }
        finally {
            setIsTxPending(false)
            setActiveAction({index: null, action: null});
        }
    }

    const rejectProperty = async (property, index) => {
        try {
        setIsTxPending(true)
        setActiveProperty(index)
        setActiveAction({index, action: 'reject'});
        // Convert the listing id to a uint256
        const listingId = Number(property.id);
        
        await displayTransactionDetails(escrowContract.rejectInspection(listingId));
        } catch(err) {
           console.error(err)
        }
        finally {
            setIsTxPending(false)
            setActiveAction({index: null, action: null});
        }
    }


    const { properties } = useInspectionPendingProperties(isTxPending);

    return (
        <>
        <TransactionModal isOpen={isOpen} onClose={onClose} transactionDetails={transactionDetails} />
        {!properties.length && (<NotFound message="No properties left to inspect." />)}
        {
            properties.length > 0 && (
            <div>
                <Heading mb={5} as='h2' size='xl' noOfLines={1}>
                    Properties pending Inspection
                </Heading>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    {properties.map((property, index) => {
                        const isApproveLoading = isTxPending && activeAction.index === index && activeAction.action === 'approve';
                        const isRejectLoading = isTxPending && activeAction.index === index && activeAction.action === 'reject';
                        return (
                        <PropertyCard 
                            userType="BUYER" 
                            key={property.id} 
                            property={property}
                            actions={
                                <>
                                    {property.status === 1 && (
                                        <Flex m={5}>
                                        <Button colorScheme='green' isLoading={isApproveLoading} disabled={isApproveLoading} onClick={() => approveProperty(property, index)}>Approve</Button>
                                        <Spacer />
                                        <Button colorScheme='red' isLoading={isRejectLoading} disabled={isRejectLoading} onClick={() => rejectProperty(property, index)}>Reject</Button>
                                        </Flex>
                                    )}
                                </>
                            }
                        >
                        <PropertyCard.Image />
                            <PropertyCard.Name />
                            <PropertyCard.Description />
                            <PropertyCard.Attributes />
                            <PropertyCard.Status />
                        </PropertyCard>
                    )})}
                  </div>
               </div>
            )
        }
        
        </>
    );
};

