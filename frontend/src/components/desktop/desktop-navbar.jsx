import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import logo from '/pin-it-up-logo.png';
import logoLowRes from '/pin-it-up-logo-low-res.png';
import SearchBar from './search-bar';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/user/user.slice';
import UserAvatar from '../user-avatar';
import { urlFor } from '../../config/sanity-client';
import { IoSettingsOutline } from "react-icons/io5";

const DesktopNavbar = () => {
    const [searchMode, setSearchMode] = useState(false);
    const [lowResLoaded, setLowResLoaded] = useState(false);
    const [highResLoaded, setHighResLoaded] = useState(false);
    
    const location = useLocation();
    const currentUser = useSelector(selectCurrentUser);

    const photo = currentUser?.photo;
    const username = currentUser?.username;

    const imageURL = photo && (photo?.asset?.url || urlFor(photo.asset));

    useEffect(() => {
        setSearchMode(location.pathname.includes('search'));
    }, [location.pathname]);

    const clickHandler = () => {
        if (!searchMode) {
            setSearchMode(true);
        }
    };

    const activeState = (isActive) => 
        `px-3.5 py-1.5 mx-0.5 rounded-md text-center transition-all ${
            isActive ? 'bg-black text-white' : 'text-neutral-900 hover:bg-neutral-200'
    }`;

    const activeIconState = (isActive) => 
        `p-1.5 rounded-full mr-3.5 transition-all ${
            isActive ? 'bg-black text-white' : 'text-neutral-900 hover:bg-neutral-200'
        }`;

    return (
        <>
            <Link className="flex items-center m-0 mr-4 relative h-14 w-14" to="/">
                {/* Placeholder for the logo */}
                {!lowResLoaded && !highResLoaded && (
                    <div className="absolute bg-neutral-200 p-5 flex items-center justify-center rounded-xl h-12 w-12" />
                )}

                {/* Low-resolution logo */}
                <img
                    src={logoLowRes}
                    className={`absolute inset-0 h-14 w-14 transition-opacity duration-500 ease-in-out ${lowResLoaded ? 'opacity-100' : 'opacity-0'}`}
                    alt="Low Res Logo"
                    onLoad={() => setLowResLoaded(true)}
                />
                
                {/* High-resolution logo */}
                <img
                    src={logo}
                    className={`absolute inset-0 h-14 w-14 transition-opacity duration-700 ease-in-out ${highResLoaded ? 'opacity-100' : 'opacity-0'}`}
                    alt="High Res Logo"
                    onLoad={() => setHighResLoaded(true)}
                />
            </Link>

            { currentUser && (
                <>
                    <NavLink to="/" className={({ isActive }) => activeState(isActive)}>Home</NavLink>
                    <NavLink to="/explore" className={({ isActive }) => activeState(isActive)}>Explore</NavLink>
                    <NavLink to="/create-pin" className={({ isActive }) => activeState(isActive)}>Create</NavLink>

                    
                    <div onClick={clickHandler} className="flex-grow mx-3.5">
                        <SearchBar searchMode={searchMode} setSearchMode={setSearchMode} />
                    </div>

                    <NavLink to="/settings/account" className={({ isActive }) => activeIconState(isActive)}>
                        <IoSettingsOutline size='1.5rem' />
                    </NavLink>

                    <Link to={`/profile/${username}`} className="flex items-center">
                        <UserAvatar username={username} photoURL={imageURL} size={36} />
                    </Link>
                </>
            ) }
        </>
    );
};

export default DesktopNavbar;
