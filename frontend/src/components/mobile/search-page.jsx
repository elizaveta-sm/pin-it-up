import { Button, Input } from 'antd';
import { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchPins, selectPinResults, selectPinsAreLoading, selectPinsError } from '../../store/pins/pins.slice';
import Spinner from '../spinner';
import PinsDisplay from '../../container/pins-display';
import { addSearchTermToHistory, selectSearchHistory } from '../../store/user/user.slice';
import SearchHistoryTerm from '../search-history-term';
import { v4 as uuidv4 } from 'uuid';
import { AlertMessageContext } from '../../context/alert-provider';
import NoResultsFound from '../no-results-found';

const { Search } = Input;

const SearchPage = ({ searchMode }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { showAlert } = useContext(AlertMessageContext);

    const pinResults = useSelector(selectPinResults);
    const pinResultsAreLoading = useSelector(selectPinsAreLoading);
    const pinResultsError = useSelector(selectPinsError);
    const searchHistory = useSelector(selectSearchHistory);

    console.log('pin results are loading? ', pinResultsAreLoading)
    console.log('search history in the search page: ', searchHistory)
    
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q');

    const [searchValue, setSearchValue] = useState(query || '');

    const searchHandler = (value, _e, { source }) => {
        console.log('search button clicked, adding the query to the search history')
        const searchTerm = value.toLowerCase().trim();

        if (searchTerm.length < 2) {
            showAlert('warning', 'Your search is too short.');
            return;
        }

        const termExists = searchHistory?.find(
            entry => entry.searchTerm === searchTerm
        );

        if (!termExists) {
            dispatch(addSearchTermToHistory({
                id: uuidv4(),
                searchTerm
            }));
        }

        setSearchParams({ q: searchTerm });
    };

    const cancelHandler = () => {
        setSearchParams({});
        setSearchValue('');
        navigate('/explore', { replace: true });
    };

    useEffect(() => {
        if (query) {
            setSearchValue(query);
            dispatch(searchPins(query));
        }
    }, [query, dispatch]);

    let content;

    if (pinResultsAreLoading) {
        content = <Spinner />
    } else if (query && pinResults?.length) {
        content = <PinsDisplay />
    } else if (pinResultsError) {
        content = <p>An error occurred.</p>
    } else if (!query && searchHistory?.length) {
        content = 
            <div className='grid'>
                {searchHistory.map(term => (
                    <SearchHistoryTerm 
                        key={term.id} 
                        term={term} 
                        onClick={() => {
                            setSearchParams({ q: term.searchTerm });
                            setSearchValue(term.searchTerm);
                        }} 
                    />
                ))}
            </div>

    } else if (!query) {
        content = <p className='px-1.5 text-gray-700'>Here&apos;s going to be your search history.</p>;

    } else {
        content = <NoResultsFound results="pins" />
    }

    return (
        <div className='relative'>
            <div className='flex p-1.5 pt-3'>
                <Search
                    placeholder="What are you interested in?"
                    onSearch={searchHandler}
                    loading={pinResultsAreLoading}
                    enterButton={true}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />

                { searchMode && <Button className='ml-1' onClick={cancelHandler}>Cancel</Button> }
            </div>

            { searchMode && content }
        </div>
    )
}

export default SearchPage;