import { sanityClient } from "../config/sanity-client";

export const checkUsernameInSanity = async (value) => {
    const query = `*[ _type == "user" && username == "${value.trim()}" ]`;

    try {
        const existingUser = await sanityClient.fetch(query);
        
        if (existingUser.length > 0) return {
            requestStatus: 'success', // success, error
            usernameExists: true,
        } 

        return {
            requestStatus: 'success',
            usernameExists: false,
        }
    } catch (error) {
        return {
            requestStatus: 'error', // success, error
            error
        };
    }
};