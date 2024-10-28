import { useDispatch, useSelector } from 'react-redux';
import { fetchUserById, selectCurrentUser, setCurrentUser } from './store/user/user.slice';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Root from './container/root';
import ErrorPage from './pages/error';
import PrivateRoutes from './utils/private-routes';
import SignIn from './container/sign-in';
import SignUp from './container/sign-up';
import PinsDisplay from './container/pins-display';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import UserProfile from './container/user-profile';
import Explore from './container/explore';
import Navbar from './components/mobile/navbar';
import Pin from './components/pin';
import CreatePin from './container/create-pin';
import UserPage from './container/user-page';
import { fetchPins, selectPins } from './store/pins/pins.slice';
import AccountSettings from './container/account-settings';
import ProfileSettings from './container/profile-settings';
import { sanityClient } from './config/sanity-client';
import Comments from './container/comments';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { selectIsLoading } from './store/pins/pin.slice';
import { selectCategoryIdsIsLoading } from './store/categories/category.slice';
import SearchPage from './components/mobile/search-page';
import { fetchCategories, selectCategories, selectCategoriesAreLoading } from './store/categories/categories.slice';

TimeAgo.addDefaultLocale(en);

const App = () => {
    const dispatch = useDispatch();
    const currentUser = useSelector(selectCurrentUser);
    const currentPins = useSelector(selectPins);
    const isLoadingInPin = useSelector(selectIsLoading);
    const isLoadingInCategory = useSelector(selectCategoryIdsIsLoading);
    const categories = useSelector(selectCategories);
    const categoriesAreLoading = useSelector(selectCategoriesAreLoading);

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            // console.log('current user: ', user)
            if (!user) {
                dispatch(setCurrentUser(null));
                dispatch({ type: 'RESET' })
            } else if (!currentPins?.length) {
                dispatch(fetchPins());
            } 
        });
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            await dispatch(fetchCategories()).unwrap();
        }

        if (!categories && !categoriesAreLoading) {
            fetchData();
        }

        // creates a subscription to changes in the pin doc:
        const subscription = sanityClient
            .listen(
                `*[_type == "category"]{
                    _id
                }`,
                {},
                // returns the entire doc on changes:
                { includeResult: true }
            )
            .subscribe(async (update) => {
                // the update obj contains details of the change:
                console.log('SANITY CHANGE DETECTED REGARDING CATEGORIES!');
                const { transition } = update;

                if (transition) {
                    console.log({transition})
                    fetchData();
                }
        });
    
        // to prevent memory leaks, the subscription is cleaned up when the component unmounts:
        return () => subscription.unsubscribe();
        
    }, [])

    useEffect(() => {
        if (!currentUser) return;

        const params = { userId: currentUser?._id };
        
        // creates a subscription to changes in the user doc (with the given userid):
        const subscription = sanityClient
            .listen(
                `*[_type == "user" && _id == $userId]`,
                params,
                { includeResult: true }
            )
            .subscribe(async (update) => {
                // the update obj contains details of the change:
                console.log('USER CHANGE DETECTED! NEW USER DOC:', update.result);

                if (update.result) {
                    setTimeout(() => {
                        dispatch(fetchUserById(update.result._id));
                    }, 2000);
                }
        });
    
        // to prevent memory leaks, the subscription is cleaned up when the component unmounts:
        return () => subscription.unsubscribe();

    }, []);

    // dispatch({ type: 'RESET' });
    
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Root />} errorElement={<ErrorPage />}>

                    {/* Protected routes */}
                    <Route element={<PrivateRoutes />}>
                        <Route path='/' element={<Navbar />}>
                            <Route path='/' exact element={<PinsDisplay />} />
                            <Route path='profile/:currentUsername' element={<UserProfile />} />
                            
                            <Route path='/settings'>
                                <Route path='account' element={<AccountSettings />} />
                                <Route path='profile' element={<ProfileSettings />} />
                            </Route>

                            <Route path='explore' element={<Explore />}>
                                {/* search for mobile only */}
                                <Route path='search' element={<SearchPage />} />
                            </Route>

                            {/* search for desktop only */}
                            {/* <Route path='search' element={<SearchBar />} /> */}
                            
                            <Route path='explore/:categoryName' element={<PinsDisplay />} />
                            
                            <Route path='pin/:pinId' element={<Pin />}>
                                <Route path='comments' element={<Comments />} /> 
                            </Route>
                            
                            <Route path='user/:username' element={<UserPage />} />

                            <Route path='/create-pin' element={<CreatePin />} />
                        </Route>
                    </Route>

                    {/* Public routes */}
                    <Route path="/sign-in" element={<SignIn />} />
                    <Route path="/sign-up" element={<SignUp />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
};

export default App
