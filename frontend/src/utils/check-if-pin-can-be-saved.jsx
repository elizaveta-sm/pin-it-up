import { sanityClient } from '../config/sanity-client';

export const checkIfPinCanBeSaved = async (pinId, currentUserId) => {

    const query = `*[_type == "pin" && _id == $pinId]{
        postedBy->{
            _id
        },
        savedBy[]->{
            _id
        }
    }[0]`;

    const params = { pinId };

    try {
        // Fetch the pin to check if the user's already saved it
        const pinDocument = await sanityClient.fetch(query, params);
        console.log('pin doc, saved by: ', pinDocument.savedBy)

        if (pinDocument.postedBy._id === currentUserId) {
            console.log('User is the author, cannot save the pin.');
            return false;
        }
    
        console.log({currentUserId})

        const hasSaved = pinDocument.savedBy?.some((user) => user._id === currentUserId);
        console.log('Has saved: ', hasSaved);

        return !hasSaved;

    } catch (error) {
        console.error("There was an error on Sanity's side: ", error)
        throw new Error("An error occurred when fetching the pin.")
    } 
};