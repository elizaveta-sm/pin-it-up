import { FiClock } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import { useDispatch } from "react-redux";
import { deleteSearchTermFromHistory } from "../store/user/user.slice";

const SearchHistoryTerm = ({ term, onClick }) => {
    const dispatch = useDispatch();

    const deleteHandler = () => {
        dispatch(deleteSearchTermFromHistory(term.id))
    }

    return (
        <div className="flex items-center justify-between px-5 pt-1.5 pb-1 md:bg-gray-200 md:text-gray-700 md:rounded-full md:px-3 md:py-1.5 md:m-1">
            <div className="flex items-center">
                <FiClock className="rounded-full mr-3 md:hidden" size="1rem" />
                <p className="text-sm cursor-pointer" onClick={onClick}>
                    {term.searchTerm}
                </p>
            </div>
            
            <IoMdClose onClick={deleteHandler} className="rounded-full text-gray-500 md:text-gray-800 md:ml-1.5" size="1.25rem"/> 
        </div>
    )
}

export default SearchHistoryTerm;