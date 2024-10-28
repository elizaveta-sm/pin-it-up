const DragOrDropUpload = ({ preview }) => {

    return (
        <section className="max-w-xl my-4">
            <label className="flex justify-center items-center w-full max-h-40 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">

                { preview ? (
                    <div className="flex flex-col items-center gap-2 my-3">
                        <div className="rounded-xl overflow-hidden max-w-32 max-h-24">
                            <img
                                src={preview}
                                className="w-full h-full object-contain object-center"
                                alt="Image preview"
                            />
                        </div>

                        <span className="font-medium text-gray-600">
                            Changed your mind?&nbsp;
                            <span className="text-blue-600 underline">Upload</span>
                            &nbsp;or drop another one.
                        </span>
                    </div>
                ) : (
                    <span className="flex items-center space-x-2 py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>

                        <span className="font-medium text-gray-600">
                            <span className="text-blue-600 underline">Upload</span>
                            &nbsp;or drop an image right here.
                        </span>
                    </span>
                ) }
            </label>
        </section>
    )
}

export default DragOrDropUpload;