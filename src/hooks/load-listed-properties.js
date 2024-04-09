import { store } from "../store";
import { useEffect, useState } from "react";

export const useListedProperties = (isTxnPending) => {
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

            let listingCount = await escrowContract.listingCount();
            listingCount = listingCount.toNumber();
            const propertiesTemp = [];

            for (let i = 1; i <= listingCount; i++) {
                const listing = await escrowContract.listings(i); // Fetch listing details

                if (listing.status !== 0) continue;
                
                // Check if the current user is the seller for this listing
                try {
                    const tokenURI = await realEstateContract.tokenURI(i); // Fetch metadata URI from ERC721 contract
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