import { createAsyncThunk, createSlice, nanoid } from "@reduxjs/toolkit";
import { sanityClient } from "../../config/sanity-client";
import { v4 as uuidv4 } from 'uuid';
import { uploadImageFromUrl } from "../../utils/upload-an-image-from-url";
import { getUserNameObject } from "../../utils/username-actions";
import { useDispatch } from "react-redux";
import { deletePin } from "../pins/pin.slice";
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";

const INITIAL_STATE = {
    currentUser: null,

    searchHistory: null,

    userEmail: null,
    emailIsLoading: false,
    emailError: null,

    userIsLoading: false,
    userError: null,
};

export const fetchUserEmail = createAsyncThunk(
    'user/fetchUserEmail',
    async (args, thunkAPI) => {

        const trimmedUsername = args.trim();

        const query = `*[_type == "user" && username == $username]{
            email
        }`;
        
        const params = { username: trimmedUsername };

        try {
            const result = await sanityClient.fetch(query, params);

            if (result.length === 0) {
                return thunkAPI.rejectWithValue('User not found.');
            }
            
            return result[0].email;

        } catch (error) {
            console.error("There was an error fetch user's email on sanity's side: ", error)

            return thunkAPI.rejectWithValue('Error fetching user email');
        }

    }
);

export const createUserInSanity = createAsyncThunk(
    'user/createUserInSanity',
    async (args) => {
        const { user, username } = args;
        
        const email = user.email;
        const image = user.photoURL;
        
        const uploadedImage = image ? await uploadImageFromUrl(image) : null;

        const nameObj = getUserNameObject(user?.displayName, username);
        const { firstName, lastName } = nameObj;

        // Creates a new user document
        const userDoc = {
            _id: uuidv4(),
            _type: 'user',
            firstName,
            lastName,
            username,
            email,
            savedPins: [],
            createdPins: [],
        };
        
        // If there's an image, upload it and add the reference to the userDoc
        if (uploadedImage) {
            userDoc.photo = {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: uploadedImage._id
                }
            };
        }

        console.log('user doc before sending it to sanity: ', userDoc)

        try {
            const createdUser = await sanityClient.createIfNotExists(userDoc);
            return createdUser;

        } catch (error) {
            console.error("Error with creating a user on Sanity's side: ", error);

            throw error;
        } 
    }
);

const fetchUserQuery = `*[_type == "user" && email == $email]{ 
    _id, 
    firstName, 
    lastName, 
    username, 
    email, 
    photo{
        asset->{
            _id,
            url
        }
    },
    savedPins[]->{
        _id,
        title,
        about,
        categories[]->{
            _id,
            name,
            imageRefs[] {
                assetId
            }
        },
        image{
            asset->{
                _id,
                url
            }
        },
        postedBy->{
            _id,
            username,
            firstName,
            lastName,
            photo{
                asset->{
                    _id,
                    url
                }
            },
        },
    },
    createdPins[]->{
        _id,
        title,
        about,
        image{
            asset->{
                _id,
                url
            }
        },
        postedBy->{
            _id,
            username,
            firstName,
            lastName,
            photo{
                asset->{
                    _id,
                    url
                }
            }
        },
        categories[]->{
            _id,
            name,
            imageRefs[] {
                assetId
            }
        },
    }
}`;

export const fetchUserDoc = createAsyncThunk(
    'user/fetchUserDoc',
    async (args, thunkAPI) => {

        const email = args;
        const params = { email };

        console.log('params in the fetchuser doc: ', params)

        try {
            const result = await sanityClient.fetch(fetchUserQuery, params);
            console.log('result when fetching a user doc: ', result)

            if (result.length === 0) {
                console.log('result was empty -> returning undefined')
                return undefined;
            }

            return result[0];

        } catch (error) {
            console.error("There was an error on sanity's side when fetching a user doc: ", error)

            return thunkAPI.rejectWithValue('Error fetching user document');
        }

    }
);

export const updateCreatedPins = createAsyncThunk(
    'user/updateCreatedPins',
    async (args, thunkAPI) => {
      const { userId, newPinId } = args;
      const { rejectWithValue } = thunkAPI; 
  
      try {
        const res = await sanityClient
            .patch(userId)  // Document ID of the user
            .setIfMissing({ createdPins: [] }) // Initialize the array if it doesn't exist
            .insert('after', 'createdPins[-1]', [
                    { 
                        _type: 'reference', 
                        _ref: newPinId, 
                    }
            ])
            .commit({
                    autoGenerateArrayKeys: true,
            });
        
        console.log('res when updating the createdPins: ', res)

        return "User's created pins updated.";
      } catch (error) {
        console.error('Error updating user:', error);
        return rejectWithValue(error.message);
      }
    }
);

const fetchUserByIdQuery = `*[_type == "user" && _id == $userId]{ 
    _id, 
    firstName, 
    lastName, 
    username, 
    email, 
    photo{
        asset->{
            _id,
            url
        }
    },
    savedPins[]->{
        _id,
        title,
        about,
        categories[]->{
            _id,
            name,
            imageRefs[] {
                assetId
            }
        },
        image{
            asset->{
                _id,
                url
            }
        },
        postedBy->{
            _id,
            username,
            firstName,
            lastName,
            photo{
                asset->{
                    _id,
                    url
                }
            }
        },
        comments[]->{
            _id,
            comment,
            _createdAt,
            postedBy->{
                _id,
                firstName,
                lastName,
                username,
                photo{
                    asset->{
                        _id,
                        url
                    }
                }
            }
        }
    },
    createdPins[]->{
        _id,
        title,
        about,
        image{
            asset->{
                _id,
                url
            }
        },
        postedBy->{
            _id,
            username,
            firstName,
            lastName,
            photo{
                asset->{
                    _id,
                    url
                }
            },
        },
        categories[]->{
            _id,
            name,
            imageRefs[] {
                assetId
            }
        },
        comments[]->{
            _id,
            comment,
            _createdAt,
            postedBy->{
                _id,
                firstName,
                lastName,
                username,
                photo{
                    asset->{
                        _id,
                        url
                    }
                }
            }
        }
    }
}`;

export const fetchUserById = createAsyncThunk(
    'otherUser/fetchUserById',
    async (args, thunkAPI) => {
        const userId = args.trim();
        const params = { userId };

        try {
            const result = await sanityClient.fetch(fetchUserByIdQuery, params);

            console.log('result when fetching the user doc: ', result)

            return result[0];

        } catch (error) {
            console.error("There was an error fetching a user on sanity's side: ", error)
            return thunkAPI.rejectWithValue('Error fetching user');
        }
    }
);

const fetchCreatedPinsQuery = `*[_type == "pin" && _id == $ref]{
    _id,
    title,
    about,
    image{
        asset->{
            _id,
            url
        }
    },
    categories[]->{
        _id,
        name,
        imageRefs[] {
            assetId
        }
    },
    postedBy->{
        _id,
        username,
        firstName,
        lastName,
        photo{
            asset->{
                _id,
                url
            }
        },
    },
    comments[]{
        _key,
        comment,
        _createdAt,
        postedBy->{
            username,
            photo{
                asset->{
                    _id,
                    url
                }
            }
        }
    },
    savedBy[]->{
        _id,
    }
}`;

export const fetchCreatedPins = createAsyncThunk(
    'user/fetchCreatedPins',
    async (args, thunkAPI) => {
        const createdPinsRefs = args;
        const { rejectWithValue } = thunkAPI;

        console.log('createdPinsRefs: ', createdPinsRefs)

        try {
            const pins = await Promise.all(
                createdPinsRefs.map(async (pinRef) => {
                    console.log('pinRef: ', pinRef)
                    console.log('._ref: ', pinRef._ref)

                    const params = { ref: pinRef._ref };
                    const result = sanityClient.fetch(fetchCreatedPinsQuery, params);

                    console.log('res from sanity: ', result)

                    return result;
                })
            );
            return pins;

        } catch (error) {
            console.error('Error fetching created pins:', error);
            return rejectWithValue(error.message);
        }
    }
);

const fetchSavedPinsQuery = `*[_type == "pin" && _id == $ref]{
    _id,
    title,
    about,
    image{
        asset->{
            _id,
            url
        }
    },
    categories[]->{
        _id,
        name,
        imageRefs[] {
            assetId
        }
    },
    postedBy->{
        _id,
        username,
        firstName,
        lastName,
        photo{
            asset->{
                _id,
                url
            }
        }
    },
    comments[]{
        _key,
        comment,
        postedBy->{
            username,
            photo{
                asset->{
                    _id,
                    url
                }
            }
        }
    },
    savedBy[]->{
        _id,
        username
    }
}`;

export const fetchSavedPins = createAsyncThunk(
    'user/fetchSavedPins',
    async (args, thunkAPI) => {
        const savedPinsRefs = args;
        const { rejectWithValue } = thunkAPI;

        try {
            const pins = await Promise.all(
                savedPinsRefs.map(async (pinRef) => {
                    const params = { ref: pinRef._ref };
                    const result = sanityClient.fetch(fetchSavedPinsQuery, params);
                    return result;
                })
            );

            console.log('saved pins: ', pins)
            return pins;
        } catch (error) {
            console.error('Error fetching saved pins:', error);
            return rejectWithValue(error.message);
        }
    }
);

export const deleteUserAccount = createAsyncThunk(
    'user/deleteUser',
    async (args, thunkAPI) => {
        const user = args;
        const userId = user._id;
        const userPhotoId = user.photo?.asset?._id || null;
        const { rejectWithValue } = thunkAPI;

        console.log('user in the delete user async thunk: ', user)

        try {
            // Step 2: Remove the user reference from the pins that the user has saved
            const savedPins = user?.savedPins || [];
            console.log("2. Removing refs to user in saved pins: ", savedPins)

            if (savedPins?.length) {
                for (const pin of savedPins) {
                    await sanityClient
                        .patch(pin._id)
                        .unset([`savedBy[_ref == "${userId}"]`])
                        .commit();
                }

                console.log('2. COMPLETE User references removed from saved pins.');
            }

            // Step 3: Delete comments that the user has left:
            const publishedComments = await sanityClient.fetch(
                `*[_type == "comment" && postedBy._ref =="${userId}"]{_id}`
            );
            console.log("3. Published comments: ", publishedComments)
 
            if (publishedComments?.length) { 
                const filteredComments = publishedComments.filter(comment => comment._id);
                console.log('3. Filtered comments: ', filteredComments)

                for (const comment of publishedComments) {
                    console.log('3. Comment right now: ', comment)

                    const pinWithComment = await sanityClient.fetch(
                    `*[_type == "pin" && "${comment._id}" in comments[]._ref]{_id}`
                    );
                    console.log('3. Pin with this comment: ', pinWithComment)
                    
                    await sanityClient
                        .patch(pinWithComment[0]._id)
                        .unset([`comments[_ref == "${comment._id}"]`])
                        .commit();
                    console.log('3. Removed the ref to the comment from the pin.')

                    await sanityClient.delete(comment._id);
                }
 
                console.log('3. COMPLETE Comments removed.');
            }

            // Step 3: Delete the User Document
            await sanityClient.delete(userId);
            console.log('3. COMPLETE User document deleted.');

            // Step 4: Delete User's Image Asset
            if (userPhotoId) {
                await sanityClient.delete(userPhotoId);
                console.log('4. COMPLETE User image asset deleted.');
            }

            // Step 5: Delete the User from Firebase Authentication
            const userInFirebase = auth.currentUser;

            // if (userInFirebase) {
            //     // Reauthentication logic:
            //     const providerData = userInFirebase.providerData[0];
            //     const providerId = providerData.providerId;
            //     console.log('provider data: ', providerData)

            //     if (providerId === 'google.com') {
            //         // If signed in via Google, reauthenticate with Google popup
            //         await reauthenticateWithPopup(userInFirebase, googleProvider);

            //     } else if (providerId === 'password') {
            //         // If signed in via email/password, prompt for credentials
            //         const email = userInFirebase.email;
            //         const password = prompt('Please confirm your password to delete your account:');
                    
            //         const credential = EmailAuthProvider.credential(email, password);
                
            //         await reauthenticateWithCredential(userInFirebase, credential);
            //     }

            //     console.log('5. Deleting user after reauthentication.')

            //     // After reauthentication, retry deleting the user
            // }
            await deleteUser(userInFirebase);
            console.log('5. User deleted from Firebase.');
            

        } catch (error) {
            console.error('Error in the thunk: ', error);

            return rejectWithValue(error);
        }
    }
)

export const userSlice = createSlice({
    name: 'user',
    initialState: INITIAL_STATE,
    reducers: {
        setCurrentUser: (state, action) => {
            state.currentUser = action.payload;
        },
        resetEmail: (state, action) => {
            state.userEmail = action.payload;
            state.emailError = action.payload;
        },
        addSearchTermToHistory: (state, action) => {
            if (!state.searchHistory) {
                state.searchHistory = [action.payload];
            } else {
                state.searchHistory = [...state.searchHistory, action.payload];
            }
        },
        deleteSearchTermFromHistory: (state, action) => {
            console.log('state.searchHistory: ', state.searchHistory);
            console.log('action.payload, id: ', action.payload);

            state.searchHistory = state.searchHistory.filter(
                term => term.id !== action.payload
            );
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchUserEmail.pending, (state) => {
            state.emailIsLoading = true
        })
        builder.addCase(fetchUserEmail.fulfilled, (state, action) => {
            state.emailIsLoading = false
            state.userEmail = action.payload
        })
        builder.addCase(fetchUserEmail.rejected, (state, action) => {
            state.emailIsLoading = false
            state.emailError = action.error.message
        })

        builder.addCase(fetchUserDoc.pending, (state) => {
            state.userIsLoading = true
        })
        builder.addCase(fetchUserDoc.fulfilled, (state, action) => {
            state.userIsLoading = false
            console.log('fetched user doc')
            // state.currentUser = action.payload
        })
        builder.addCase(fetchUserDoc.rejected, (state, action) => {
            state.userIsLoading = false
            console.log('fetched user doc. error')
            state.userError = action.error.message
        })

        builder.addCase(fetchUserById.pending, (state) => {
            state.userIsLoading = true
        })
        builder.addCase(fetchUserById.fulfilled, (state, action) => {
            state.userIsLoading = false
            state.currentUser = action.payload
        })
        builder.addCase(fetchUserById.rejected, (state, action) => {
            state.userIsLoading = false
            state.userError = action.error.message
        })
        
        builder.addCase(createUserInSanity.pending, (state) => {
            state.userIsLoading = true
        })
        builder.addCase(createUserInSanity.fulfilled, (state, action) => {
            state.userIsLoading = false
            state.currentUser = action.payload
        })
        builder.addCase(createUserInSanity.rejected, (state, action) => {
            state.userIsLoading = false
            state.userError = action.error.message
        })

        builder.addCase(updateCreatedPins.pending, (state) => {
            state.isLoading = true
        })
        builder.addCase(updateCreatedPins.fulfilled, (state, action) => {
            state.isLoading = false
            state.message = action.payload
        })
        builder.addCase(updateCreatedPins.rejected, (state, action) => {
            state.isLoading = false
            state.error = action.error.message
        })

        builder.addCase(fetchCreatedPins.pending, (state) => {
            state.isLoading = true
        })
        builder.addCase(fetchCreatedPins.fulfilled, (state, action) => {
            state.isLoading = false
            state.createdPins = action.payload
        })
        builder.addCase(fetchCreatedPins.rejected, (state, action) => {
            state.isLoading = false
            state.error = action.error.message
        })

        builder.addCase(fetchSavedPins.pending, (state) => {
            state.isLoading = true
        })
        builder.addCase(fetchSavedPins.fulfilled, (state, action) => {
            state.isLoading = false
            state.savedPins = action.payload
        })
        builder.addCase(fetchSavedPins.rejected, (state, action) => {
            state.isLoading = false
            state.error = action.error.message
        })
    },
});

export const { setCurrentUser, resetEmail, addSearchTermToHistory, deleteSearchTermFromHistory } = userSlice.actions;

export const userReducer = userSlice.reducer;

export const selectCurrentUser = (state) => state.user.currentUser;
export const selectUserCreatedPins = (state) => state.user.createdPins;
export const selectUserSavedPins = (state) => state.user.savedPins;

export const selectUserEmail = (state) => state.user.userEmail;
export const selectEmailIsLoading = (state) => state.user.emailIsLoading;
export const selectEmailError = (state) => state.user.emailError;

export const selectCurrentUserIsLoading = (state) => state.user.userIsLoading;
export const selectCurrentUserError = (state) => state.user.userError;

export const selectSearchHistory = (state) => state.user.searchHistory;