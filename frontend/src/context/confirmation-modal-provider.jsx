import { createContext, useState } from "react";

const DEFAULT_STATE = {
    isOpen: false,
    pin: null,
    modalText: '',
    authorId: '',
};

export const ConfirmationModalContext = createContext(DEFAULT_STATE);

export const ConfirmationModalProvider = ({ children }) => {
    const [confirmationModalInfo, setConfirmationModalInfo] = useState(DEFAULT_STATE);

    return (
        <ConfirmationModalContext.Provider value={{ confirmationModalInfo, setConfirmationModalInfo }}>
            { children }
        </ConfirmationModalContext.Provider>
    )
};

export default ConfirmationModalProvider;