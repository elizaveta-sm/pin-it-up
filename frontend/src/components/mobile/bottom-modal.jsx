import { useContext, useEffect, useState } from 'react';
import { BottomModalContext } from '../../context/bottom-modal-provider';
import { selectCurrentUser } from '../../store/user/user.slice';
import { useDispatch, useSelector } from 'react-redux';
import { sanityClient } from '../../config/sanity-client';
import { checkIfPinCanBeSaved } from '../../utils/check-if-pin-can-be-saved';
import { IoMdClose } from "react-icons/io";
import { BsPinAngle } from "react-icons/bs";
import { RiDownload2Line } from "react-icons/ri";
import { RiDeleteBin2Line } from "react-icons/ri";
import { AlertMessageContext } from '../../context/alert-provider';
import { fetchPin, removePinFromSaved, savePin } from '../../store/pins/pin.slice';
import { Divider } from 'antd';
import { ConfirmationModalContext } from '../../context/confirmation-modal-provider';
import ShareButtons from '../share-buttons';

const DEFAULT_STATE = {
    isOpen: false,
    userId: '',
    pinId: '',
    purpose: '' // share | info
};

const defaultLoadings = {
    isDownloading: false,
    isSaving: false,
    isDeleting: false,
    isChecking: false,
    isRemoving: false,
};

const BottomModal = () => {
    const { showAlert } = useContext(AlertMessageContext);
    const dispatch = useDispatch();
    const currentUser = useSelector(selectCurrentUser);
    const { modalInfo, setModalInfo } = useContext(BottomModalContext);
    const { setConfirmationModalInfo } = useContext(ConfirmationModalContext);

    const pinId = modalInfo.pinId;
    const isCurrentUserAuthor = currentUser._id === modalInfo.authorId;

    const [loadings, setLoadings] = useState(defaultLoadings);
    const [canSave, setCanSave] = useState(null);

    const checkPin = async () => {
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

    useEffect(() => {
        if (canSave === null && modalInfo.purpose === 'info') checkPin();

        () => setModalInfo(DEFAULT_STATE);
    }, [])

    const savePinHandler = async () => {
        console.log('saving the pin...')

        if (isCurrentUserAuthor) return;

        if (!await checkPin() || canSave === false) {
            showAlert('warning', 'You have already saved the pin.');
            return;
        }

        const userId = currentUser._id;

        try {
            setLoadings({
                ...loadings, 
                isSaving: true,
            });

            await dispatch(savePin({ pinId, userId })).unwrap();

            showAlert('success', 'The pin has been successfully saved.')

            setModalInfo(DEFAULT_STATE);
            
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

    const removePinHandler = async () => {
        console.log('removing pin from saved...')

        if (isCurrentUserAuthor) return;

        if (canSave) {
            showAlert('warning', 'You have not saved the pin yet.');
            return;
        }

        const userId = currentUser._id;

        try {
            setLoadings({
                ...loadings, 
                isRemoving: true,
            });

            await dispatch(removePinFromSaved({ pinId, userId })).unwrap();

            showAlert('success', 'The pin has been successfully deleted from your saved pins.')

            setModalInfo(DEFAULT_STATE);
            
        } catch (error) {
            console.error('error deletings pin: ', error)

            showAlert('error', 'Failed to delete the pin from your saved pins. Please try again.')
        } finally {
            setLoadings({
                ...loadings, 
                isRemoving: false,
            });
        }
    }

    const downloadPinHandler = async () => {
        if (loadings.isDownloading) return;

        const query = `*[_type == "pin" && _id == $pinId]{
            image{
              asset->{
                url,
              }
            },
        }`;
        
        const params = { pinId };

        try {
            setLoadings({
                ...loadings,
                isDownloading: true,
            });

            const response = await sanityClient.fetch(query, params);
            const imageURL = response[0].image.asset.url;

            window.location.replace(`${imageURL}?dl=`);

            setModalInfo(DEFAULT_STATE);
        
        } catch (error) {
            console.error("There was an error on Sanity's side when fetching a pin image: ", error)
            showAlert('error', 'Failed to download the image. Please try again.')
        } finally {
            setLoadings({
                ...loadings,
                isDownloading: false,
            });
        }
    };

    const deletePinHandler = async () => {
        console.log('deleting the pin...');
        
        console.log({isCurrentUserAuthor})
        console.log({canSave})

        if (!isCurrentUserAuthor) return;

        if (canSave) return;

        try {
            setLoadings({
                ...loadings,
                isDeleting: true,
            })

            const pin = await dispatch(fetchPin({ pinId: modalInfo.pinId })).unwrap();

            setConfirmationModalInfo({
                pin,
                isOpen: true,
                modalText: 'this pin',
                authorId: modalInfo.authorId,
            });

        } catch (error) {
            console.error('there was an error: ', error)

            showAlert('error', "Failed to fetch the pin's information.")

        } finally {
            setLoadings(defaultLoadings);
            setModalInfo(DEFAULT_STATE);
        }
    };

    const closeModal = () => {
        setModalInfo(DEFAULT_STATE);
    };
    
    return (
        <div className="md:hidden">
            <div className={`fixed inset-0 z-10 ${!modalInfo.isOpen ? 'hidden' : 'block'}`}>
                {/* Overlay */}
                <div className="fixed inset-0 bg-black opacity-50" onClick={closeModal}></div>
                
                {/* Modal */}
                <div className="fixed inset-x-0 bottom-0 flex items-end justify-center">
                    <div className="bg-white w-full max-w-lg rounded-t-2xl shadow-lg p-6">

                        <div className="w-full grid items-center mb-4">
                            <p className="font-semibold text-lg absolute justify-self-center">{
                                modalInfo.purpose === 'info' ? 'Options' : 'Share to'
                            }</p>
                            <IoMdClose onClick={closeModal} className="rounded-full justify-self-end" size="1.5rem"/> 
                        </div>


                        { modalInfo.purpose === 'info' ? (

                            <div className='flex flex-col gap-2.5'>

                                { isCurrentUserAuthor ? (
                                    <p onClick={deletePinHandler} className='flex items-center'>
                                        <RiDeleteBin2Line className="rounded-full mr-2 opacity-70 text-red-800" size="1.25rem"/>
                                        { loadings.isDeleting 
                                            ? <span className='opacity-70 text-red-800'>Deleting...</span>
                                            : <span className='text-red-800'>Delete</span>
                                        } 
                                    </p>
                                ) : ( <>
                                        <p onClick={downloadPinHandler} className='flex items-center'>
                                            <RiDownload2Line className="rounded-full mr-2 opacity-70" size="1.25rem"/>
                                            { loadings.isDownloading 
                                                ? <span className='opacity-70'>Downloading...</span>
                                                : <span>Download</span>
                                            } 
                                        </p>
                                        
                                        <p 
                                            onClick={loadings.isChecking || loadings.isRemoving ? null : (canSave ? savePinHandler : removePinHandler)} 

                                            className={`flex items-center ${!canSave && !loadings.isChecking && !loadings.isRemoving ? 'text-red-800' : ''}`}
                                        >
                                            <BsPinAngle 
                                                className={`rounded-full mr-2 ${!canSave && !loadings.isChecking && !loadings.isRemoving ? 'text-red-800' : 'opacity-70'}`} 
                                                size="1.25rem" 
                                            />

                                            { loadings.isChecking ? (
                                                <span className='opacity-70'>Checking...</span>
                                            ) : loadings.isRemoving ? (
                                                <span className='opacity-70'>Removing...</span>
                                            ) : canSave ? (
                                                    loadings.isSaving ? (
                                                        <span className='opacity-70'>Saving...</span>
                                                    ) : (
                                                        <span>Save</span>
                                                    )
                                            ) : (
                                                <span>Delete from Saved Pins</span>
                                            ) }
                                        </p>
                                </> ) }

                                <Divider className="my-2" />

                                <p>Share To</p>
                                <ShareButtons modalPinId={modalInfo.pinId} />
                            </div>
                        ) : modalInfo.purpose === 'share' ? (
                            <ShareButtons />
                        ) : <></> }

                    </div>
                </div>
            </div>
        </div>
    );
};

export default BottomModal;