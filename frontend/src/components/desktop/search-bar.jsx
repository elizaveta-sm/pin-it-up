import { Button, Input } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchPins, selectPinsAreLoading } from '../../store/pins/pins.slice';
import { addSearchTermToHistory, selectSearchHistory } from '../../store/user/user.slice';
import { useContext, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AlertMessageContext } from '../../context/alert-provider';
import SearchHistoryTerm from '../search-history-term';

const { Search } = Input;

const SearchBar = ({ searchMode, setSearchMode }) => {
    const { showAlert } = useContext(AlertMessageContext);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const pinResultsAreLoading = useSelector(selectPinsAreLoading);
    const searchHistory = useSelector(selectSearchHistory);

    const searchRef = useRef(null);
    const searchHistoryRef = useRef(null);

    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [searchValue, setSearchValue] = useState(query || '');

    useEffect(() => {
        if (query) {
            setSearchValue(query);
            navigate('/?q=' + query);
            dispatch(searchPins(query));
        }
        
        return () => {
            setSearchValue('');
        }
    }, [query, dispatch]);

    useEffect(() => {
        const handleClickOutside = (event) => {

            const searchInputNode = searchRef.current?.input;
            const searchHistoryNode = searchHistoryRef.current;

            if (
                !searchInputNode?.contains(event.target) &&
                !searchHistoryNode?.contains(event.target) && 
                searchMode && 
                !searchValue
            ) {
                setSearchMode(false);
                setSearchValue('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchMode, navigate]);

    const searchHandler = (value) => {
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
        setSearchValue('');
        setSearchMode(false);
    };

    const cancelHandler = () => {
        setSearchParams({});
        setSearchValue('');
        setSearchMode(false);
        navigate(-1);
    };

    let content;

    if (!query && searchHistory?.length) {
        content = (
            <div ref={searchHistoryRef} className='absolute bg-white w-full rounded-b-xl px-2 pb-4 z-10 flex flex-wrap' style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
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
        );
    } else if (!query) {
        content = (
            <div className='absolute bg-white w-full rounded-b-xl px-2 pb-4 z-10 shadow-lg'>
                <p className='px-1.5 text-gray-700'>Here&apos;s going to be your search history.</p>
            </div>
        );
    }

    return (
        <div className='relative'>
            <div className='flex p-1.5 py-3'>
                <Search
                    placeholder="What are you interested in?"
                    onSearch={searchHandler}
                    loading={pinResultsAreLoading}
                    enterButton
                    value={searchValue}
                    ref={searchRef}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onFocus={() => setSearchMode(true)}
                />
                {(searchValue || searchMode) && <Button className='ml-1' onClick={cancelHandler}>Cancel</Button>}
            </div>
            {searchMode && content}
        </div>
    );
};

export default SearchBar;
