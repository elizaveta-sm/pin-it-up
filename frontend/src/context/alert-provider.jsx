import { createContext, useEffect, useState } from "react";
import { Alert } from 'antd';

const DEFAULT_STATE = [];

export const AlertMessageContext = createContext({
    alertMessages: DEFAULT_STATE,
    showAlert: () => {},
});

export const AlertMessageProvider = ({ children }) => {
    const [alertMessages, setAlertMessages] = useState(DEFAULT_STATE);

    // Function to hide an alert based on its index
     const hideAlert = (index) => {
        setAlertMessages((prev) => prev.filter((_, i) => i !== index));
    };

    // UseEffect hook to remove the first alert message after 3 seconds
    useEffect(() => {
        if (alertMessages.length === 0) return;

        const timeout = setTimeout(() => {
            setAlertMessages((prevItems) => prevItems.filter((_, i) => i !== 0));
        }, 3000);

        return () => clearTimeout(timeout);
    }, [alertMessages]);

    // Context value containing the showAlert function
    const contextValue = {
        alertMessages,

        showAlert: (type, message) => {
            const alertMessage = {
                type,
                message,
            };
            
            setAlertMessages(prev => [...prev, alertMessage]);
        },
    };


    return (
        <AlertMessageContext.Provider value={contextValue}>
            <div className="fixed bottom-12 right-0 md:right-4 w-full max-w-xs z-50 space-y-3 md:max-w-96 px-4">
                { alertMessages.map((alert, index) => (
                    <div
                        key={index}
                        className="relative cursor-pointer"
                        onClick={() => hideAlert(index)}
                    >
                        <Alert
                            message={alert.message}
                            type={alert.type}
                            showIcon
                            className="rounded-md shadow-md w-full md:p-3 md:text-base"
                        />
                        
                        <div
                            className={`absolute bottom-0 left-0 h-1 w-full
                            ${alert.type === 'success' ? 'bg-green-200' : ''}
                            ${alert.type === 'warning' ? 'bg-yellow-300' : ''}
                            ${alert.type === 'error' ? 'bg-red-200' : ''}
                            animate-progress group-hover:animate-pauseProgress rounded-b-md`}
                        ></div>
                    </div>
                )) }
            </div>

            { children }
        </AlertMessageContext.Provider>
    )
};

export default AlertMessageProvider;