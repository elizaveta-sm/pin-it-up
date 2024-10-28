import { useEffect, useState } from "react";
import { Link, redirect, useLocation, useNavigate, useParams } from 'react-router-dom';
import UserAvatar from "./user-avatar";
import { BsThreeDots } from "react-icons/bs";
import { useContext } from "react";
import { BottomModalContext } from "../context/bottom-modal-provider";
import { urlFor } from "../config/sanity-client";
import LazyLoad from 'react-lazyload';
import useImageOnLoad from "../hooks/useImageOnLoad";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../store/user/user.slice";
import { Button, Popover, Tooltip } from "antd";
import { IoShareSocialOutline } from "react-icons/io5";
import { RiDownload2Line } from "react-icons/ri";
import DesktopPinPreview from "./desktop/desktop-pin-preview";


const PinPreview = ({ pin }) => {

    const { modalInfo, setModalInfo } = useContext(BottomModalContext);
    const location = useLocation();
    const [isLoaded, setIsLoaded] = useState(false);
    const navigate = useNavigate();
    const currentUser = useSelector(selectCurrentUser);
    const { pinId } = useParams();
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [isSaving, setIsSaving] = useState(false);
    const [postHovered, setPostHovered] = useState(false);
    // if (!pin) return;

    const pinImageUrl = pin.image?.asset?.url || (pin.image ? urlFor(pin.image) : '');
    const userPhotoUrl = pin.postedBy.photo?.asset?.url || (pin.postedBy.photo?.asset ? urlFor(pin.postedBy.photo?.asset) : '');

    // console.log('for this pin: ', pin)
    // console.log('this posted by image: ', pin.postedBy?.photo?.asset)


    const openModal = () => {
      setModalInfo({
        isOpen: true,
        authorId: pin.postedBy._id,
        pinId: pin._id,
        purpose: 'info',
      });
    };

    const handleClick = () => {
      console.log('You clicked on the preview of this pin: ', pin)
      console.log('state passed')
      
      navigate(`/pin/${pin._id}`, { 
          state: pin,
      });
    }

    const handleImageLoad = () => {
      setIsLoaded(true);
    };

    

    return (
      <div className="px-1.5 py-2">

          <div 
            className="relative overflow-hidden rounded-xl"
            onMouseEnter={() => setPostHovered(true)}
            onMouseLeave={() => setPostHovered(false)}
            onClick={handleClick}
          >
              { !isLoaded && (
                <div className="absolute inset-0 animate-pulse bg-gray-300 rounded-xl"></div>
              ) }

              <img
                src={pinImageUrl}
                loading="lazy"
                onLoad={handleImageLoad}
                className={`rounded-xl object-cover object-center transition-opacity duration-250 ease-in-out ${
                  isLoaded ? "opacity-100" : "opacity-0"
                }`}
              />

              { (postHovered || isSaving) && (
                <DesktopPinPreview pin={pin} pinImageUrl={pinImageUrl} setIsSaving={setIsSaving} />
              ) }
          </div>

        {/* </div> */}

        <div className="flex justify-between items-center pt-1.5">
          <Link 
            to={
              pin.postedBy._id === currentUser._id ? 
              `/profile/${currentUser.username}` :
              `/user/${pin.postedBy.username}`
            } 
          >
            <div className="flex items-center">
              <UserAvatar username={pin.postedBy.username} photoURL={userPhotoUrl} />
              <p className="pl-2 text-sm">{pin.postedBy.username}</p>
            </div>
          </Link>

          <BsThreeDots size='1.25em' className="md:hidden" onClick={openModal} />
        </div>
    </div>
  )
}

export default PinPreview;