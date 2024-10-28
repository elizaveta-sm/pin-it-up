import { useContext, useState } from 'react';
import { Button, Radio } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/user/user.slice';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { IoIosArrowBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import { ConfirmationModalContext } from '../context/confirmation-modal-provider';
import ConfirmDeleteModal from '../components/confirm-delete-modal';
import FullPageSpinner from '../components/full-page-spinner';

const optionsWithDisabled = [
    {
      label: 'English (US)',
      value: 'english',
    },
    {
      label: 'Russian (русский)',
      value: 'russian',
      disabled: true,
    },
];

const AccountSettings = () => {
    const currentUser = useSelector(selectCurrentUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { confirmationModalInfo, setConfirmationModalInfo } = useContext(ConfirmationModalContext);
    const [isLoading, setIsLoading] = useState(false);

    console.log('confirmation modal info: ', confirmationModalInfo)

    const [value, setValue] = useState('english');

    const changeHandler = (event) => {
        const value = event.target.value;
        setValue(value);
    };

    const cancelHandler = () => {
        navigate(-1);
    };

    // todo: add some sort of loadings
    const signoutHandler = async () => {

        try {
            setIsLoading(true);

            await signOut(auth)
            dispatch({ type: 'RESET' });
            
        } catch (error) {
            console.error("There was an error when signing out: ", error)
        } finally {
            setIsLoading(false);
        }
    }

    const deleteAccountHandler = () => {

        if (!currentUser) return;
        
        setConfirmationModalInfo({
            pin: null,
            isOpen: true,
            modalText: 'your account',
            authorId: '',
        });
    };

    return (
        <>
            { isLoading && <FullPageSpinner text="Signing out..." /> }

            <div 
                className="min-w-40  mx-auto max-w-md lg:flex lg:flex-col lg:justify-center pt-4 px-2 pb-24 overflow-y-auto"
                style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
                aria-hidden={isLoading}
            >

                <div className="w-full grid items-center">
                    <IoIosArrowBack onClick={cancelHandler} className="rounded-full" size="1.75rem"/> 

                    <p className="font-semibold text-lg absolute justify-self-center">Account management</p>
                </div>

                <p className="text-gray-500 text-center py-0.5">Make changes to your account.</p>

                {/* <div className='py-2.5'>
                    <p className="font-semibold pb-1.5 md:text-lg">Language</p>

                    <Radio.Group
                        options={optionsWithDisabled}
                        onChange={changeHandler}
                        value={value}
                        optionType="button"
                        buttonStyle="solid"
                    />
                </div> */}

                <div className='py-2.5'>
                    <p className="font-semibold pb-1.5 md:text-lg">Signing out</p>
                    <Button onClick={signoutHandler}>Sign out</Button>
                </div>

                <div className="py-2.5">
                    <p className="font-semibold pb-1.5 md:text-lg text-red-600">Deletion</p>
                    <p className='text-sm md:text-base pb-1'>
                        Deleting your account means you won&apos;t be able to get your pinss back. <span className='font-semibold'>All your Pin It Up account data will be deleted.</span>
                    </p>

                    <p className='pb-1.5'>
                        Are you ready to leave forever?
                    </p>
                    <Button onClick={deleteAccountHandler}>Delete</Button>
                </div>

                <ConfirmDeleteModal />

            </div>
        </>
    )
};

export default AccountSettings;