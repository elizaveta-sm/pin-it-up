import { Button, Divider, Popover, Spin } from 'antd';
import React, { useContext, useEffect, useState } from 'react'
import { RiDownload2Line } from "react-icons/ri";
import { RiDeleteBin2Line } from "react-icons/ri";
import { BsThreeDots } from "react-icons/bs";
import { AlertMessageContext } from '../../context/alert-provider';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/user/user.slice';
import { ConfirmationModalContext } from '../../context/confirmation-modal-provider';
import { checkIfPinCanBeSaved } from '../../utils/check-if-pin-can-be-saved';
import { fetchPin, removePinFromSaved, savePin } from '../../store/pins/pin.slice';
import ShareButtons from '../share-buttons';
import { IoMdClose } from "react-icons/io";
import { BsPinAngle } from "react-icons/bs";

const defaultLoadings = {
    isDownloading: false,
    // isSaving: false,
    isDeleting: false,
    isChecking: false,
    isRemoving: false,
};

const DesktopPinPreview = ({ pin, pinImageUrl, setIsSaving }) => {
    const [loadings, setLoadings] = useState(defaultLoadings);
    const [open, setOpen] = useState(false);

    const { showAlert } = useContext(AlertMessageContext);
    const dispatch = useDispatch();
    const currentUser = useSelector(selectCurrentUser);
    const { setConfirmationModalInfo } = useContext(ConfirmationModalContext);

    const pinId = pin._id;
    const isCurrentUserAuthor = currentUser._id === pin.postedBy._id;

    const [canSave, setCanSave] = useState(null);

    const checkPin = async () => {
        console.log('checking pin...')

        try {
            setLoadings({
                ...loadings,
                isChecking: true,
            });

            console.log('pinId: ', pinId)
            console.log('current user id: ', currentUser._id)
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

    const openMenu = async (e) => {
        e.stopPropagation();
        console.log('must check the pin')
        if (canSave === null || canSave === true) {
            console.log('can save is null or true, checking...')
            await checkPin();
        }
    }

    const savePinHandler = async (e) => {
        console.log('saving the pin...')
        e.stopPropagation()

        if (isCurrentUserAuthor) return;
        const userId = currentUser._id;

        if (!await checkPin() || canSave === false) {
            showAlert('warning', 'You have already saved the pin.');
            return;
        }
        
        try {
            setLoadings({
                ...loadings, 
                isSaving: true,
            });
            setIsSaving(true);

            await dispatch(savePin({ pinId, userId })).unwrap();

            showAlert('success', 'The pin has been successfully saved.')
            setCanSave(false);
            
        } catch (error) {
            console.error('error saving pin: ', error)

            showAlert('error', 'Failed to save the pin. Please try again.')
        } finally {
            setLoadings({
                ...loadings, 
                isSaving: false,
            });
            setIsSaving(false);
        }
    };

    const removePinHandler = async (e) => {
        console.log('removing pin from saved...')
        e.stopPropagation()

        if (isCurrentUserAuthor) return;

        if (canSave === true) {
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
            
        } catch (error) {
            console.error('error deletings pin: ', error)

            showAlert('error', 'Failed to delete the pin from your saved pins. Please try again.')
        } finally {
            setLoadings({
                ...loadings, 
                isRemoving: false,
            });
        }
    };

    const deletePinHandler = async (e) => {
        console.log('deleting the pin...');
        e.stopPropagation()
        
        console.log({isCurrentUserAuthor})
        console.log({canSave})

        if (!isCurrentUserAuthor) return;

        if (canSave === true) return;

        try {
            setLoadings({
                ...loadings,
                isDeleting: true,
            })

            const pin = await dispatch(fetchPin({ pinId })).unwrap();

            setConfirmationModalInfo({
                pin,
                isOpen: true,
                modalText: 'this pin',
                authorId: pin.postedBy._id,
            });

        } catch (error) {
            console.error('there was an error: ', error)

            showAlert('error', "Failed to fetch the pin's information.")

        } finally {
            setLoadings(defaultLoadings);
        }
    };

    const popoverContent = (
        <div className='w-52 rounded-xl p-1' onClick={(e) => e.stopPropagation()}>
            <div className="w-full grid items-center mb-4">
                <p className="font-semibold text-lg absolute justify-self-center">
                    Options
                </p>
                <IoMdClose 
                    onClick={(e) => {
                        // e.stopPropagation();
                        setOpen(false);
                    }} 
                    className="rounded-full justify-self-end cursor-pointer" size="1.5rem"
                /> 
            </div>

            <div className='flex flex-col gap-2'> 

                {loadings.isDeleting ? (
                    <span className="text-neutral-500">Deleting...</span>
                ) : loadings.isChecking ? (
                    <span className="text-neutral-500">Checking...</span>
                ) : loadings.isRemoving ? (
                    <span className="text-neutral-500">Removing...</span>
                ) : isCurrentUserAuthor ? (
                    <div
                        onClick={deletePinHandler}
                        className="flex items-center text-red-600 hover:text-red-800 cursor-pointer"
                    >
                        <RiDeleteBin2Line className="rounded-full mr-2 opacity-70" size="1.25rem" />
                        <span>Delete</span>
                    </div>
                ) : canSave === false && !loadings.isChecking ? (
                    <p
                        onClick={removePinHandler}
                        className="flex items-center text-red-600 hover:text-red-800 cursor-pointer"
                    >
                        <BsPinAngle className="rounded-full mr-2 text-red-600" size="1.25rem" />
                        <span>Delete from Saved Pins</span>
                    </p>
                ) : null}

                {(isCurrentUserAuthor || canSave === false || loadings.isChecking) && (
                    <Divider className="my-2" />
                )}

                <p className='font-semibold'>Share To</p>
                <ShareButtons modalPinId={pinId} />
            </div>
        </div>
    );

    return (
        <div 
            className="absolute inset-0 bg-black bg-opacity-50 rounded-xl transition-opacity duration-300 ease-in-out"
        >
                  
            <div className="absolute top-2 left-2">
                <RiDownload2Line onClick={() => window.location.replace(`${pinImageUrl}?dl=`)} className="bg-white rounded-full p-1.5 hover:bg-neutral-200 hover:cursor-pointer" size="2rem" />
            </div>

            <div className="absolute top-2 right-2">
                <Button 
                    loading={loadings.isSaving || loadings.isChecking} 
                    onClick={savePinHandler} 
                    className="bg-red-600 text-white border-red-700 focus:outline-none"
                >
                    { loadings.isSaving ? "Saving..." : 'Save' }
                </Button>
            </div>

            <div className="absolute bottom-2 right-2">
                <Popover 
                    content={popoverContent} 
                    trigger="click" 
                    onOpenChange={(newOpen) => setOpen(newOpen)}
                    open={open}
                    placement="topRight"
                >
                    <BsThreeDots className="bg-white rounded-full p-1.5 hover:bg-neutral-200 hover:cursor-pointer" size="2rem" onClick={openMenu}/>
                </Popover>
            </div>
        </div>
    )
};

export default DesktopPinPreview;