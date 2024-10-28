import { MdErrorOutline } from "react-icons/md";

const SomethingWentWrong = () => {
    return (
        <div className="flex items-center py-2 px-1.5 gap-1.5">
            <MdErrorOutline size="2rem" />
            <p className="text-base">Something went wrong.</p>
        </div>
    )
}

export default SomethingWentWrong;