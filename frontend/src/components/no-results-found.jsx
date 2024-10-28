import { MdErrorOutline } from "react-icons/md";

const NoResultsFound = ({ results }) => {
    return (
        <div className="w-full fixed flex items-center justify-center py-2 gap-1.5">
            <MdErrorOutline size="1.5rem" />
            <p className="text-base md:text-lg font-normal text-center">No { results } found.</p>
        </div>
    )
};

export default NoResultsFound;