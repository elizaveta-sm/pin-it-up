import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { fetchPin, selectError, selectIsLoading, selectPin } from "../store/pins/pin.slice";
import { fetchRecommendedPins, selectPins, selectPinsAreLoading, selectPinsError } from "../store/pins/pins.slice";
import PinsDisplay from "../container/pins-display";
import Spinner from "./spinner";
import PinPreview from "./pin-preview";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";

const PinRecommendations = ({ pin }) => {
    const { pinId } = useParams(); 
    const dispatch = useDispatch();
    const currentPin = useSelector(selectPin, shallowEqual);
    const currentPinIsLoading = useSelector(selectIsLoading);
    const currentPinError = useSelector(selectError);

    const pins = useSelector(selectPins);
    const pinsAreLoadings = useSelector(selectPinsAreLoading);

    const recommendedPins = useSelector(state => state.pins?.recommendedPinsById[pinId] || [], shallowEqual);
    const recommendedPinsAreLoading = useSelector(selectPinsAreLoading); 

    // Track recommendations fetching status by pin ID
    const [hasFetchedRecommendations, setHasFetchedRecommendations] = useState({});
    console.log('recommended pins are loading? ', recommendedPinsAreLoading)
    console.log('recommended pins: ', recommendedPins)

    useEffect(() => {
        const fetchRecommendations = async () => {
            console.log('has fetched recommendations: ', hasFetchedRecommendations)

            if (!hasFetchedRecommendations[pinId] && !recommendedPinsAreLoading && (pin || currentPin)) {
                console.log('FETCHING RECS...')
                console.log('pin as the reference: ', pin || currentPin)
                try {
                    await dispatch(fetchRecommendedPins(pin || currentPin)).unwrap();
                    setHasFetchedRecommendations(prevState => ({
                        ...prevState,
                        [pinId]: true,
                    }));
                } catch (error) {
                    console.error(error);
                }
            }
        };

        console.log('FETCHING RECS')
        fetchRecommendations();
    }, []);

    let content;

    if (recommendedPins?.length && !recommendedPinsAreLoading) {
        content = recommendedPins.map(pin => <PinPreview pin={pin} key={pin._id} />)
    } else {
        const filteredPins = pins?.filter(pin => 
            pin._id !== pinId
        );
        console.log('using generic things..')

        content = filteredPins?.map(pin => <PinPreview pin={pin} key={pin._id} />);
    } 

    return (
        <>
            { (recommendedPinsAreLoading || pinsAreLoadings) && <Spinner /> }

            { ( (currentPin || pin) && !recommendedPinsAreLoading ) && (
                recommendedPins.length ? (
                    <ResponsiveMasonry columnsCountBreakPoints={{350: 2, 750: 3, 900: 4}}>
                        <Masonry>
                            { content }
                        </Masonry>
                    </ResponsiveMasonry>
                ) : <PinsDisplay /> 
            )}
        </>
    );
};

export default PinRecommendations;
