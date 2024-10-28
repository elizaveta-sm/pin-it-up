import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser } from "../store/user/user.slice";
import { useNavigate } from "react-router-dom";
import { Button, Form, Input } from "antd";
import { useContext, useEffect, useState } from "react";
import { checkUsernameInSanity } from "../utils/check-username-in-sanity";
import { FileUploader } from "react-drag-drop-files";
import UserAvatar from '../components/user-avatar';
import { sanityClient } from "../config/sanity-client";
import { IoIosArrowBack } from "react-icons/io";
import { AlertMessageContext } from "../context/alert-provider";
import FullPageSpinner from "../components/full-page-spinner";

const DEFAULT_LOADINGS = {
    usernameSearchLoading: false,
    updatingProfileLoading: false, 
};

const SubmitButton = ({ form, children }) => {
    const [isSubmittable, setIsSubmittable] = useState(false);
    const values = Form.useWatch([], form);

    useEffect(() => {
        form.validateFields({ validateOnly: true })
            .then(() => setIsSubmittable(true))
            .catch(() => setIsSubmittable(false));
    }, [form, values]);

    return (
        <Button type="primary" htmlType="submit" disabled={!isSubmittable}>
            {children}
        </Button>
    );
};

const ProfileSettings = () => {
    const { showAlert } = useContext(AlertMessageContext);
    const navigate = useNavigate();

    const [form] = Form.useForm();
    const currentUser = useSelector(selectCurrentUser);
    const { username, firstName, lastName, photo } = currentUser;

    console.log('existing user photo: ', photo)

    const [loadings, setLoadings] = useState(DEFAULT_LOADINGS);
    const [isUsernameValidated, setIsUsernameValidated] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // create an imagePreview as a side effect, whenever selected file is changed
    useEffect(() => {
        if (!image) {
            setImagePreview(null)
            return
        }

        const objectUrl = URL.createObjectURL(image);
        setImagePreview(objectUrl);

        // free memory when ever this component is unmounted: returns a clean-up function
        return () => URL.revokeObjectURL(objectUrl);
    }, [image]);

    const changeHandler = (img) => {
        setImage(img);
    };

    const cancelHandler = () => {
        form.resetFields();
        setImage(null);
        setLoadings(DEFAULT_LOADINGS);
        navigate(-1);
    };
    
    const checkUsername = async (value) => {
        if (value.length < 3) {
            setIsUsernameValidated(false);
            setErrorMessage('At least 3 letters.')
            return Promise.reject();
        } 

        setLoadings({
            ...loadings,
            usernameSearchLoading: true,
        });

        const response = await checkUsernameInSanity(value);
        
        if (response.requestStatus === 'success') {
            // username exists = true -> usernameValidated = false
            const isValid = !response.usernameExists;
            setIsUsernameValidated(isValid);

            // if username doesnt exist:
            if (!isValid) {
                setLoadings(DEFAULT_LOADINGS);
                setErrorMessage('The username is already taken.')
                return Promise.reject();
            } 
            
            setLoadings(DEFAULT_LOADINGS);
            return Promise.resolve();

        } else if (response.requestStatus === 'error') {
            console.error('an error occurred when checking the username: ', response);

            setIsUsernameValidated(false);
            setLoadings(DEFAULT_LOADINGS);
            showAlert('error', 'Failed to check new username. Please try again.')
            return Promise.reject();
        } 
    };

    const editHandler = async () => {
        const { firstName, lastName, username } = form.getFieldsValue();
        const userId = currentUser._id;
        const updates = {};
        
        console.table(firstName, lastName, username, image)

        if (firstName && firstName !== currentUser.firstName) updates.firstName = firstName;
        if (lastName && lastName !== currentUser.lastName) updates.lastName = lastName;
        if (username && username !== currentUser.username) updates.username = username;

        // If there is a change:
        if (Object.keys(updates).length > 0 || image) {

            setLoadings({
                ...loadings,
                updatingProfileLoading: true,
            });
            
            try {
                if (image) {
                    const imageAsset = await sanityClient.assets.upload('image', image, {
                        filename: image.name,
                    });
                    console.log('image asset from sanity: ', imageAsset)
                    
                    updates.photo = {
                        _type: 'image',
                        asset: {
                            _type: 'reference',
                            _ref: imageAsset._id,
                        },
                    };
                } 

                console.log('updates: ', updates)

                if (Object.keys(updates).length > 0) {
                    await sanityClient
                        .patch(userId)
                        .set(updates)
                        .commit();

                    showAlert('success', 'Your profile has been successfully updated.');
                    navigate('/');
    
                } else {
                    showAlert('warning', "You haven't changed anything.");
                }
    
            } catch (error) {
                console.error('Error occurred when creating an image or updating the user in Sanity:', error)
                
                showAlert('error', "Failed to update. Please try again.");

            } finally {
                setLoadings(DEFAULT_LOADINGS);
            }
            
        } else {
            showAlert('warning', "You haven't changed anything.");
        } 
    };


    return (
        <>
            { loadings.updatingProfileLoading && <FullPageSpinner text="Updating your profile..." /> }
    
            <div 
                className="min-w-40  mx-auto max-w-md lg:flex lg:flex-col lg:justify-center pt-4 px-2 pb-24 overflow-y-auto"
                style={{ pointerEvents: loadings.updatingProfileLoading ? 'none' : 'auto' }}
                aria-hidden={loadings.updatingProfileLoading}
            >
                <div className="w-full grid items-center">
                    <IoIosArrowBack onClick={cancelHandler} className="rounded-full" size="1.75rem"/>    
                    <p className="font-semibold text-lg absolute justify-self-center">Edit Profile</p>
                </div>

                <Form
                    form={form}
                    name="edit"
                    onFinish={editHandler}
                    scrollToFirstError
                    autoComplete="off"
                    layout="vertical"
                >

                    <div className="flex flex-col items-center py-3">

                        <FileUploader 
                            handleChange={changeHandler} 
                            name="file" 
                            label="Upload or drop an image right here."

                            onTypeError={(err) => console.log(err)}

                            onDrop={(file) => console.log('file dropped:', file)}
                            onSelect={(file) => console.log('file selected: ', file)}

                            // onDraggingStateChange={(dragging) => console.log('dragging state changed: ', dragging)}

                            dropMessageStyle={{backgroundColor: 'red'}}
                        >
                            <div className="flex flex-col items-center gap-5">
                                <UserAvatar username={username} photoURL={imagePreview || photo?.asset?.url} size={96} fontSize="3.25rem" />
                                <Button>Change</Button>
                            </div>
                        </FileUploader>

                    </div>

                    <Form.Item
                        name="firstName"
                        label={
                            <p className="text-xs -mb-2">First name</p>
                        }
                        rules={[
                            {
                                max: 50,
                                message: 'No more than 50 characters.',
                            },
                        ]}
                    >
                        <Input placeholder={currentUser.firstName} />
                    </Form.Item>

                    <Form.Item
                        name="lastName"
                        label={
                            <p className="text-xs -mb-2">Last name</p>
                        }
                        rules={[
                            {
                                max: 50,
                                message: 'No more than 50 characters.',
                            },
                        ]}
                    >
                        <Input placeholder={currentUser.lastName} />
                    </Form.Item>

                    <Form.Item
                        name="username"
                        label={
                            <p className="text-xs -mb-2">Username</p>
                        }
                        tooltip="Supposed to be unique."

                        validateStatus={
                            isUsernameValidated ? 'success' 
                            : !isUsernameValidated ? 'error'
                            : loadings.usernameSearchLoading ? 'validating'
                            : ''
                        } // success, error, validating
                        help={
                            loadings.usernameSearchLoading ? 'Checking the username...'
                            : !isUsernameValidated ? errorMessage
                            : ''
                        }
                        hasFeedback
                        rules={[
                            {
                                message: 'Please input your username!',
                                whitespace: false,
                            },
                            { 
                                validator(_, value) {
                                    if (!value) {
                                        setIsUsernameValidated(true);
                                        return Promise.resolve();
                                    }
                                    return checkUsername(value)
                                }
                            }
                        ]}
                    >
                        <Input placeholder={currentUser.username} />
                    </Form.Item>

                    <SubmitButton form={form}>Done</SubmitButton>
                </Form>
            </div>
        </>
    )
}

export default ProfileSettings