import {create} from 'zustand';

export const store = create((set) => ({
  user: {
    isLoggedIn: false,
    // Seller, Buyer, Inspector. 
    userType: null,

    userAddress: null,
  },
  setUser: (user) => {
    set({user});
  },

  listedProperties: [],
  setListedProperties: (listingIds) => set({listedProperties: listingIds}),

  listings: {},
  addToListing: (listingId, listing) => set({listings: {...store.listings, [listingId]: listing}}),

  listingsPendingApproval: [],
  setListingsPendingApproval: (listingIds) => set({listingsPendingApproval: listingIds}),

  listingsPendingInspection: [],
  setListingsPendingInspection: (listingIds) => set({listingsPendingInspection: listingIds}),

  escrowContract: null,
  setEscrowContract: (escrowContract) => set({escrowContract}),

  realEstateContract: null,
  setRealEstateContract: (realEstateContract) => set({realEstateContract}),

  

}));