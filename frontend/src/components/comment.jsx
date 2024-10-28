import React, { useContext, useEffect, useState } from 'react'
import UserAvatar from './user-avatar'
import { Link, useParams } from 'react-router-dom';
import { sanityClient } from '../config/sanity-client';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOtherUserById, selectOtherUser, selectOtherUserIsLoading } from '../store/user/other-user.slice';
import { useTimeAgo } from 'react-time-ago';
import { BsThreeDots } from "react-icons/bs";
import { Button, Popover, Space, Spin } from 'antd';
import { RiDeleteBin2Line } from "react-icons/ri";
import { AlertMessageContext } from '../context/alert-provider';
import { deleteComment } from '../store/pins/pin.slice';
import { selectCurrentUser } from '../store/user/user.slice';


const Comment = ({ comment }) => {
    const { showAlert } = useContext(AlertMessageContext);
    const dispatch = useDispatch();
    const { pinId } = useParams(); 
    const currentUser = useSelector(selectCurrentUser);
    
    const user = useSelector(selectOtherUser);
    const userIsLoading = useSelector(selectOtherUserIsLoading);

    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    
    // const username = comment.postedBy?.username || user?.username;
    const authorId = comment.postedBy?._id;
    const username = comment.postedBy?.username;
    // const photoURL = comment.postedBy?.photo?.asset?.url || user?.photo?.asset?.url;
    const photoURL = comment.postedBy?.photo?.asset?.url;
    const firstName = comment.postedBy?.firstName;
    const lastName = comment.postedBy?.lastName;
    
    const isCurrentUserAuthor = authorId === currentUser._id;
    
    const deleteCommentHandler = async () => {

        if (!isCurrentUserAuthor) {
            showAlert('error', "You're not the author of this comment.");
            return;
        }

        const commentId = comment._id;
        
        if (!commentId || !pinId) {
            showAlert('error', "There's no comment id or pin id.");
            return;
        }
        
        try {
            setIsDeleting(true);

            // Step 1: Remove the reference to the comment from the pin document
            await sanityClient
                .patch(pinId)
                .unset([`comments[_ref == "${commentId}"]`])
                .commit();
            console.log('reference to the comment in the pin is removed.')

            // Step 2: Delete the comment document from Sanity
            await sanityClient.delete(commentId);
            console.log('comment deleted.');

            dispatch(deleteComment(commentId));
            showAlert('success', 'Comment deleted successfully.')

        } catch (error) {
            console.error('Failed to delete comment from Sanity: ', error);
            showAlert('error', 'Failed to delete the comment. Please try again.');
            throw new Error('Failed to delete comment');
        } finally {
            setIsDeleting(false);
            setOpen(false);
        }
    
    };

    const postedTimeAgo = useTimeAgo({
        date: new Date(comment._createdAt),
        locale: 'en-US', 
        timeStyle: "mini",
    });

    const content = (
        <>
            { isDeleting ? (
                <Spin size="small" /> 
            ) : (
                <div onClick={isDeleting ? null : deleteCommentHandler} className='flex items-center text-red-800'>
                    <RiDeleteBin2Line className="rounded-full mr-2 opacity-70" size="1.25rem"/>
                    <span>Delete</span>
                </div>
            ) }
        </>
    );

    return (
        <div className='grid'>

            { userIsLoading && (
                <div className="flex gap-2 items-center py-3 animate-pulse">
                    <div className="rounded-full bg-neutral-200 h-9 w-9"></div> 
                    <div className="flex-1 space-y-2 py-1">
                        <div className="h-6 bg-neutral-200 rounded-md w-3/4"></div> 
                    </div>
                </div>
            ) }

            { !userIsLoading && username && (
                <div className='flex gap-x-2 items-start my-2'>
                    <Link to={`/user/${username}`} className="flex gap-2 items-center">
                        <UserAvatar username={username} photoURL={photoURL} size={36} />
                    </Link>
                    
                    <div className='flex-grow'>
                        <div className='flex flex-col'>

                            <div className='flex justify-between items-center pb-1'>
                                <p>
                                    <Link to={`/user/${username}`} className="font-semibold pr-1.5">
                                        {firstName && firstName} 
                                        {lastName && ` ${lastName}`}
                                    </Link>

                                    <span className='text-gray-600 text-sm'>
                                        { postedTimeAgo.formattedDate }
                                    </span>
                                </p>

                                { isCurrentUserAuthor && (
                                    <Popover 
                                        content={content} 
                                        trigger="click" 
                                        onOpenChange={(newOpen) => setOpen(newOpen)}
                                        open={open}
                                    >
                                        <BsThreeDots size='1.25em' /> 
                                    </Popover>
                                ) }
                            </div>

                            <p className='text-base leading-5'>
                                { comment.comment }
                            </p>

                        </div>
                    </div>

                </div>
            ) }

            

        </div>

    )
};

export default Comment;