import { useSelector } from 'react-redux';
import { selectCategories, selectCategoriesAreLoading, selectCategoriesError } from '../store/categories/categories.slice';
import CategoryCard from '../components/category-card';
import Spinner from '../components/spinner';
import NoResultsFound from '../components/no-results-found';
import SomethingWentWrong from '../components/something-went-wrong';

const Categories = () => {
    const categories = useSelector(selectCategories);
    const categoriesAreLoading = useSelector(selectCategoriesAreLoading);
    const categoriesError = useSelector(selectCategoriesError);

    const showCategories = categories?.length && !categoriesAreLoading;


    return (
        <>
            { categoriesAreLoading && <Spinner /> }

            { showCategories && (
                <div className='grid grid-cols-2 gap-x-1.5 gap-y-2 py-2 px-1.5 pb-24 overflow-y-auto md:grid-cols-[repeat(auto-fit,_minmax(16rem,_1fr))] md:gap-4 md:py-6 md:px-4 xl:px-44 md:pb-24'>
                    { categories.map(category => <CategoryCard key={category._id} category={category} />) }
                </div>
            ) }

            { !categories?.length && !categoriesAreLoading && <NoResultsFound results="categories" /> }

            { categoriesError && <SomethingWentWrong /> }
        </>
    )
}

export default Categories