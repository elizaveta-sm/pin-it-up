import { createContext, useState } from "react";

const DEFAULT_STATE = {
    isOpen: false,
    authorId: '',
    pinId: '',
};

export const BottomModalContext = createContext(DEFAULT_STATE);

export const BottomModalProvider = ({ children }) => {
    const [modalInfo, setModalInfo] = useState(DEFAULT_STATE);

    return (
        <BottomModalContext.Provider value={{ modalInfo, setModalInfo }}>
            { children }
        </BottomModalContext.Provider>
    )
};

export default BottomModalProvider;