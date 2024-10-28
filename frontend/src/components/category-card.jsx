import { Link } from "react-router-dom";
import { urlFor } from "../config/sanity-client";
import { useDispatch } from "react-redux";
import { deleteCategoryIfEmpty } from "../store/categories/categories.slice";
import { useState } from "react";
import { useMediaQuery } from "react-responsive";

const CategoryCard = ({ category }) => {
    const dispatch = useDispatch();
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const isDesktop = useMediaQuery({ minWidth: 1024 });

    // const fetchData = async (categoryId) => {
    //     await dispatch(deleteCategoryIfEmpty(categoryId)).unwrap();
    // }

    if (category.imageRefs?.length === 0 || !category.imageRefs) {
        console.log(`The category ${category.name} does not have image refs.`)
        // fetchData(category._id)
        return;
    }

    const imageURL = urlFor(category.imageRefs.at(-1).assetId);
    const name = category.name;

    const loadHandler = () => {
        setIsImageLoaded(true);
    }

    return (
        <Link to={name} >
            <div className="relative w-full">

                <>
                    { !isImageLoaded && (
                        <div className="h-0 w-full bg-gray-200 rounded-md md:rounded-2xl flex items-center justify-center"></div>
                    ) }

                    <img
                        src={imageURL}
                        loading="lazy"
                        alt={`Category ${category.name} image`}
                        onLoad={loadHandler} 
                        onError={() => setIsImageLoaded(false)}
                        className={`h-32 md:h-52 w-full object-cover rounded-md md:rounded-2xl transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0 h-0'}`}
                    />
                </>     
                
    
                <div className="absolute inset-0 bg-gray-700 opacity-60 rounded-md md:rounded-2xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <h2 className="text-white text-xl md:text-2xl font-semibold px-2 text-center">{ name }</h2>
                </div>
            </div>
        </Link>
    )
};

export default CategoryCard;