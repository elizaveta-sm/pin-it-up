import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { sanityClient } from "../../config/sanity-client";

const INITIAL_STATE = {
    otherUser: null,
    userIsLoading: false,
    userError: null,
};

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
    }
}`;

export const fetchOtherUserById = createAsyncThunk(
    'otherUser/fetchUserById',
    async (args, thunkAPI) => {
        console.log('args in the fetchUserById: ', args)

        const userRef = args;
        const params = { userId: userRef };

        try {
            const result = await sanityClient.fetch(fetchUserByIdQuery, params);
            return result[0];

        } catch (error) {
            console.error("There was an error fetching a user on sanity's side: ", error)
            return thunkAPI.rejectWithValue('Error fetching user');
        }
    }
);

const fetchUserQuery = `*[_type == "user" && username == $username]{ 
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
            firstName, 
            lastName, 
            username, 
            email, 
            photo{
                asset->{
                    _id,
                    url
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
            firstName, 
            lastName, 
            username, 
            email, 
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
        }
    }
}`;

export const fetchOtherUserDocByUsername = createAsyncThunk(
    'user/fetchOtherUserDocByUsername',
    async (args, thunkAPI) => {
        const { username } = args;
        const params = { username };

        try {
            const result = await sanityClient.fetch(fetchUserQuery, params);

            if (result.length === 0) {
                throw new Error('Failed to fetch the user doc.')
            }

            return result[0];

        } catch (error) {
            console.error("There was an error on sanity's side when fetching a user doc: ", error)

            return thunkAPI.rejectWithValue('Error fetching user document');
        }
    }
);

export const otherUserSlice = createSlice({
    name: 'otherUser',
    initialState: INITIAL_STATE,
    reducers: {
        setOtherUser: (state, action) => {
            state.otherUser = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchOtherUserById.pending, (state) => {
            state.userIsLoading = true
        })
        builder.addCase(fetchOtherUserById.fulfilled, (state, action) => {
            state.userIsLoading = false
            state.otherUser = action.payload
        })
        builder.addCase(fetchOtherUserById.rejected, (state, action) => {
            state.userIsLoading = false
            state.userError = action.error.message
        })

        builder.addCase(fetchOtherUserDocByUsername.pending, (state) => {
            state.userIsLoading = true
        })
        builder.addCase(fetchOtherUserDocByUsername.fulfilled, (state, action) => {
            state.userIsLoading = false
            state.otherUser = action.payload
        })
        builder.addCase(fetchOtherUserDocByUsername.rejected, (state, action) => {
            state.userIsLoading = false
            state.userError = action.error.message
        })
    
    },
});

export const { setOtherUser } = otherUserSlice.actions;

export const otherUserReducer = otherUserSlice.reducer;

export const selectOtherUser = (state) => state.otherUser.otherUser;
export const selectOtherUserIsLoading = (state) => state.otherUser.userIsLoading;
export const selectOtherUserError = (state) => state.otherUser.userError;