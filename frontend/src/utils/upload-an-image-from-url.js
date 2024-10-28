import { sanityClient } from "../config/sanity-client";

export const uploadImageFromUrl = async (imageUrl) => {
    try {
        const response = await fetch(imageUrl);

        console.log('fetching image from url: ', response)

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Too many requests. Please wait.')
            }
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const blob = await response.blob();
        const fileName = imageUrl.split('/').pop().split('?')[0]; // Remove query parameters if present
        const file = new File([blob], fileName, { type: blob.type });
        console.log('the file: ', file)

        const imageAsset = await sanityClient.assets.upload('image', file, {
            filename: fileName
        });
        console.log('new image asset: ', imageAsset)

        return imageAsset;

    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};