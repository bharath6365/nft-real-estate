import React, { useEffect, useState } from 'react';
import { Progress, Heading, Button, Flex, Spacer, useDisclosure, useToast } from '@chakra-ui/react';
import { store } from '../store'; // Adjust the import path as needed
import PropertyCard from '../components/PropertyCard/PropertyCard'; // Component to display each property
import { useListedProperties } from '../hooks/load-listed-properties';
import { useFinalSalePendingProperties } from '../hooks/load-sale-pending-properties';
import { Loader } from '../components/Loader';
import TransactionModal from '../components/TransactionModal';
import { NotFound } from '../components/NotFound';

export const SellerContainer = () => {
    const [isTxPending, setIsTxPending] = useState(false);
    // Update to track both index and action
    const [activeAction, setActiveAction] = useState({index: null, action: null});
    const { properties } = useListedProperties(isTxPending);

    const [transactionDetails, setTransactionDetails] = useState({});
    const { isOpen, onOpen, onClose } = useDisclosure();

    const listPendingSale = useFinalSalePendingProperties(isTxPending);
    const { properties: pendingSaleProperties } = listPendingSale;

    console.log('Pending sale', pendingSaleProperties)

    const {escrowContract} = store(state => ({
        escrowContract: state.escrowContract
     }));

     const toast = useToast();



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

    const approveProperty = async (property, index) => {
        try {
            setIsTxPending(true);
            // Include action type in active action state
            setActiveAction({index, action: 'approve'});
            const listingId = Number(property.id);
            await displayTransactionDetails(
                escrowContract.approveSale(listingId)
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
                escrowContract.declineSale(listingId)
            );
        } catch(err) {
            console.error(err);
        } finally {
            setIsTxPending(false);
            setActiveAction({index: null, action: null});
        }
    };

    return (
        <> 
          <TransactionModal isOpen={isOpen} onClose={onClose} transactionDetails={transactionDetails} />
          {
            !properties.length &&  pendingSaleProperties.length < 1 && (<NotFound message="No properties left to sell."  />)
          }
          
          {
            properties.length > 0 && (
             <section style={{'margin': '50px 0'}}>
                <Heading mb={8} as='h2' size='xl'>Properties you Own</Heading>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    {properties.map((property, index) => (
                        <PropertyCard userType="SELLER" key={property.id} property={property}>
                            <PropertyCard.Image />
                            <PropertyCard.Name />
                            <PropertyCard.Description />
                            <PropertyCard.Attributes />
                            <PropertyCard.Status />
                        </PropertyCard>
                    ))}
                </div>
              </section>
            )
        }
            
           
           {
            pendingSaleProperties.length > 0 && (
                <section>
                    <Heading mb={8} as='h2' size='xl'>Properties waiting for your Sale Approval</Heading>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        {pendingSaleProperties.map((property, index) => {
                            const isApproveLoading = isTxPending && activeAction.index === index && activeAction.action === 'approve';
                            const isRejectLoading = isTxPending && activeAction.index === index && activeAction.action === 'reject';
                            return (
                                <PropertyCard userType="SELLER" key={property.id} property={property} actions={
                                    <>
                                        {property.status === 2 && (
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
