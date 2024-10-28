import { useState } from 'react'

const useImageOnLoad = () => {
  
    const [isLoaded, setIsLoaded] = useState(false);
    const handleImageOnLoad = () => setIsLoaded(true);

    console.log({isLoaded})
    
    const transitionStyles = {
        lowRes: {
            opacity: isLoaded ? 0 : 1,
            filter: 'blur(2px)',
            transition: 'opacity 500ms ease-out 50ms',
        },

        highRes: {
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 500ms ease-in 50ms',
        },
    };
    
    return { handleImageOnLoad, transitionStyles };
  
};

export default useImageOnLoad;