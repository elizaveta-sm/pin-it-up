import { Tabs } from 'antd';
import { useDispatch, useSelector } from "react-redux";
import UserAvatar from "../components/user-avatar";
import { useNavigate, useParams } from "react-router-dom";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import PinPreview from '../components/pin-preview';
import { urlFor } from '../config/sanity-client';
import { useContext, useEffect, useState } from 'react';
import Item from 'antd/es/list/Item';
import { PiEmpty } from "react-icons/pi";
import { AlertMessageContext } from '../context/alert-provider';
import { fetchOtherUserDocByUsername, selectOtherUser, selectOtherUserError, selectOtherUserIsLoading, setOtherUser } from '../store/user/other-user.slice';
import Spinner from '../components/spinner';
import NoResultsFound from '../components/no-results-found';
import pinLogo from '/pin-logo.png';

const { TabPane } = Tabs;

const UserPage = () => {
    const { showAlert } = useContext(AlertMessageContext);
    const { username } = useParams();
    const [activeKey, setActiveKey] = useState('created');
    
    
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const otherUser = useSelector(selectOtherUser);
    const isOtherUserLoading = useSelector(selectOtherUserIsLoading);
    const otherUserError = useSelector(selectOtherUserError);
    console.log('username in the params: ', username)
    console.log('other user in the user page: ', otherUser)

    useEffect(() => {
        const fetchData = async () => {
            await dispatch(fetchOtherUserDocByUsername({ username })).unwrap();
        }

        if (username && (!otherUser || otherUser.username !== username)) {
            console.log('fetching user...')

            fetchData()
        }

    }, [username]);

    useEffect(() => {
        return () => {

            if (!username) {
                console.log('left the user page & path -> cleaning up the other user')
                dispatch(setOtherUser(null));
            }
        };
    }, [dispatch])

    
    const imageURL = otherUser?.photo && (otherUser?.photo?.asset?.url || urlFor(otherUser?.photo.asset));

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
            {isOtherUserLoading ? (
                <div className='py-6 flex flex-col items-center animate-pulse'>
                    <div className="rounded-full bg-gray-200" style={{ width: 96, height: 96 }}></div>
                    <p className="pt-2 pb-1 bg-gray-200 rounded w-32 h-6 mt-4"></p>
                    <p className="flex items-center gap-1 bg-gray-200 rounded w-20 h-4 mt-2.5"></p>
                    <div className="w-full mt-2 pb-20">
                        <Spinner />
                    </div>
                </div>
            ) : otherUser ? (
                <div className='py-6 flex flex-col items-center'>
                    <UserAvatar username={username} photoURL={imageURL} size={96} fontSize="3.25rem" />
                    
                    <p className="text-xl font-semibold pt-2 pb-1">{otherUser.firstName || ""} {otherUser.lastName || ""}</p>

                    <p className="flex items-center gap-1 mb-2">
                        <img src={pinLogo} className="h-5 w-5" alt="Pinterest logo" />
                        <span className="text-gray-500">{username}</span>
                    </p>

                    <Tabs
                        activeKey={activeKey}
                        onChange={handleTabChange}
                        className='w-full pb-20 md:p-0' 
                        centered
                    >
                        <TabPane tab="Created" key="created">
                            {renderPinsContent(otherUser.createdPins, "The user hasn't created anything yet.")}
                        </TabPane>
                        <TabPane tab="Saved" key="saved">
                            {renderPinsContent(otherUser.savedPins, "The user hasn't saved anything yet.")}
                        </TabPane>
                    </Tabs>
                </div>
            ) : (
                <NoResultsFound results="user" />
            )}
        </>
    )
};

export default UserPage;