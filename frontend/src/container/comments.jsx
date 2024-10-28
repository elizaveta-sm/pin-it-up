import { useNavigate, useParams } from "react-router-dom";
import Comment from "../components/comment";
import { Button, Divider, Input } from "antd";
import UserAvatar from "../components/user-avatar";
import TextArea from "antd/es/input/TextArea";
import { IoMdClose } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser } from "../store/user/user.slice";
import { useContext, useEffect, useRef, useState } from "react";
import { sanityClient } from "../config/sanity-client";
import { AlertMessageContext } from "../context/alert-provider";
import { v4 as uuidv4 } from 'uuid';
import { addComment, fetchPinComments, selectCurrentComments, selectIsLoading } from "../store/pins/pin.slice";
import Spinner from "../components/spinner";
import { IoMdSend } from "react-icons/io";
import { ImSpinner2 } from 'react-icons/im';
import { useMediaQuery } from "react-responsive";

const Comments = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { pinId } = useParams(); 
    const { showAlert } = useContext(AlertMessageContext);
    
    const isDesktop = useMediaQuery({ minWidth: 1024 });
    const commentsEndRef = useRef(null);

    const currentUser = useSelector(selectCurrentUser);
    const currentComments = useSelector(selectCurrentComments);
    const commentsAreLoading = useSelector(selectIsLoading);
    
    console.log('current comments: ', currentComments)
    
    const [hasFetchedComments, setHasFetchedComments] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentComments]);

    useEffect(() => {
        const fetchComments = async () => {
            console.log('id for fetching comments is used from useParams(): ', pinId);
            await dispatch(fetchPinComments(pinId)).unwrap();
            setHasFetchedComments(true); // Set this flag to true once comments are fetched
        };
    
        if (!hasFetchedComments && !commentsAreLoading && pinId) {
            console.log('Fetching comments...');
            fetchComments();
        }
    
    }, [dispatch, pinId, hasFetchedComments, commentsAreLoading]);
    

    const cancelHandler = () => {
        setCommentText('');
        navigate(-1, { replace: true }); // <-- redirect to the previous page w/o state
    };
    
    const postHandler = async () => {
        if (!pinId) {
            showAlert('error', "There's no pin id.");
            return;
        }
        
        if (!commentText.trim()) {
            showAlert('warning', "You haven't written anything.");
            return;
        }
        
        try {
            setIsCreating(true);
            // Step 1: Create a new comment document in Sanity
            const newComment = {
                _id: uuidv4(),
                _type: 'comment',
                comment: commentText,
                postedBy: {
                    _type: 'reference',
                    _ref: currentUser._id,  
                },
            };
            
            const commentResponse = await sanityClient.createIfNotExists(newComment);

            // Step 2: Patch the pin document to add the reference of the new comment
            await sanityClient
                .patch(pinId)
                .setIfMissing({ comments: [] }) 
                .append('comments', [
                    {
                        _type: 'reference',
                        _ref: commentResponse._id,
                    },
                ])
                .commit({
                    autoGenerateArrayKeys: true,
                });
    
            console.log('comment created.')

            dispatch(addComment({
                ...commentResponse,
                postedBy: currentUser,
            }))

            setCommentText('');      

        } catch (error) {
            console.error('Failed to add comment to Sanity', error);
            showAlert('error', 'Failed to post the comment. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const renderCommentsContent = () => {
        if (commentsAreLoading && !hasFetchedComments) {
            return isDesktop ? (
                <div className="flex-grow overflow-hidden pb-6">
                    <div className=" bg-neutral-200 animate-pulse rounded-lg"></div>
                </div>
            ) : (
                <div className="py-7">
                    <Spinner />
                </div>
            );
        }

        if (currentComments?.length) {
            console.log('there are current comments')

            return (
                <>
                    { currentComments.map(comment=> (
                        <Comment comment={comment} key={comment._id} />
                    )) }
                </>
            )
        }

        return <p className="text-gray-600 py-10">No comments yet! Add one to start the conversation.</p>;
    };

    return (
        <>
            {/* mobile comments */}
            <div className="md:hidden">
                <div className="fixed inset-0 z-20 block">
                    {/* Overlay */}
                    <div className="fixed inset-0 bg-black opacity-50" onClick={cancelHandler}></div>
                    
                    {/* Modal */}
                    <div className="fixed inset-x-0 bottom-0 flex items-end justify-center">

                        <div className="bg-white w-full max-w-lg rounded-t-2xl shadow-lg p-6">

                            <div className="w-full grid items-center mb-4">
                                <IoMdClose onClick={cancelHandler} className="rounded-full" size="1.5rem"/>    
                                <p className="font-semibold text-lg absolute justify-self-center">Comments</p>
                            </div>

                            <div className="grid py-2 max-h-72 overflow-y-auto">
                                {renderCommentsContent()}
                                <div ref={commentsEndRef} />
                            </div>


                            <Divider className="mb-5 mt-2" />

                            <div className="grid grid-cols-[auto,1fr] gap-2 items-start">

                                <UserAvatar username={currentUser.username} photoURL={currentUser.photo?.asset?.url} size={36} />

                                <TextArea
                                    placeholder="Share what you like about this Pin, how it inspired you, or simply give a compliment."
                                    className="flex-grow"
                                    autoSize={{
                                        minRows: 1,
                                        maxRows: 6,
                                    }}
                                    count={{
                                        show: true,
                                        max: 500,
                                    }}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    disabled={isCreating}
                                />

                                <Button 
                                    onClick={postHandler} 
                                    className="col-start-2 justify-self-end mt-5"
                                    disabled={isCreating}
                                    loading={isCreating}
                                >
                                    Post
                                </Button>   
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* desktop comments: */}
            <div className="flex flex-col h-full">

                <div className="overflow-y-auto flex-grow space-y-1 pb-2">
                    {renderCommentsContent()}
                </div>

                <div className="flex items-start pt-3 pb-6 bg-white mt-auto" style={{ boxShadow: '0 0 1px rgba(0, 0, 0, 0.2)' }} >

                    <TextArea
                        placeholder="Share what you like about this Pin, how it inspired you, or simply give a compliment."
                        className="flex-grow mr-2 "
                        autoSize={{
                            minRows: 1,
                            maxRows: 6,
                        }}
                        count={{
                            show: true,
                            max: 500,
                        }}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        disabled={isCreating}
                    />

                    <button 
                        onClick={postHandler} 
                        className="flex justify-center items-center overflow-hidden"
                        disabled={isCreating}
                    >
                        { isCreating ? (
                            <ImSpinner2 className="animate-spin text-neutral-500 ml-2 mt-0.5" size="2rem" />
                        ) : (
                            <IoMdSend className="bg-white rounded-full p-2 pr-0 opacity-70" size="2.5rem" />
                        ) }
                    </button>   
                </div>
            </div>
        </>

    );
};

export default Comments;