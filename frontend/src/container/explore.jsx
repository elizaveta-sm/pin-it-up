import { useLocation, useNavigate } from "react-router-dom";
import Categories from "./categories";
import { useEffect, useState } from "react";
import SearchPage from "../components/mobile/search-page";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, selectCategories, selectCategoriesAreLoading } from "../store/categories/categories.slice";
import { sanityClient } from "../config/sanity-client";

const Explore = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const categories = useSelector(selectCategories); 
    const categoriesAreLoading = useSelector(selectCategoriesAreLoading); 
    console.log('categories: ', categories)

    const [searchMode, setSearchMode] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const fetchData = async () => {
            await dispatch(fetchCategories()).unwrap();
        }

        if (!categories && !categoriesAreLoading) {
            fetchData();
        }

    }, [])

    useEffect(() => {
        // if there's 'search' in the location -> searchMode = true
        if (location.pathname.includes('search')) {
            setSearchMode(true)
        } else {
            setSearchMode(false)
        }

    }, [location]);

    const clickHandler = (e) => {
        if (!searchMode) navigate('search');
    };

    return (
        <div className="h-full"> 
            <div onClick={clickHandler} className="md:hidden">
                <SearchPage searchMode={searchMode} />
            </div>

            { !searchMode && <Categories /> }
        </div>
    );
};

export default Explore;