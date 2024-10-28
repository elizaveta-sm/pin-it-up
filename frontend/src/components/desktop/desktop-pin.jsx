import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom"
import UserAvatar from "../user-avatar";
import { truncateString } from "../../utils/truncate-string";
import { Button, Divider, Popover } from "antd";
import PinRecommendations from "../pin-recommendations";
import { useDispatch, useSelector } from "react-redux";
import { fetchPin, savePin, selectIsLoading, selectPin, setCurrentComments, setCurrentPin } from "../../store/pins/pin.slice";
import { selectCurrentUser } from "../../store/user/user.slice";
import { IoIosArrowBack } from "react-icons/io";
import { RiDownload2Line } from "react-icons/ri";
import { IoShareSocialOutline } from "react-icons/io5";
import { ConfirmationModalContext } from "../../context/confirmation-modal-provider";
import { AlertMessageContext } from "../../context/alert-provider";
import { urlFor } from "../../config/sanity-client";
import Comments from "../../container/comments";
import { IoMdClose } from "react-icons/io";
import ShareButtons from "../share-buttons";
import { checkIfPinCanBeSaved } from "../../utils/check-if-pin-can-be-saved";

const defaultLoadings = {
    isSaving: false,
    isDeleting: false,
};

const DesktopPin = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const { pinId } = useParams(); 
    const { showAlert } = useContext(AlertMessageContext);
    const state = location.state;

    const currentUser = useSelector(selectCurrentUser);
    const currentPin = useSelector(selectPin);
    const currentPinIsLoading = useSelector(selectIsLoading);

    // console.log('current pin in the pin: ', currentPin)
    // console.log('setting the pin data to :', state)
    
    const [pinData, setPinData] = useState(state || null);
    const [isShowingMore, setIsShowingMore] = useState(false);
    const [loadings, setLoadings] = useState(defaultLoadings);
    const [canSave, setCanSave] = useState(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [open, setOpen] = useState(false);
    const [currentPinId, setCurrentPinId] = useState(null);
    
    const { setConfirmationModalInfo } = useContext(ConfirmationModalContext);
    
    const currentUserId = currentUser._id;
    const pinImageUrl = pinData?.image?.asset?.url || (pinData?.image ? urlFor(pinData?.image.asset) : '');
    const userPhotoUrl = pinData?.postedBy.photo?.url || (pinData?.postedBy.photo ? urlFor(pinData?.postedBy.photo) : '');
    const fullAbout = pinData?.about;
    const truncatedAbout = (fullAbout?.length > 50) ? truncateString(fullAbout, 50) : undefined;
    
    const pinContainerRef = useRef(null); // Reference to the pin container
    const [pinContainerHeight, setPinContainerHeight] = useState(0);
    console.log({pinContainerHeight})

    const isCurrentUserAuthor = useMemo(() => {
        return pinData?.postedBy?._id === currentUserId;
    }, [pinData, currentUserId]);

    useEffect(() => {
        if (pinContainerRef.current) {
            // Set the pin container height when the component loads
            setPinContainerHeight(pinContainerRef.current.offsetHeight);
        }
    }, [isImageLoaded]);
    

    useEffect(() => {
        const fetchPinData = async () => {
            try {
                const fetchedPin = await dispatch(fetchPin({ pinId })).unwrap();
                const hasSaved = fetchedPin.savedBy?.some(user => user._id === currentUserId);
                setCanSave(!hasSaved);
                setPinData(fetchedPin); // Set the fetched pin data
            } catch (error) {
                showAlert('error', 'Failed to load the pin. Please refresh.');
            }
        };
    
        if (!pinData) {
            // console.log('THERES NO PIN DATA')
            if (currentPin) {
                // console.log('setting pin data to current pin')
                setPinData(currentPin); 
            } else {
                // console.log('FETCHING PIN DATA...')
                fetchPinData(); // Fetch the pin data
            }
        }

    }, [pinId, currentPin, pinData]);


    useEffect(() => {

        if (!location.pathname.includes('comments') && state?._id !== currentPinId) {
            console.log('CURRENT PIN ID != STATE ID')

            setCurrentComments(null);
            
            if (currentPin) setCurrentPin(null);
            
            setIsImageLoaded(false);
            setPinContainerHeight(0);
            setPinData(state || null);
            setCurrentPinId(state?._id || null);
        }

        if (currentPinId === null && state?._id) {
            setCurrentPinId(state._id);
            // console.log('current pin id = state.id')
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
    };

    const savePinHandler = async () => {
        if (isCurrentUserAuthor) return;

        if (!await checkPin() || canSave === false) {
            showAlert('warning', 'You have already saved the pin.');
            return;
        }

        try {
            setLoadings({
                ...loadings, 
                isSaving: true,
            });

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
        console.log('going back..')
        navigate(-1);
    }

    const handleImageLoad = () => {
        setIsImageLoaded(true);
    };

    const Placeholder = () => (
        <div className="max-w-screen-lg mx-auto px-6 py-4">
            <div className="shadow-lg rounded-lg overflow-hidden grid grid-cols-2">
                <div className="flex-shrink-0 relative">
                    <div className="absolute top-3 left-3 z-10">
                        <IoIosArrowBack className="bg-neutral-200 rounded-full p-2 opacity-60" size="2.5rem" />
                    </div>
                    <div className="absolute top-3 right-3 z-10">
                        <RiDownload2Line className="bg-neutral-200 rounded-full p-2 opacity-60" size="2.5rem" />
                    </div>
                    <div className="rounded-l-lg bg-gray-300 w-full overflow-hidden">
                        <div className="animate-pulse bg-gray-300 w-full h-full"></div>
                    </div>
                </div>
                <div className="px-6 pt-2 flex flex-col">
                    <div>
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-neutral-200 rounded-full"></div>
                                <div className="w-24 h-6 bg-neutral-200 rounded-lg"></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button className="bg-neutral-400 text-white" disabled>
                                    Save
                                </Button>
                            </div>
                        </div>
                        
                    </div>
                    <Divider className="" />
                    <p className="font-semibold text-lg my-4">Comments</p>
                    <div className="flex-grow overflow-hidden pb-6">
                        <div className="h-40 bg-neutral-200 animate-pulse rounded-lg"></div>
                    </div>
                </div>
            </div>
            <div className="pt-6">
                <p className="font-semibold text-lg mb-1">More to Explore</p>
                <Outlet />
            </div>
        </div>
    );

    const handleClickShare = (e) => {
        e.stopPropagation();
    };

    const popoverContent = (
        <div className='w-52 rounded-xl p-1'>
            <div className="w-full grid items-center mb-4">
                <p className="font-semibold text-lg absolute justify-self-center">
                    Share to
                </p>
                <IoMdClose 
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen(false);
                    }} 
                    className="rounded-full justify-self-end cursor-pointer" size="1.5rem"
                /> 
            </div>

            <ShareButtons modalPinId={pinId} />
        </div>
    );

    console.log('pin data: ', pinData)

    return (state?._id !== currentPinId || pinData) ? (
        <div className="max-w-screen-lg mx-auto px-6 py-4">

            <div className="shadow-lg rounded-lg overflow-hidden grid grid-cols-2">

                <div className="flex-shrink-0 relative">
                    <div className="absolute top-3 left-3 z-10">
                        <IoIosArrowBack onClick={goBackHandler} className="bg-white rounded-full p-2 opacity-70 hover:opacity-85 cursor-pointer" size="2.5rem" />
                    </div>
                    <div className="absolute top-3 right-3 z-10">
                        <RiDownload2Line onClick={downloadPinHandler} className="bg-white rounded-full p-2 opacity-70 hover:opacity-85 cursor-pointer" size="2.5rem" />
                    </div>
            
                    <div ref={pinContainerRef} className="rounded-l-lg bg-gray-100 w-full overflow-hidden">
                        {!isImageLoaded && <div className="absolute inset-0 animate-pulse bg-gray-300"></div>}

                        <img
                            src={pinImageUrl}
                            loading="lazy"
                            onLoad={handleImageLoad}
                            className={`w-full h-full object-contain transition-opacity duration-300 ease-in-out ${isImageLoaded ? "opacity-100" : "opacity-0"}`}
                            alt="pin image"
                        />
                    </div>
                </div>
            
                <div className="px-6 pt-2 flex flex-col">
                    <div>
                        {/* author, description, save button */}
                        <div className="flex items-center justify-between py-2">
                            <Link to={`/user/${pinData?.postedBy?.username}`} className="flex items-center gap-2">
                                <UserAvatar username={pinData?.postedBy?.username} photoURL={userPhotoUrl} size={40} />
                                <p className="text-lg">
                                    {pinData?.postedBy?.firstName && pinData?.postedBy.firstName} 
                                    {pinData?.postedBy?.lastName && ` ${pinData?.postedBy.lastName}`}
                                </p>
                            </Link>

                            <div className="flex items-center gap-2">
                                <Popover 
                                    content={popoverContent} 
                                    trigger="click" 
                                    onOpenChange={(newOpen) => setOpen(newOpen)}
                                    open={open}
                                    placement="bottomLeft"
                                >
                                    <IoShareSocialOutline className="text-black p-2 rounded-full hover:bg-neutral-200 cursor-pointer" size="2.5rem" onClick={handleClickShare} />
                                </Popover>

                                { isCurrentUserAuthor ? (
                                    <Button onClick={deletePinHandler}>Delete</Button>
                                ) : (
                                    <Button loading={loadings.isSaving || loadings.isChecking} onClick={savePinHandler} className="bg-red-600 text-white">
                                        { loadings.isSaving ? "Saving..." : 'Save' }
                                    </Button>
                                ) }
                            </div>
                        </div>

                        {pinData?.title && <p className="text-xl font-semibold py-2">{pinData?.title}</p>}
            
                        {fullAbout && (
                        <p className="text-gray-700 mb-2">
                            {isShowingMore ? fullAbout : truncatedAbout}
                            {fullAbout.length > 50 && (
                            <span
                                onClick={() => setIsShowingMore(!isShowingMore)}
                                className="text-blue-600 cursor-pointer ml-1"
                            >
                                {isShowingMore ? "Less" : "More"}
                            </span>
                            )}
                        </p>
                        )}
                    </div>

                    <Divider className="my-2" />

                    <p className="font-semibold text-lg my-2">Comments</p>

                    <div
                        className="overflow-y-auto h-full"
                        style={{
                            maxHeight: `${pinContainerHeight - 10}px`, // 10px taller than pin container
                        }}
                    >
                        <Comments key={pinId} />
                    </div>
                </div>
            </div>

            {/* More to Explore */}
            <div className="pt-6">
                <p className="font-semibold text-lg mb-1">More to Explore</p>
                { pinData && <PinRecommendations key={pinId} pin={pinData} /> }
            </div>
    
            <Outlet />
        </div>
    ) : <Placeholder />;
};

export default DesktopPin;