import { store } from "../store";
import { useEffect, useState } from "react";

export const useInspectionPendingProperties = (isTxnPending) => {
    const { escrowContract, realEstateContract, user } = store(state => ({
        escrowContract: state.escrowContract,
        realEstateContract: state.realEstateContract,
        user: state.user
    }));
    const [properties, setProperties] = useState([]);

    useEffect(() => {
        if (isTxnPending) return;
        const fetchProperties = async () => {
            if (!escrowContract || !realEstateContract) return;


            const listingIdsPendingInspectionHex = await escrowContract.getListingsPendingInspection(user.userAddress);
            const listingIdsPendingInspection = listingIdsPendingInspectionHex.map(value => parseInt(value._hex, 16));
            const propertiesTemp = [];

            for (let i = 0; i < listingIdsPendingInspectionHex.length; i++) {
                const listingId = listingIdsPendingInspection[i];
                const listing = await escrowContract.listings(listingId); // Fetch listing details
                
                // Check if the current user is the seller for this listing
                try {
                    const tokenURI = await realEstateContract.tokenURI(listingId); // Fetch metadata URI from ERC721 contract
                    const response = await fetch(tokenURI); // Fetch metadata from URI
                    const metadata = await response.json();

                    propertiesTemp.push({ id: i, ...listing, ...metadata });
                } catch (error) {
                    console.error("Error fetching property metadata", error);
                }
                
            }
            setProperties(propertiesTemp);
        };

        fetchProperties();
    }, [isTxnPending, escrowContract, realEstateContract, user]);

    return {properties}


} 