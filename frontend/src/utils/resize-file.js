import Resizer from "react-image-file-resizer";

const getFileFromUrl = async (imageUrl) => {
    try {
        const response = await fetch(imageUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const blob = await response.blob();
        const fileName = imageUrl.split('/').pop().split('?')[0]; // Remove query parameters if present
        const file = new File([blob], fileName, { type: blob.type });

        return file;

    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

const resizeFile = (file) =>
  new Promise((resolve) => {
    Resizer.imageFileResizer(
        file,
        300,
        300,
        "JPEG",
        100,
        0,
        (uri) => {
            resolve(uri);
        },
        "base64"
    );
});

export const downsizeImage = async (url) => {
    try {
        const file = await getFileFromUrl(url);
        const downsizedImageUrl = await resizeFile(file);

        return downsizedImageUrl;
    } catch (error) {
        console.error('Error processing image:', error);
        throw error;
    }
}