const FullPageSpinner = ({ text }) => {
    return (
        <div 
            className="fixed inset-0 bg-white bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-20"
            aria-live="assertive"
            aria-busy="true"
        >
            <div className="flex justify-center items-center max-w-80">
                <span className="text-xl mr-3 md:text-2xl">{text}</span>
                <svg className="animate-spin h-8 w-8 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                </svg>
            </div>
        </div>
    )
}

export default FullPageSpinner;