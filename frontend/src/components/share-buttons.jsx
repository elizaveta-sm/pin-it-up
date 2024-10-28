import {
    WhatsappShareButton,
    WhatsappIcon,
    TelegramShareButton,
    TelegramIcon,
    VKShareButton,
    VKIcon,
    TwitterShareButton,
    TwitterIcon,
    RedditShareButton,
    RedditIcon,
} from "react-share";
import { FaRegCopy } from "react-icons/fa";

import { appUrl } from '../main';
import { useLocation, useParams } from "react-router-dom";
import { AlertMessageContext } from "../context/alert-provider";
import { useContext, useEffect, useRef } from "react";

const ShareButtons = ({ modalPinId }) => {
    const { showAlert } = useContext(AlertMessageContext);
    console.log({modalPinId})
    const scrollContainerRef = useRef(null);

    const location = useLocation();
    const { pinId } = useParams();
    console.log({pinId})
    console.log('location: ', location)

    const pinUrl = pinId ? (appUrl + location.pathname) : (appUrl + '/pin/' + modalPinId);

    const handleCopyLink = () => {
        console.log('navigator: ', navigator)
        console.log('clipboard: ', navigator.clipboard)

        navigator.clipboard.writeText(pinUrl)
            .then(() => {
                showAlert('success', 'Link copied to clipboard.')
            })
            .catch(err => {
                showAlert('error', 'Failed to copy to clipboard.')
            });
    };

    // Add event listener for mouse wheel scrolling
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
    
        const handleWheelScroll = (event) => {
            if (event.deltaY !== 0) {
                // Use smooth scroll behavior
                scrollContainer.scrollTo({
                    left: scrollContainer.scrollLeft + event.deltaY,
                    behavior: 'smooth',
                });
                event.preventDefault();
            }
        };
    
        scrollContainer.addEventListener('wheel', handleWheelScroll);
    
        // Clean up the event listener when the component unmounts
        return () => {
            scrollContainer.removeEventListener('wheel', handleWheelScroll);
        };
    }, []);

    console.log({pinUrl})

    return (
        <div ref={scrollContainerRef} className="flex gap-4 overflow-x-scroll">
            <WhatsappShareButton
                url={pinUrl}
                quote="Look at this pin..."
                className="grid justify-items-center"
            >
                <WhatsappIcon size={50} round={true} />
                <p className="text-xs pt-1">WhatsApp</p>
            </WhatsappShareButton>

            <TelegramShareButton
                url={pinUrl}
                quote="Look at this pin..."
                className="grid justify-items-center"
            >
                <TelegramIcon size={50} round={true} />
                <p className="text-xs pt-1">Telegram</p>
            </TelegramShareButton>

            <VKShareButton
                url={pinUrl}
                quote="Look at this pin..."
                className="grid justify-items-center"
            >
                <VKIcon size={50} round={true} />
                <p className="text-xs pt-1">VK</p>
            </VKShareButton>
            
            <TwitterShareButton
                url={pinUrl}
                quote="Look at this pin..."
                className="grid justify-items-center"
            >
                <TwitterIcon size={50} round={true} />
                <p className="text-xs pt-1">Twitter</p>
            </TwitterShareButton>

            <RedditShareButton
                url={pinUrl}
                quote="Look at this pin..."
                className="grid justify-items-center"
            >
                <RedditIcon size={50} round={true} />
                <p className="text-xs pt-1">Reddit</p>
            </RedditShareButton>

            <button onClick={handleCopyLink} className="grid justify-items-center text-center">
                <div className="bg-gray-200 p-3 rounded-full">
                    <FaRegCopy size={24} />
                </div>
                <p className="text-xs pt-1">Copy Link</p>
            </button>

        </div>
    )
}

export default ShareButtons;