import React, { useEffect, useState } from 'react';
import { Heading, Button, useToast, useDisclosure, Flex, Spacer } from '@chakra-ui/react';
import { ethers } from 'ethers';
import { store } from '../store';
import PropertyCard from '../components/PropertyCard/PropertyCard';
import { useListedProperties } from '../hooks/load-listed-properties'; 
import {Loader} from '../components/Loader';
import TransactionModal from '../components/TransactionModal';
import { NotFound } from '../components/NotFound';
import { useFinalPaymentPendingProperties } from '../hooks/load-final-payment-pending-properties';

export const BuyerContainer = () => {
    const { escrowContract, user } = store(state => ({
       escrowContract: state.escrowContract,
       user: state.user
    }));

    const toast = useToast();
    const [isTxPending, setIsTxPending] = useState(false);
    const [transactionDetails, setTransactionDetails] = useState(null); // Store both transaction details and receipt
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [activeProperty, setActiveProperty] = useState(null); // Store the index of the active property

    const [activeAction, setActiveAction] = useState({index: null, action: null});

    const listPendingSale = useFinalPaymentPendingProperties(isTxPending);
    const { properties: pendingSaleProperties } = listPendingSale;

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
    };

    const registerIntentToBuy = async (property, index) => {
        try {
            setIsTxPending(true);
            setActiveProperty(index);

            const listingId = Number(property.id);
            const downPayment = await escrowContract.calculateDownPayment(listingId);
            const weiValue = ethers.utils.formatUnits(downPayment, "wei"); 

            const overrides = {
                value: weiValue
            };

            // Send transaction and wait for the receipt
            const transaction = await escrowContract.registerIntentToBuy(listingId, overrides);
            const receipt = await transaction.wait();

            // Set both transaction details and receipt for modal display
            setTransactionDetails({ transaction, receipt });
            onOpen(); // Open the modal

            toast({
                title: 'Transaction submitted',
                description: 'Your intent to buy has been registered.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
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
            setActiveProperty(null);
        }
    };

    const approveProperty = async (property, index) => {
        try {
            setIsTxPending(true);
            // Include action type in active action state
            setActiveAction({index, action: 'approve'});
            const listingId = Number(property.id);
            const listing= await escrowContract.listings(listingId);
            const listingPrice = ethers.utils.parseUnits(listing.purchasePrice.toString(), "wei");
            const downPayment = await escrowContract.calculateDownPayment(listingId);
            const weiValue = ethers.utils.formatUnits(listingPrice.sub(downPayment), "wei");

            await displayTransactionDetails(
                escrowContract.completePurchase(listingId, {value: weiValue})
            );
        } catch(err) {
            console.error(err);
        } finally {
            setIsTxPending(false);
            setActiveAction({index: null, action: null});
        }
    };

    const rejectProperty = async (property, index) => {
        try {
            setIsTxPending(true);
            setActiveAction({index, action: 'reject'});
            const listingId = Number(property.id);
            await displayTransactionDetails(
                escrowContract.declinePurchase(listingId)
            );
        } catch(err) {
            console.error(err);
        } finally {
            setIsTxPending(false);
            setActiveAction({index: null, action: null});
        }
    };

    const { properties } = useListedProperties(isTxPending);


    return (
        <>
         <TransactionModal isOpen={isOpen} onClose={onClose} transactionDetails={transactionDetails} />
          {
            !properties.length &&  pendingSaleProperties.length < 1 && (<NotFound message="No properties left to sell."  />)
          }
          {
            properties.length > 0 && (
                <section>
                <Heading as='h2' size='xl'>Properties on Sale</Heading>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    {properties.map((property, index) => {
                        const isLoading = activeProperty === index && isTxPending;
                        return (
                        <PropertyCard 
                            userType="BUYER"
                            key={property.id}
                            property={property}
                            actions={
                                <>
                                    {property.status === 0 && (
                                        <Button
                                            colorScheme="teal"
                                            bgGradient="linear(to-r, teal.400, teal.500, teal.600)"
                                            color="white"
                                            variant="solid"
                                            isLoading={isLoading}
                                            disabled={isLoading}
                                            onClick={() => registerIntentToBuy(property, index)}
                                        >
                                            Register intent to Buy
                                        </Button>
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
            </section>
            )
          }
            

            {
            pendingSaleProperties.length > 0 && (
                <section>
                    <Heading mb={8} as='h2' size='xl'>Properties waiting for your Final Payment</Heading>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        {pendingSaleProperties.map((property, index) => {
                            const isApproveLoading = isTxPending && activeAction.index === index && activeAction.action === 'approve';
                            const isRejectLoading = isTxPending && activeAction.index === index && activeAction.action === 'reject';
                            return (
                                <PropertyCard userType="SELLER" key={property.id} property={property} actions={
                                    <>
                                        {property.status === 3 && (
                                            <Flex m={5}>
                                                <Button colorScheme='green' isLoading={isApproveLoading} disabled={isApproveLoading || isRejectLoading} onClick={() => approveProperty(property, index)}>Approve</Button>
                                                <Spacer />
                                                <Button colorScheme='red' isLoading={isRejectLoading} disabled={isRejectLoading || isApproveLoading} onClick={() => rejectProperty(property, index)}>Reject</Button>
                                            </Flex>
                                        )}
                                    </>
                                }>
                                    <PropertyCard.Image />
                                    <PropertyCard.Name />
                                    <PropertyCard.Status />
                                </PropertyCard>
                            );
                        })}
                      </div>
                    </section>

                    
            )
           }

        </>
    );
};
