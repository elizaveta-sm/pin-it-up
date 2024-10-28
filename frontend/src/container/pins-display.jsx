import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import PinPreview from "../components/pin-preview";
import { fetchPins, selectPinResults, selectPins, selectPinsError, selectPinsAreLoading, addPin, deletePin, updatePins } from "../store/pins/pins.slice";
import { useDispatch, useSelector } from "react-redux";
import Spinner from "../components/spinner";
import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { selectCurrentUser } from "../store/user/user.slice";
import { sanityClient } from "../config/sanity-client";
import NoResultsFound from "../components/no-results-found";
import { fetchPin } from "../store/pins/pin.slice";
import SomethingWentWrong from "../components/something-went-wrong";
import { IoIosArrowBack } from "react-icons/io";

const PinsDisplay = ({ pinId }) => {
    const dispatch = useDispatch();

    const pins = useSelector(selectPins);
    // console.log('pins in the pinsDisplay: ', pins)

    const pinResults = useSelector(selectPinResults);

    const pinsError = useSelector(selectPinsError);
    const pinsAreLoading = useSelector(selectPinsAreLoading);
    
    console.log('error in the PinsDisplay: ', pinsError)
    // console.log('pins are loading? ', pinsAreLoading)
    
    const currentUser = useSelector(selectCurrentUser);
    const navigate = useNavigate();
    
    const params = useParams();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const categoryName = params?.categoryName;

    useEffect(() => {
        if (!currentUser) return;

        if (!pins || pins?.length === 0) {
            console.log('theres no pins')
            dispatch(fetchPins());
        }
        
        // creates a subscription to changes in the pin doc:
        const subscription = sanityClient
            .listen(
                `*[_type == "pin"]{
                    _id,
                    image,
                    title,
                    about,
                    "categories": categories[]->{
                        _id,
                        name
                    },
                    "postedBy": postedBy->{
                        _id,
                        username,
                        firstName,
                        lastName,
                        photo
                    },
                    "comments": comments[]->{
                        _id,
                        comment,
                        "postedBy": postedBy->{
                            _id,
                            username,
                            firstName,
                            lastName,
                            photo
                        }
                    },
                    "savedBy": savedBy[]->{
                            _id,
                            username,
                            firstName,
                            lastName,
                            photo
                        }
                }`,
                {},
                // returns the entire doc on changes:
                { includeResult: true }
            )
            .subscribe(async (update) => {
                // the update obj contains details of the change:
                console.log('SANITY CHANGE DETECTED REGARDING PINS!');

                const { result, transition } = update;
                console.log(result)

                
                if (transition === 'appear') {
                    // A new document was created
                    const newPin = await dispatch(fetchPin({ pinId: result._id })).unwrap();
                    dispatch(addPin(newPin));

                } else if (transition === 'update') {
                    // An existing document was updated
                    const updatedPin = await dispatch(fetchPin({ pinId: result._id })).unwrap();
                    dispatch(updatePins(updatedPin));

                } else if (transition === 'disappear') {
                    // A document was deleted
                    dispatch(deletePin(result._id));
                }
        });
    
        // to prevent memory leaks, the subscription is cleaned up when the component unmounts:
        return () => subscription.unsubscribe();

    }, []);

    // console.log('query: ', query)

    let content;

    if (pinsAreLoading) {
        return <Spinner />; // Render a spinner while pins are loading
    }

    if (pinsError) {
        return <SomethingWentWrong />; // Show error message if there's an issue fetching pins
    }

    // if there's a query:
    if (query) {
        content = pinResults?.length ? pinResults.map(pin => <PinPreview pin={pin} key={pin._id} />) : <NoResultsFound results={`pins for "${query}"`} /> ;

    // if there's a category:
    } else if (categoryName) {
        console.log({categoryName})

        const filteredPins = pins?.filter(pin => 
            pin.categories?.some(category => {
                console.log('checking this category: ', category.name)
                return category.name === categoryName;
            }) 
        );
        console.log('filtered pins: ', filteredPins)

        content = filteredPins?.map(pin => <PinPreview pin={pin} key={pin._id} />);
    
    // if there are all pins:
    } else if (pins?.length) {
        const filteredPins = pins?.filter(pin => 
            pin.postedBy._id !== currentUser._id
        );
        content = filteredPins?.map(pin => <PinPreview pin={pin} key={pin._id} />);
    }


    if (content?.length === 0) {
        content = <NoResultsFound results="pins" />
    }

    return (
        <>
            { categoryName && (
                <div className="w-full grid items-center pt-4 py-2 px-2 md:flex md:gap-2">
                    <IoIosArrowBack onClick={() => navigate(-1)} className="rounded-full cursor-pointer" size="1.75rem"/> 

                    <p className="font-semibold text-lg absolute justify-self-center md:relative md:text-xl capitalize">{categoryName}</p>
                </div>
            )}

            { <ResponsiveMasonry
                columnsCountBreakPoints={{350: 2, 500: 3, 700: 4, 900: 5, 1200: 6, 1800: 7}}
            >
                <Masonry>
                    { content }
                </Masonry>
            </ResponsiveMasonry> }
        </>
    )
}

export default PinsDisplay;