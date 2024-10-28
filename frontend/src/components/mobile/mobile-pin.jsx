import { useContext, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom"
import UserAvatar from "../user-avatar";
import { truncateString } from "../../utils/truncate-string";
import { Button, Divider } from "antd";
import PinRecommendations from "../pin-recommendations";
import { useDispatch, useSelector } from "react-redux";
import { fetchPin, savePin, selectIsLoading, selectMessage, selectPin, setCurrentComments, setCurrentPin } from "../../store/pins/pin.slice";
import { selectCurrentUser } from "../../store/user/user.slice";
import Spinner from "../spinner";
import { IoIosArrowBack } from "react-icons/io";
import { RiDownload2Line } from "react-icons/ri";
import { FaRegComments } from "react-icons/fa6";
import { IoShareSocialOutline } from "react-icons/io5";
import ConfirmDeleteModal from "../confirm-delete-modal";
import { ConfirmationModalContext } from "../../context/confirmation-modal-provider";
import { AlertMessageContext } from "../../context/alert-provider";
import { urlFor } from "../../config/sanity-client";
import { BottomModalContext } from "../../context/bottom-modal-provider";
import Comments from "../../container/comments";
import { useMediaQuery } from "react-responsive";
import { checkIfPinCanBeSaved } from "../../utils/check-if-pin-can-be-saved";

const defaultLoadings = {
    isSaving: false,
    isDeleting: false,
    isChecking: false,
};


const MobilePin = () => {
    const isDesktop = useMediaQuery({ minWidth: 1024 });
    // console.log({isDesktop})

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { state } = useLocation();
    const { pinId } = useParams(); 
    const { showAlert } = useContext(AlertMessageContext);
    const location = useLocation();
    // const previousPinId = useRef(pinId);

    const currentUser = useSelector(selectCurrentUser);
    const currentPin = useSelector(selectPin);
    const currentPinIsLoading = useSelector(selectIsLoading);
    const pinMessage = useSelector(selectMessage);

    console.log('pin message: ', pinMessage)
    console.log('current pin? ', Boolean(currentPin))
    console.log('state in the pin: ', state)

    const [pinData, setPinData] = useState(state || null);
    const [isShowingMore, setIsShowingMore] = useState(false);
    const [loadings, setLoadings] = useState(defaultLoadings);
    const [canSave, setCanSave] = useState(null); 
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [currentPinId, setCurrentPinId] = useState(null);
    // console.log('pin data: ', pinData)

    // console.log('pin data: ', pinData)
    // console.log('pin data image: ', pinData?.image?.asset?.url)
    // console.log('pin data posted by image: ', pinData?.postedBy.photo?.url)
    
    const { setConfirmationModalInfo } = useContext(ConfirmationModalContext);
    const { setModalInfo } = useContext(BottomModalContext);
    
    const currentUserId = currentUser._id;
    const isCurrentUserAuthor = pinData?.postedBy?._id === currentUserId;
    const pinImageUrl = pinData?.image?.asset?.url || (pinData?.image ? urlFor(pinData?.image.asset) : '');
    const userPhotoUrl = pinData?.postedBy.photo?.url || (pinData?.postedBy.photo ? urlFor(pinData?.postedBy.photo) : '');
    const fullAbout = pinData?.about;
    const truncatedAbout = (fullAbout?.length > 50) ? truncateString(fullAbout, 50) : undefined;
    
    useEffect(() => {

        // Function to fetch pin if it's not in the state or if it's incomplete
        const fetchPinData = async () => {
            try {
                const fetchedPin = await dispatch(fetchPin({ pinId })).unwrap();
                console.log('fetched pin: ', fetchedPin)

                const hasSaved = fetchedPin.savedBy?.some((user) => user._id === currentUserId);

                setCanSave(!hasSaved);
                setPinData(fetchedPin);

            } catch (error) {
                console.error('Error fetching pin data:', error);
                showAlert('error', 'Failed to load the pin. Please refresh.')
            }
        };
        
        if (!pinData) {
            console.log('THERES NO PIN DATA')
            if (currentPin) {
                console.log('setting pin data to current pin')
                setPinData(currentPin); 
            } else {
                console.log('FETCHING PIN DATA...')
                fetchPinData(); // Fetch the pin data
            }
        }
        
    }, [pinId, currentPin, state]);
    
    useEffect(() => {
        console.log('location pathname has changed')
        console.log('location: ', location)
        console.log('location pathname: ', location.pathname)
        console.log('does it include "pin"? ', location.pathname.includes('pin'))

        if (!location.pathname.includes('pin')) {
            setCurrentComments(null);
            setCurrentPin(null);
            setCurrentPinId(null);
            setPinData(null);
        }

    }, [location.pathname])
    
    useEffect(() => {

        if (!location.pathname.includes('comments') && state?._id !== currentPinId) {
            console.log({currentPinId})
            console.log('CURRENT PIN ID != STATE ID')
            setCurrentComments(null);
            
            if (currentPin) setCurrentPin(null);
            
            setPinData(state || null);
            setCurrentPinId(state?._id || null);

            // setShouldReloadRecommendations(prev => !prev);
        }

        if (currentPinId === null && state?._id) {
            setCurrentPinId(state._id);
            console.log('current pin id = state.id')
        }

    }, [state?._id]);


    const checkPin = async () => {
        console.log('checking pin...')

        try {
            setLoadings({
                ...loadings,
                isChecking: true,
            });

            const response = await checkIfPinCanBeSaved(pinId, currentUser._id)
            console.log('can save? ', response)

            setCanSave(response);
            return response;

        } catch (error) {
            console.error('an error from checking function: ', error);

            showAlert('error', "Failed. It's undetermined whether you have already saved the pin.")
            return false; 

        } finally {
            setLoadings({
                ...loadings,
                isChecking: false,
            });
        }
    }

    const savePinHandler = async () => {
        if (isCurrentUserAuthor) return;

        setLoadings({
            ...loadings, 
            isSaving: true,
        });

        if (!await checkPin() || canSave === false) {
            showAlert('warning', 'You have already saved the pin.');
            return;
        }

        try {

            await dispatch(savePin({ pinId, userId: currentUserId })).unwrap();

            setCanSave(false);
            showAlert('success', 'The pin has been successfully saved.');
            
        } catch (error) {
            console.error('error saving pin: ', error)
            showAlert('error', 'Failed to save the pin. Please try again.')

        } finally {
            setLoadings({
                ...loadings, 
                isSaving: false,
            });
        }
    };

    const openModalHandler = () => {
        setModalInfo({
            isOpen: true,
            authorId: '',
            pinId: '',
            purpose: 'share',
        });
    };

    const deletePinHandler = () => {
        if (!isCurrentUserAuthor) return;
        
        setConfirmationModalInfo({
            pin: pinData,
            isOpen: true,
            modalText: 'this pin',
            authorId: pinData.postedBy._id,
        });
    };

    const downloadPinHandler = () => {
        window.location.replace(`${pinImageUrl}?dl=`);
    };

    const goBackHandler = () => {
        navigate('/', { replace: true });
    }

    const openCommentsHandler = () => {
        console.log('navigate to comments of this pin: ', pinData)

        navigate('comments')
    };

    const handleImageLoad = () => {
        setIsImageLoaded(true);
    };

    return (
        <>
            <div className="relative grid">

                <div className="relative overflow-hidden col-start-1 col-end-2 row-start-1 row-end-2">
                    { !isImageLoaded && (
                        <div className="absolute inset-0 animate-pulse bg-gray-300 "></div>
                    ) }

                    <img
                        src={pinImageUrl}
                        loading="lazy"
                        onLoad={handleImageLoad}
                        className={` object-cover object-center transition-opacity duration-250 ease-in-out ${
                        isImageLoaded ? "opacity-100" : "opacity-0"
                        }`}
                    />
                </div>

                <div className="w-full text-black flex flex-col items-start col-start-1 col-end-2 row-start-1 row-end-2">
                    <div className="w-full flex justify-between p-3">
                        <IoIosArrowBack onClick={goBackHandler} className="bg-white rounded-full p-1 opacity-70" size="2.25rem"/>
                        <RiDownload2Line onClick={downloadPinHandler} className="bg-white rounded-full p-1.5 opacity-70" size="2.25rem"/>
                    </div>
                </div>
            </div>

            {/* author, comments, etc */}
            <div className="flex flex-col px-5">

                <Link 
                    to={
                        pinData?.postedBy?._id === currentUser._id
                            ? `/profile/${currentUser.username}`
                            : `/user/${pinData?.postedBy?.username}`
                    }
                    className="flex gap-2 items-center py-3"
                >
                    <UserAvatar username={pinData?.postedBy?.username} photoURL={userPhotoUrl} size={36} />

                    <p className="text-base">
                        {pinData?.postedBy?.firstName && pinData?.postedBy.firstName} 
                        {pinData?.postedBy?.lastName && ` ${pinData?.postedBy.lastName}`}
                    </p>
                </Link>


                { (pinData?.title || fullAbout) && (
                    <div className="pb-5">
                        <p className="font-semibold text-base">{pinData?.title || ''}</p>

                        { (fullAbout && truncatedAbout) ? (
                            <p className="text-sm pt-0.5">
                                { isShowingMore ? 
                                    fullAbout 
                                    : truncatedAbout }
                                &nbsp;
                                <span className="text-blue-600 underline" onClick={() => setIsShowingMore(!isShowingMore)}>
                                    { isShowingMore && fullAbout ? 'Less'
                                        : 'More' }
                                </span>
                            </p>
                        ) : (!truncatedAbout) ? (
                            <p className="text-sm pt-0.5">{fullAbout}</p>
                        ) : '' }
                    </div>
                ) }


                <div className="flex justify-between items-center">
                    {/* <Link to="comments">Comments</Link> */}
                    <FaRegComments className="bg-white text-black rounded-full p-1" size="2.25rem" onClick={openCommentsHandler} />

                    {isCurrentUserAuthor ? (
                        <Button onClick={deletePinHandler}>Delete</Button>
                    ) : (
                        <Button loading={loadings.isSaving || loadings.isChecking} onClick={savePinHandler} className="bg-red-600 text-white">
                            { loadings.isSaving ? "Saving..." : 'Save' }
                        </Button>
                    )}

                    <IoShareSocialOutline className="bg-white text-black rounded-full p-1" size="2.25rem" onClick={openModalHandler} />

                    <ConfirmDeleteModal />
                </div>
            </div>

            <Divider className="my-5" />

            {/* more to explore */}
            <div className="pb-24 overflow-y-auto">
                <p className="font-semibold text-base pl-2">More to Explore</p>
                {/* { pinData && <PinRecommendations pin={pinData} key={shouldReloadRecommendations} /> } */}
                { pinData && <PinRecommendations pin={pinData} /> }
            </div>

            <Outlet />
        </>
    )
};

export default MobilePin;