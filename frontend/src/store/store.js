import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { userReducer } from './user/user.slice';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
import logger from 'redux-logger';
import { pinsReducer } from './pins/pins.slice';
import { categoriesReducer } from './categories/categories.slice';
import { categoryReducer } from './categories/category.slice';
import { pinReducer } from './pins/pin.slice';
import { otherUserReducer } from './user/other-user.slice';

const rootPersistConfig = {
    key: 'root',
    storage,
    blacklist: ['category', 'pin', 'categories', 'otherUser'],
};

const userPersistConfig = {
    key: 'user',
    storage,
    whitelist: ['currentUser'],
};

const pinsPersistConfig = {
    key: 'pins',
    storage,
    blacklist: ['pinResults', 'filteredPins'],
};

const combinedReducers = combineReducers({ 
    user: persistReducer(userPersistConfig, userReducer),
    pins: persistReducer(pinsPersistConfig, pinsReducer),
    categories: categoriesReducer,
    category: categoryReducer,
    pin: pinReducer,
    otherUser: otherUserReducer,
});

const rootReducer = (state, action) => {
    if (action.type === 'RESET') {
        console.log('Resetting the state');
        // Clear persisted state from storage
        storage.removeItem('persist:root');
        storage.removeItem('persist:user');
        storage.removeItem('persist:pins');
        // Reset state to empty or initial state
        state = undefined; // Alternatively, provide initial state if necessary
    }

    return combinedReducers(state, action);
}

const persistedReducer = persistReducer(rootPersistConfig, rootReducer);
  
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
                ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
            },
        }).concat(logger),
});

// With this function, our store will be saved to the local storage, and even after a browser refresh, our data will remain.
export const persistor = persistStore(store);

