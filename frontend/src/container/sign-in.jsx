import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';

import stockVideoDesktop from '/stock-video-desktop.mp4';
import stockVideoMobile from '/stock-video-mobile.mp4';

import { Link, useNavigate } from 'react-router-dom';

import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from '../config/firebase';
import { useDispatch, useSelector } from 'react-redux';
import { createUserInSanity, fetchUserDoc, fetchUserEmail, resetEmail, selectCurrentUser, setCurrentUser } from '../store/user/user.slice';
import { useContext, useEffect, useState } from 'react';
import { convertDisplayNameToUsername } from '../utils/username-actions';
import { AlertMessageContext } from '../context/alert-provider';
import FullPageSpinner from '../components/full-page-spinner';

const SignIn = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const currentUser = useSelector(selectCurrentUser);
    const [isLoading, setIsLoading] = useState(false);
    const { showAlert } = useContext(AlertMessageContext);
    const [form] = Form.useForm();
    const [videoLoaded, setVideoLoaded] = useState(false);

    const signInHandler = async (values) => {
        console.log('values: ', values)

        try {
            setIsLoading(true);

            // Fetch the email to use it when signing in with Firebase
            const email = await dispatch(fetchUserEmail(values.username)).unwrap();
            console.log('email: ', email)

            const userCredential = await signInWithEmailAndPassword(auth, email, values.password);
            // console.log('userCredential.user: ', userCredential.user)

            if (userCredential.user) {
                const user = userCredential.user;
                const email = user.email;

                const userDoc = await dispatch(fetchUserDoc(email)).unwrap();
                console.log('userDoc from async thunk: ', userDoc)

                dispatch(resetEmail(null));
                dispatch(setCurrentUser(userDoc));
                navigate('/');

            } else {
                showAlert('error', 'Failed to sign in. Please try again.')
                return;
            }
            
            
        } catch (error) {
            console.error("There was an error when signing in: ", error)

            if (error === 'User not found.') {
                showAlert('error', "The username doesn't exist.")
            } else if (error?.code === 'auth/invalid-credential') {
                showAlert('error', 'Incorrect password.')
            } else if (error?.code === 'auth/too-many-requests') {
                showAlert('error', 'Too many requests. Please wait before signing in again.')
            } else {
                showAlert('error', 'Failed to sign in. Please try again.')
            }
            
        } finally {
            setIsLoading(false);
        }
        
        // dispatch(resetEmail(null));
    };
    
    const signInWithGoogle = async (values) => {

        try {
            setIsLoading(true);

            const userCredential = await signInWithPopup(auth, googleProvider);
            const user = userCredential.user;
            const email = userCredential.user.email;
            
            let userDoc;

            // Fetches a user doc from sanity
            userDoc = await dispatch(fetchUserDoc(email)).unwrap();
            console.log('user doc from sanity: ', userDoc)

            // No user doc -> signing up the user
            if (!userDoc) {
                console.log('there was no user doc, creating user in sanity ...')

                const username = await convertDisplayNameToUsername(user.displayName);
                
                await dispatch(createUserInSanity({ user, username })).unwrap();
                return;
            }

            dispatch(setCurrentUser(userDoc));
            
        } catch (error) {
            console.error('Error occurred when signing in with google: ', error.message)

            if (error?.code === 'auth/popup-closed-by-user') {
                showAlert('warning', 'Google sign-in was canceled.');
            } else if (error?.message === 'Too many requests. Please wait.') {
                showAlert('error', 'Too many requests. Please wait before trying again.')
            } else {
                showAlert('error', 'Failed to sign in. Please try again.');
            }

        } finally { 
            setIsLoading(false);
        }
    }

    useEffect(() => {
        console.log('is there current user?', Boolean(currentUser))
        if (currentUser) navigate('/')
    }, [currentUser])

    const handleValidationFailed = (errorInfo) => {
        if (errorInfo.errorFields.length > 0) {
            showAlert('warning', "You haven't filled in all required fields.");
        }
    };

    const handleVideoLoaded = () => {
        setVideoLoaded(true);
    };

    return (
        <>
            {/* Background Videos */}
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
    
            {/* Main Container */}
            <div className="h-full w-full fixed grid justify-center supports-[backdrop-filter]:bg-black/35">
                { isLoading && <FullPageSpinner text="Signing in..." /> }
    
                {/* Sign-In Form Container */}
                <div className="h-full content-center">
                    <p className="grid text-2xl md:text-3xl font-bold text-white mb-4 ml-2">Sign In</p>
    
                    <div className="md:backdrop-blur-sm bg-neutral-800/50 md:bg-neutral-800/40 rounded-xl px-3 pt-4 pb-0.5 shadow-lg min-w-56 w-64 md:w-72">
                        <Form
                            form={form}
                            name="normal_login"
                            onFinish={signInHandler}
                            onFinishFailed={handleValidationFailed}
                            scrollToFirstError
                            autoComplete="off"
                        >
                            <Form.Item
                                name="username"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please fill in your username.',
                                    },
                                ]}
                                help={
                                    <p className="text-white font-normal pl-1">
                                        {form.getFieldError('username')}
                                    </p>
                                }
                                className="mb-4"
                            >
                                <Input 
                                    prefix={<UserOutlined className="site-form-item-icon" />} 
                                    placeholder="Username" 
                                    className='md:text-base'
                                />
                            </Form.Item>
                            <Form.Item
                                name="password"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please fill in your password.',
                                    },
                                ]}
                                className="mb-4"
                                help={
                                    <p className="text-white font-normal pl-1">
                                        {form.getFieldError('password')}
                                    </p>
                                }
                            >
                                <Input
                                    prefix={<LockOutlined className="site-form-item-icon" />}
                                    type="password"
                                    placeholder="Password"
                                    className='md:text-base'
                                />
                            </Form.Item>
    
                            <Form.Item>
                                <button
                                    type="submit"
                                    className={`w-full text-sm md:text-base py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-300 disabled:bg-red-500/50 disabled:border-red-500 disabled:text-white ${
                                        isLoading ? 'cursor-wait' : ''
                                    }`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Signing In...' : 'Sign In'}
                                </button>
    
                                <div className="relative flex py-3 items-center">
                                    <div className="flex-grow border-t border-white"></div>
                                    <span className="flex-shrink mx-4 text-white">Or</span>
                                    <div className="flex-grow border-t border-white"></div>
                                </div>
    
                                <button
                                    aria-label="Sign in with Google"
                                    className="w-full flex items-center justify-center bg-white border border-[#dadce0] rounded-md px-2.5 md:py-0.5"
                                    onClick={signInWithGoogle}
                                    disabled={isLoading}
                                >
                                    <div className="flex items-center justify-right bg-white w-8 h-8 rounded-l">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                                            <title>Sign In with Google</title>
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
                                    <span className="text-sm md:text-base text-[#3c4043] tracking-wider">Sign In with Google</span>
                                </button>
    
                                <div className="pl-1 text-white pt-3">
                                    <p>Don&apos;t have an account?</p>
                                    <Link to='/sign-up' className='hover:text-yellow-300 hover:underline cursor-pointer'>Sign up now!</Link>
                                </div>
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </div>
        </>
    );
    
};
export default SignIn;