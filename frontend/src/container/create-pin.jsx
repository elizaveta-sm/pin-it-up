import { useContext, useEffect, useState } from 'react';
import { Button, Form, Input, Space } from 'antd';
// const { Dragger } = Upload;
import { FileUploader } from "react-drag-drop-files";
import { sanityClient } from '../config/sanity-client';
import { selectCurrentUser, updateCreatedPins } from '../store/user/user.slice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { convertCommaSepStringToArr } from '../utils/convert-comma-sep-string-to-arr';
import { updateCategory } from '../store/categories/category.slice';
import DragOrDropUpload from '../components/drag-or-drop-upload';
import { nanoid } from '@reduxjs/toolkit';
import FullPageSpinner from '../components/full-page-spinner';
import { IoIosArrowBack } from "react-icons/io";
import { AlertMessageContext } from '../context/alert-provider';

const CreatePin = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const currentUser = useSelector(selectCurrentUser);
    const { showAlert } = useContext(AlertMessageContext);

    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmittable, setIsSubmittable] = useState(false);
    
    const [form] = Form.useForm();

    useEffect(() => {
        // Validate form only if image is present
        if (image) {
            form.validateFields({ validateOnly: true })
                .then(() => {
                    setIsSubmittable(true);
                })
                .catch(() => setIsSubmittable(false)); 
        } else {
            setIsSubmittable(false);
        }
    }, [image, form]);

    // create a preview as a side effect, whenever selected file is changed
    useEffect(() => {
        if (!image) {
            setImagePreview(null)
            return
        }

        const objectUrl = URL.createObjectURL(image)
        setImagePreview(objectUrl)

        // free memory when ever this component is unmounted
        return () => URL.revokeObjectURL(objectUrl)
    }, [image])
    
    const changeHandler = (file) => {
        setImage(file);
    };

    const cancelHandler = () => {
        form.resetFields();
        navigate(-1);
    };

    const createPinHandler = async () => {
        const { title, about, categories } = form.getFieldsValue();
        const userId = currentUser._id;
        
        if (!image) {
            showAlert('warning', "You haven't added an image.")
            return;
        }
        
        try {
            setLoading(true);

            // 1. Upload the image and get the asset ID
            const imageAsset = await sanityClient.assets.upload('image', image, {
                filename: image.name,
            });
            
            // 2. Create a new pin document
            const newPin = {
                _id: nanoid(),
                _type: 'pin',
                title: title || "",
                about: about || "",
                image: {
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: imageAsset._id,
                    },
                },
                postedBy: {
                    _type: 'reference',
                    _ref: userId,
                },
                comments: [],
                savedBy: [],
            };

            // 3. Add categories to the new doc if present
            if (categories) {
                const categoriesArr = convertCommaSepStringToArr(categories);

                const categoryIds = await dispatch(updateCategory({ categoriesArr, imageAsset })).unwrap();
                
                newPin.categories = categoryIds.map(categoryId => ({
                    _type: 'reference',
                    _ref: categoryId,
                    _key: nanoid()
                }));
            }
        
            console.log('new pin: ', newPin)

            // 4. Create the doc in Sanity
            await sanityClient.createIfNotExists(newPin);
            
            // 5. Update user's created pins
            await dispatch(updateCreatedPins({ userId, newPinId: newPin._id })).unwrap();
            console.log("user's created pins updated.");

            showAlert('success', "Pin was successfully created.")

            form.resetFields();
            setImage(null);
            navigate('/');

        } catch (error) {
            console.error('Error occurred when creating an image or a category in Sanity:', error)
            showAlert('error', "Failed to create the pin. Please try again.")
        } finally {
            setLoading(false);
        }
    };



    return (
        <>
            { loading && <FullPageSpinner text="Creating the pin..." /> }

            <div 
                className="min-w-40  mx-auto max-w-md lg:flex lg:flex-col lg:justify-center pt-4 px-2 pb-24 overflow-y-auto"
                style={{ pointerEvents: loading ? 'none' : 'auto' }}
                aria-hidden={loading}
            >
                 <div className="w-full grid items-center">
                    <IoIosArrowBack onClick={cancelHandler} className="rounded-full" size="1.75rem"/>    
                    <p className="font-semibold text-lg absolute justify-self-center">Create Pin</p>
                </div>

                <Form
                    form={form}
                    name="create-pin"
                    layout="vertical"
                    autoComplete="off"
                    onFinish={createPinHandler}
                    className="w-full"
                >

                    <FileUploader 
                        handleChange={changeHandler} 
                        name="file" 
                        label="Upload or drop an image right here."

                        // disabled={(image || uploading) && true}

                        onTypeError={(err) => console.log(err)}

                        onDrop={(file) => console.log('file dropped:', file)}
                        onSelect={(file) => console.log('file selected: ', file)}

                        onDraggingStateChange={(dragging) => console.log('dragging state changed: ', dragging)}

                        dropMessageStyle={{backgroundColor: 'red'}}
                    >
                        <DragOrDropUpload preview={imagePreview} />
                    </FileUploader>

                    <Form.Item
                        hasFeedback
                        label="Title"
                        name="title"
                        validateFirst
                        rules={[
                            {
                                max: 50,
                                message: 'No more than 50 characters.',
                            },
                        ]}
                    >
                        <Input placeholder="Add your title" />
                    </Form.Item>

                    <Form.Item 
                        label="About" 
                        name="about"
                        validateFirst 
                        rules={[
                            {
                                max: 500,
                                message: 'No more than 500 characters.',
                            },
                        ]}
                    >
                        <Input.TextArea allowClear showCount autoSize placeholder="What is your pin about?" />
                    </Form.Item>

                    <Form.Item 
                        label="Categories" 
                        name="categories"
                        validateFirst
                        hasFeedback 
                        tooltip="Categories must be separated by commas."
                        rules={[
                            {
                                validator(_, value) {
                                    if (!value) return Promise.resolve(); // No value, considered valid
                                
                                    return Promise.resolve();
                                },
                            }
                        ]}
                    >
                        <Input placeholder="Design, business, freelance" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" disabled={!isSubmittable}>Post</Button>
                            <Button onClick={cancelHandler}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form> 
            </div>
        </>
    )
};

export default CreatePin;