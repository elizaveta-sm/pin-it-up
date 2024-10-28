import { Link, useNavigate } from 'react-router-dom';
import stockVideoDesktop from '/stock-video-desktop.mp4';
import stockVideoMobile from '/stock-video-mobile.mp4';
import FullPageSpinner from '../components/full-page-spinner';
import {
    Button,
    Form,
    Input,
} from 'antd';

import { UserOutlined } from '@ant-design/icons';


import { auth, googleProvider } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useContext, useEffect, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { createUserInSanity, selectCurrentUser, setCurrentUser } from '../store/user/user.slice';
import { checkUsernameInSanity } from '../utils/check-username-in-sanity';
import { convertDisplayNameToUsername, isValidUsername } from '../utils/username-actions';

import { MdOutlineEmail } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import { AlertMessageContext } from '../context/alert-provider';


const DEFAULT_LOADINGS = {
    usernameSearchLoading: false,
    userRegisterLoading: false, 
};

googleProvider.setCustomParameters({
    prompt: 'select_account',
});

// between 6 to 20 characters, contains at least one numeric digit, one uppercase and one lowercase letter
const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

const SignUp = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const { showAlert } = useContext(AlertMessageContext);
    
    const currentUser = useSelector(selectCurrentUser);
    
    const [loadings, setLoadings] = useState(DEFAULT_LOADINGS);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [isUsernameValidated, setIsUsernameValidated] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [error, setError] = useState('');

    const signUpWithGoogle = async () => {
        setLoadings({
            ...loadings,
            userRegisterLoading: true,
        })

        try {
            const userCredential = await signInWithPopup(auth, googleProvider);
            
            const username = await convertDisplayNameToUsername(userCredential.user.displayName);

            const user = userCredential.user;
            await dispatch(createUserInSanity({ user, username })).unwrap();

        } catch (error) {
            console.error('Error signing up with Google: ', error);

            if (error?.code === 'auth/popup-closed-by-user') {
                showAlert('warning', 'Google sign-in was canceled.');
            } else {
                showAlert('error', 'Failed to sign in. Please try again.');
            }

        } finally {
            setLoadings(DEFAULT_LOADINGS);
        }
    };

    const checkUsername = async (value) => {
        if (value.length < 3) {
            setIsUsernameValidated(false);
            setErrorMessage('At least 3 letters.')
            return Promise.reject()
        } 
        
        setLoadings({
            ...loadings,
            usernameSearchLoading: true,
        });

        if (!isValidUsername(value)) {
            console.log('username is not valid')
            setIsUsernameValidated(false);
            setErrorMessage('Words may be separated by "-". No spaces, numbers, or other symbols are allowed.')

            setLoadings({
                ...loadings,
                usernameSearchLoading: false,
            });

            return;
        }

        const response = await checkUsernameInSanity(value);
        
        if (response.requestStatus === 'success') {
            // username exists = true -> usernameValidated = false
            setIsUsernameValidated(!response.usernameExists);

            if (response.usernameExists) {
                setLoadings(DEFAULT_LOADINGS)
                setErrorMessage('The username is already taken.')
                return Promise.reject();
            } 
            
            setLoadings(DEFAULT_LOADINGS);
            return Promise.resolve();
        } else if (response.requestStatus === 'error') {
            console.error(response.error);

            setIsUsernameValidated(false);
            setLoadings(DEFAULT_LOADINGS);

            showAlert('error', 'Failed to check the username.')

            return Promise.reject();
        } 
    };

    const handleSignUp = async (values) => {
        
        if (values.password !== values.confirm) {
            showAlert('error', 'Passwords do not match.')     
            return;
        } 
        
        try {
            setLoadings({
                ...loadings,
                userRegisterLoading: true,
            });

            if (!isUsernameValidated) {
                showAlert('error', 'Username is already taken.');
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);

            const user = userCredential.user;
            const username = values.username;

            const userDoc = await dispatch(createUserInSanity({ user, username })).unwrap();
            console.log('userDoc from async thunk: ', userDoc);

        } catch (error) {
            console.error("There was an error with creating a user: ", error)

            if (error?.code === "auth/email-already-in-use") {
                showAlert('error', 'Email is already in use.');
            } else {
                showAlert('error', 'Failed to sign up. Please try again.');
            }

        } finally {
            setLoadings(DEFAULT_LOADINGS);
            form.resetFields();
        }
    };

    useEffect(() => {
        if (currentUser) navigate('/');
    }, [currentUser]);

    const handleValidationFailed = (errorInfo) => {
        console.log('error info: ', errorInfo)

        if (errorInfo.errorFields.length > 0) {
            const errors = errorInfo.errorFields;

            for (const error of errors) {
                showAlert('warning', error.errors[0]);
            }
        }
    };

    const handleVideoLoaded = () => {
        setVideoLoaded(true);
    };

    return (
        <>
            <video
                src={stockVideoMobile}
                type="video/mp4"
                loop
                controls={false}
                muted
                autoPlay
                className={`w-full h-full object-cover fixed -z-10 top-0 hidden md:block transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-50 blur-md'}`}
                onLoadedData={handleVideoLoaded}
            />
            <video
                src={stockVideoDesktop}
                type="video/mp4"
                loop
                controls={false}
                muted
                autoPlay
                className={`w-full h-full object-cover fixed -z-10 top-0 md:hidden transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-50 blur-md'}`}
                onLoadedData={handleVideoLoaded}
            />
        
            <div className="h-full w-full fixed grid justify-center items-center supports-[backdrop-filter]:bg-black/35">
                { loadings.userRegisterLoading && <FullPageSpinner text="Signing up..." /> }

                <div className='h-full content-center'>
                    <p className="grid text-2xl md:text-3xl font-bold text-white mb-6 ml-2">Sign Up</p>

                    <div className="md:backdrop-blur-sm bg-neutral-800/50 md:bg-neutral-800/40 rounded-xl px-3 pt-4 pb-0.5 shadow-lg min-w-56 w-64 md:w-72">
                        <Form
                            form={form}
                            name="register"
                            onFinish={handleSignUp}
                            onFinishFailed={handleValidationFailed}
                            scrollToFirstError
                            autoComplete='off'
                        >
                            <Form.Item
                                name="email"
                                rules={[
                                    {
                                        type: 'email',
                                        message: 'Not valid e-mail.',
                                    },
                                    {
                                        required: true,
                                        message: 'Please fill in your email.',
                                    },
                                ]}
                                className="mb-4"
                                help={
                                    <p className="text-white font-normal pl-1">
                                        {form.getFieldError('email')}
                                    </p>
                                }
                            >
                                <Input 
                                    prefix={<MdOutlineEmail className="site-form-item-icon" />} 
                                    placeholder="E-mail"
                                    className='md:text-base'
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                allowClear
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please fill in your password.',
                                    },
                                    {
                                        validator(_, value) {
                                            if (!value || value.match(PASSWORD_REGEX)) {
                                                return Promise.resolve();
                                            } 
                                            return Promise.reject(new Error('Should contain between 6 to 20 characters, at least one numberic digit, one uppercase and one lowercase letter.'));
                                        },
                                    }
                                ]}
                                className="mb-4"
                                hasFeedback
                                help={
                                    <p className="text-white font-normal pl-1">
                                        {form.getFieldError('password')}
                                    </p>
                                } 
                            >
                                <Input.Password 
                                    prefix={<RiLockPasswordLine className="site-form-item-icon" />} 
                                    placeholder="Password" 
                                    className='md:text-base'
                                />
                            </Form.Item>

                            <Form.Item
                                name="confirm"
                                dependencies={['password']}
                                hasFeedback
                                className="mb-4"
                                help={
                                    <p className="text-white font-normal pl-1">
                                        {form.getFieldError('confirm')}
                                    </p>
                                } 
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please confirm your password.',
                                    },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('The new password that you entered do not match.'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password 
                                    prefix={<RiLockPasswordLine className="site-form-item-icon" />} 
                                    placeholder="Confirm Password" 
                                    className='md:text-base'
                                />
                            </Form.Item>

                            <Form.Item
                                name="username"
                                tooltip="Supposed to be unique."
                                
                                validateStatus={
                                    isUsernameValidated ? 'success' 
                                    : !isUsernameValidated ? 'error'
                                    : loadings.usernameSearchLoading ? 'validating'
                                    : ''
                                } 
                                help={
                                    loadings.usernameSearchLoading ? (
                                        <p className="text-white font-normal pl-1">Checking the username...</p>
                                    ) : !isUsernameValidated ? (
                                        <p className="text-white font-normal pl-1">
                                            {errorMessage}
                                        </p>
                                    ) : ''
                                }
                                hasFeedback
                                className="mb-4"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please fill in your username.',
                                        whitespace: false,
                                    },
                                    { 
                                        validator(_, value) {
                                            return checkUsername(value)
                                        }
                                    }
                                ]}
                            >
                                <Input 
                                    prefix={<UserOutlined className="site-form-item-icon" />} 
                                    placeholder="Username" 
                                    className='md:text-base'
                                />
                            </Form.Item>

                            <Form.Item>
                                <button
                                    type="submit"
                                    className={`w-full text-sm md:text-base py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-300 disabled:bg-red-500/50 disabled:border-red-500 disabled:text-white ${
                                        loadings.userRegisterLoading ? 'cursor-wait' : ''
                                    }`}
                                    disabled={loadings.userRegisterLoading || loadings.usernameSearchLoading || error || !isUsernameValidated}
                                >
                                    {loadings.userRegisterLoading ? 'Signing Up...' : 'Sign Up'}
                                </button>

                                <div className="relative flex py-3 items-center">
                                    <div className="flex-grow border-t border-white"></div>
                                    <span className="flex-shrink mx-4 text-white">Or</span>
                                    <div className="flex-grow border-t border-white"></div>
                                </div>

                                <button
                                    aria-label="Sign in with Google"
                                    className="w-full flex items-center justify-center bg-white border border-[#dadce0] rounded-md px-2.5 md:py-0.5"
                                    onClick={signUpWithGoogle}
                                    disabled={loadings.userRegisterLoading}
                                >
                                    <div className="flex items-center justify-right bg-white w-8 h-8 rounded-l">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                                        <title>Sign Up with Google</title>
                                        <desc>Google G Logo</desc>
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            className="fill-[#4285f4]"
                                        ></path>
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            className="fill-[#34a853]"
                                        ></path>
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            className="fill-[#fbbc05]"
                                        ></path>
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            className="fill-[#ea4335]"
                                        ></path>
                                        </svg>
                                    </div>
                                    <span className="text-sm text-[#3c4043] tracking-wider md:text-base">Sign Up with Google</span>
                                </button>

                                <div className='pl-1 text-white pt-3'>
                                    <p>Already have an account?</p>
                                    <Link to='/sign-in' className='hover:text-yellow-300 hover:underline cursor-pointer'>Sign in now!</Link>
                                </div>
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </div>
        </>

    );
      
}

export default SignUp