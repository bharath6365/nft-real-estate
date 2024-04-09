import React, {useContext, createContext} from 'react';
import { ListingStatus } from '../../common';
import {Card, CardBody, Image, Text, Heading, List, ListItem, ListIcon, Highlight} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';

const PropertyImage = () => {
    const { property } = useContext(PropertyCardContext);
    return <Image src={property.image} alt={property.name} />;
};

const PropertyName = () => {
    const { property } = useContext(PropertyCardContext);
    return  <Heading my={5} size='sm'>{property.name}</Heading>

};

const PropertyDescription = () => {
    const { property } = useContext(PropertyCardContext);
    return <Text mb={3}>{property.description}</Text>;
};

const PropertyAttributes = () => {
    const { property } = useContext(PropertyCardContext);
    return (
        <List mb={5} spacing={3}>
            {property.attributes.map(attr => (
                <ListItem key={attr.trait_type}>
                   <ListIcon as={InfoIcon} color='green.500' /> 
                   {attr.trait_type}: {attr.value}
                </ListItem>
            ))}
        </List>
    );
};

const PropertyStatus = () => {
    const { property } = useContext(PropertyCardContext);
    const status = ListingStatus[property.status];
    const statusString = `Status: ${status}`
    return (
        <Highlight m={4} query={status} styles={{ px: '2', py: '1', rounded: 'full', bg: 'red.100' }}>
            {statusString}
        </Highlight>
    )
};





const PropertyCardContext = createContext();

const PropertyCard = ({ property, userType, children, actions }) => {
    return (
        <PropertyCardContext.Provider value={{ property, userType }}>
            <Card maxW='xs'>
              <CardBody>
                    {children}
                    <div className="actions-container" style={{ marginTop: '20px' }}>
                        {actions}
                    </div>
              </CardBody>
            </Card>
        </PropertyCardContext.Provider>
    );
};

PropertyCard.Image = PropertyImage;
PropertyCard.Name = PropertyName;
PropertyCard.Description = PropertyDescription;
PropertyCard.Attributes = PropertyAttributes;
PropertyCard.Status = PropertyStatus;

export default PropertyCard;