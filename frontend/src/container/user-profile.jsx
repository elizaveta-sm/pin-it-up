import { Tabs } from 'antd';
import { useDispatch, useSelector } from "react-redux";
import UserAvatar from "../components/user-avatar"
import { fetchUserById, selectCurrentUser, selectCurrentUserIsLoading } from "../store/user/user.slice";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import PinPreview from '../components/pin-preview';
import { urlFor } from '../config/sanity-client';
import { useEffect, useState } from 'react';
import { PiEmpty } from "react-icons/pi";
import Spinner from '../components/spinner';
import NoResultsFound from '../components/no-results-found';
import { selectIsLoading } from '../store/pins/pin.slice';
import pinLogo from '/pin-logo.png';

const { TabPane } = Tabs;

const UserProfile = () => {
    const [activeKey, setActiveKey] = useState('created');
    
    const currentUser = useSelector(selectCurrentUser);
    const currentUserIsLoading = useSelector(selectCurrentUserIsLoading);
    const isLoadingInPin = useSelector(selectIsLoading);
    
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const { username, photo, firstName, lastName, createdPins, savedPins } = currentUser;
    console.log('current user in the user profile: ', currentUser);
    console.log('created pins: ', createdPins)
    console.log('saved pins: ', savedPins)

    const imageURL = photo && (photo?.asset?.url || urlFor(photo.asset));
    
    useEffect(() => {
        const fetchData = async () => {
            await dispatch(fetchUserById(currentUser._id)).unwrap();
        }        

        if (!isLoadingInPin && currentUser?._id) {
            fetchData();
        }
        if (!currentUser?._id) {
            fetchData();
        }

    }, [dispatch, currentUser?._id, isLoadingInPin]);

    const renderPinsContent = (pins, emptyMessage) => (
        pins?.length ? (
            <ResponsiveMasonry columnsCountBreakPoints={{350: 2, 500: 3, 700: 4, 900: 5, 1200: 6, 1800: 7}}>
                <Masonry>
                    {pins.map(pin => <PinPreview pin={pin} key={pin._id} />)}
                </Masonry>
            </ResponsiveMasonry>
        ) : (
            <p className='flex flex-col items-center justify-center px-1.5'>
                <span className='py-1.5'>{emptyMessage}</span>
                <PiEmpty size='1.5em' />
            </p>
        )
    );

    const handleTabChange = (key) => {
        setActiveKey(key);
    };

    return (
        <>
            { currentUserIsLoading ? (
                <div className='py-6 flex flex-col items-center animate-pulse'>
                    <div className="rounded-full bg-gray-200" style={{ width: 96, height: 96 }}></div>
                    <p className="pt-2 pb-1 bg-gray-200 rounded w-32 h-6 mt-4"></p>
                    <p className="flex items-center gap-1 bg-gray-200 rounded w-20 h-4 mt-2.5"></p>
                    <Button className="my-4" disabled>Loading...</Button>
                    <div className="w-full pb-20">
                        <Spinner />
                    </div>
                </div>
            ) : currentUser ? (
                <div className='py-6 flex flex-col items-center'>

                    <UserAvatar username={username} photoURL={imageURL} size={96} fontSize="3.25rem" />
                    <p className="text-xl font-semibold pt-2 pb-1">{firstName || ""} {lastName || ""}</p>

                    <p className="flex items-center gap-1">
                        <img src={pinLogo} className="h-5 w-5" alt="Pinterest logo" />
                        <span className="text-gray-500">{username}</span>
                    </p>

                    <Button className="my-4" onClick={() => navigate('/settings/profile')}>Edit Profile</Button>

                    <Tabs 
                        activeKey={activeKey} 
                        onChange={handleTabChange} 
                        className='w-full pb-20 md:p-0' 
                        centered
                    >
                        <TabPane tab="Created" key="created">
                            {renderPinsContent(createdPins, "You haven't created anything yet.")}
                        </TabPane>
                        <TabPane tab="Saved" key="saved">
                            {renderPinsContent(savedPins, "You haven't saved anything yet.")}
                        </TabPane>
                    </Tabs>

                </div>
            ) : (
                <NoResultsFound results="user" />
            ) }
        </>
    )
};

export default UserProfile;