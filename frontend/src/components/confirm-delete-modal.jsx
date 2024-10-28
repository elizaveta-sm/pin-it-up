import { Input, Modal } from 'antd';
import { useContext, useState } from 'react';
import { ConfirmationModalContext } from '../context/confirmation-modal-provider';
import { useDispatch, useSelector } from 'react-redux';
import { deletePin } from '../store/pins/pin.slice';
import { AlertMessageContext } from '../context/alert-provider';
import { deleteUserAccount, fetchUserById, selectCurrentUser } from '../store/user/user.slice';
import { sanityClient } from '../config/sanity-client';
import { fetchPins } from '../store/pins/pins.slice';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../config/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } from 'firebase/auth';

const DEFAULT_STATE = {
    isOpen: false,
    pin: null,
    modalText: '', // 'this pin' or 'your account'
    authorId: '',
};

const ConfirmDeleteModal = () => {
    const { confirmationModalInfo, setConfirmationModalInfo } = useContext(ConfirmationModalContext);
    const { showAlert } = useContext(AlertMessageContext);
    const currentUser = useSelector(selectCurrentUser);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [confirmLoading, setConfirmLoading] = useState(false);

    const deletePinHandler = async () => {
        if (confirmationModalInfo.authorId !== currentUser._id) {
            showAlert('warning', 'You are not the author of the pin.');
            return;
        }
        
        const pin = confirmationModalInfo.pin;
        
        if (!pin) {
            showAlert('warning', 'There is no pin present.');
            return;
        }
    
        try {
            setConfirmLoading(true);
    
            // await dispatch(deletePin(pinId))
            console.log('pin in the confirmation modal: ', pin)
    
            const res = await dispatch(deletePin(pin)).unwrap();
            console.log('res: ', res)
            
            await dispatch(fetchPins()).unwrap();
            
            navigate('/');

            // is there a better way to do it? without reloading the web app
            // window.location.reload();
            showAlert('success', 'The pin has been successfully deleted.')
            
        } catch (error) {
            console.error("There was an error on Sanity's side when deleting a pin: ", error)
            showAlert('error', 'Failed to delete the pin. Please try again.')
            // window.location.reload();
        } finally {
            setConfirmLoading(false);
            setConfirmationModalInfo(DEFAULT_STATE);
        }
    };

    const deleteAccountHandler = async () => {

        if (!currentUser) {
            console.log('theres no current user')
            showAlert('error', "There's no current user present.")
            return;
        }

        try {
            setConfirmLoading(true);
    
            console.log('current user: ', currentUser)
            const user = await dispatch(fetchUserById(currentUser._id)).unwrap();
            const userInFirebase = auth.currentUser;

            if (userInFirebase) {
                // Reauthentication logic:
                const providerData = userInFirebase.providerData[0];
                const providerId = providerData.providerId;
                console.log('provider data: ', providerData)

                if (providerId === 'google.com') {
                    // If signed in via Google, reauthenticate with Google popup
                    await reauthenticateWithPopup(userInFirebase, googleProvider);

                } else if (providerId === 'password') {
                    // If signed in via email/password, prompt for credentials

                    const email = userInFirebase.email;
                    const password = prompt("Please enter your password to continue deleting your account: ")

                    const credential = EmailAuthProvider.credential(email, password);
                    await reauthenticateWithCredential(userInFirebase, credential);
                }
            }
            console.log('1. User reauthenticated.')

            // Step 2: Delete Pins Created by the User
            const createdPins = await sanityClient.fetch(
                `*[_type == "pin" && postedBy._ref =="${user._id}"]{
                    _id,
                    title,
                    about,
                    image{
                        asset->{
                            _id,
                            url
                        }
                    },
                    categories[]->{
                        _id,
                        name,
                        imageRefs[] {
                            assetId
                        }
                    },
                    postedBy->{
                        _id,
                        username,
                        firstName,
                        lastName,
                        photo{
                            asset->{
                                _id,
                                url
                            }
                        }
                    },
                    comments[]->{
                        _id,
                        comment,
                        _createdAt,
                        postedBy->{
                            _id,
                            username,
                            firstName,
                            lastName,
                            photo{
                                asset->{
                                    _id,
                                    url
                                }
                            }
                        }
                    },
                    savedBy[]->{
                        _id
                    }
                }`
            );
            console.log("2. User's created pins: ", createdPins)

            if (createdPins?.length) {
                for (const pin of createdPins) {

                    console.log('1. pin ref from createdPins: ', pin)

                    if (pin._id) {
                        await dispatch(deletePin(pin)).unwrap();
                    } 
                }
                console.log('2. COMPLETE All created pins deleted.');
            }


            // Step 3:
            await dispatch(deleteUserAccount(user)).unwrap();

            showAlert('success', 'You have successfully deleted your account.')
            
        } catch (error) {
            console.error("There was an error deleting user: ", error)

            if (error?.code === 'auth/requires-recent-login') {
                showAlert('error', 'Reathenticate and try again.')
            } else if (error?.code === 'auth/missing-password') {
                showAlert('error', 'Please sign in your account, then try again.')
            }

            showAlert('error', 'Failed to delete your account. Please try again.')
            // window.location.reload();
        } finally {
            setConfirmLoading(false);
            setConfirmationModalInfo(DEFAULT_STATE);
        }
    }

    const handleOk = () => {
        console.log('handle ok')
        console.log('pin? ', Boolean(confirmationModalInfo.modalText === 'this pin'))
        console.log('account? ', Boolean(confirmationModalInfo.modalText === 'your account'))

        if (confirmationModalInfo.modalText === 'this pin') {
            deletePinHandler();
        } else if (confirmationModalInfo.modalText === 'your account') {
            deleteAccountHandler();
        }
    };

    const handleCancel = () => {
        setConfirmationModalInfo(DEFAULT_STATE);
    };

    return (
        <>
            <Modal
                title={
                    confirmLoading 
                    ? "Please, wait..."
                    : "Are you sure?"
                }
                open={confirmationModalInfo.isOpen}
                onOk={handleOk}
                confirmLoading={confirmLoading}
                onCancel={confirmLoading ? null : handleCancel}
                okText="Delete"
                centered
                width="20rem"
            >
                { confirmLoading ? (
                    <p>This can take up to a minute.</p>
                ) : (
                    <p>Are you sure you want to delete {confirmationModalInfo.modalText}? This action <span className='font-semibold'>cannot be undone</span>.</p>
                ) }
            </Modal>
        </>
    );
}

export default ConfirmDeleteModal