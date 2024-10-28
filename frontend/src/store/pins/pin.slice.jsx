import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { sanityClient } from "../../config/sanity-client";

const INITIAL_STATE = {
    isLoading: false,
    error: null,

    message: '',
    pin: null,
    comments: null,
};

const fetchQuery = `*[_type == "pin" && _id == $pinId]{
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
  comments[]->{
    _id,
    comment,
    _createdAt,
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
    }
  },
  savedBy[]->{
    _id
  }
}`;

export const fetchPin = createAsyncThunk(
  'pin/fetchPin',
  async (args) => {
    const { pinId } = args;
    console.log('pin id in the fetch pin: ', pinId)
    const params = { pinId };

    try {
      const result = await sanityClient.fetch(fetchQuery, params);
      console.log('result in the fetch pin: ', result)
      return result[0];

    } catch (error) {
      console.error('Error fetching the pin: ', error);
      throw error;
    }

  }
);

export const savePin = createAsyncThunk(
    'pin/savePin',
    async (args, { getState }) => {
        const state = getState();
        const { pinId, userId } = args;

        try {

          // Proceed to save the pin for the user
          const pinResponse = await sanityClient
            .patch(pinId)
            .setIfMissing({ savedBy: [] })
            .append('savedBy', [{ _ref: userId, _type: 'reference' }])
            .commit({
              autoGenerateArrayKeys: true,
            });

          // Add the pin reference to the savedPins array in the user document
          const userResponse = await sanityClient
            .patch(userId)
            .setIfMissing({ savedPins: [] })
            .append('savedPins', [{ _ref: pinId, _type: 'reference' }])
            .commit({
              autoGenerateArrayKeys: true,
            });

          return 'Pin saved successfully!';
        } catch (error) {
            console.error('Error saving pin:', error);    
        }
        
    }
);

export const removePinFromSaved = createAsyncThunk(
  'pin/removePinFromSaved',
  async (args, { getState }) => {
      const state = getState();
      const { pinId, userId } = args;

      try {
          // Remove the pin from the savedBy array in the pin document
          const pinResponse = await sanityClient
              .patch(pinId)
              .unset([`savedBy[_ref=="${userId}"]`])
              .commit({
                  autoGenerateArrayKeys: true,
              });

          console.log('pin response when removing the pin: ', pinResponse)
          
          // Remove the pin reference from the savedPins array in the user document
          const userResponse = await sanityClient
          .patch(userId)
          .unset([`savedPins[_ref=="${pinId}"]`])
          .commit({
            autoGenerateArrayKeys: true,
          });
          console.log('user response when removing the pin: ', userResponse)

          return 'Pin removed successfully!';
      } catch (error) {
          console.error('Error removing pin:', error);
      }
  }
);

const fetchDraftsQuery = `*[_id in path("drafts.*")]{ _id }`;

const deleteAllDrafts = async () => {
  try {
    const drafts = await sanityClient.fetch(fetchDraftsQuery);

    console.log('Drafts found:', drafts);

    await Promise.all(drafts.map(async (draft) => {
      await sanityClient.delete(draft._id);
    }));

    console.log('All drafts have been deleted.');
  } catch (error) {
    console.error('Error deleting drafts:', error);
  }
};


export const deletePin = createAsyncThunk(
  'pin/deletePin',
  async (args, { rejectWithValue }) => {
    const pin = args;
    const pinId = pin._id;
    const authorId = pin.postedBy._id;
    const imageAssetId = pin.image.asset._id;
    console.log({pinId})
    console.log({authorId})
    console.log({imageAssetId})

    if (!pinId || !authorId) {
      console.log('theres no pin id or user id')
      throw new Error("There is no pin id or user id present.");
    }

    try {

      // Step 1: Remove the reference to the pin from all users' savedPins array
      const usersWithSavedPin = await sanityClient.fetch(
        `*[_type == "user" && "${pinId}" in savedPins[]._ref]`
      );

      console.log('1. users with this pin as saved: ', usersWithSavedPin)

      if (usersWithSavedPin?.length) {
        for (const user of usersWithSavedPin) {
          console.log('1. user: ', user)

          await sanityClient
            .patch(user._id)
            .unset([`savedPins[_ref == "${pinId}"]`])
            .commit();
        }
        console.log("1. COMPLETE Reference to the pin in users' savedPins removed.");
      }

      // Step 2: Remove the reference to the pin from the user's createdPins array
      const pinCreator = authorId;

      await sanityClient
        .patch(pinCreator)
        .unset([`createdPins[_ref == "${pinId}"]`])
        .commit();
        
      console.log('2. COMPLETE Reference to the pin in creator\'s createdPins removed.');
      

      // Step 3: Remove the reference to the pin from all categories
      const categoriesWithImageRef = await sanityClient.fetch(
        `*[_type == "category" && "${imageAssetId}" in imageRefs[].assetId]{_id, imageRefs}`
      );

      console.log('3. categories with the pin: ', categoriesWithImageRef)

      if (categoriesWithImageRef?.length) {
        for (const category of categoriesWithImageRef) {
          // Remove the image reference from the category

          await sanityClient
            .patch(category._id)
            .unset([`imageRefs[assetId == "${imageAssetId}"]`])
            .commit();

          console.log('3. Removed the image ref in the category: ', category)

          // Check if the category has no more image references
          const updatedCategory = await sanityClient.fetch(`*[_type == "category" && _id == "${category._id}"][0]{imageRefs}`);

          console.log('3. Updated category: ', updatedCategory)

          if (!updatedCategory.imageRefs || updatedCategory.imageRefs.length === 0) {
            // Find all pins referencing this category
            const pinsReferencingCategory = await sanityClient.fetch(
              `*[_type == "pin" && references("${category._id}")]._id`
            );

            console.log('3. Pins referencing this category: ', pinsReferencingCategory)

            // Remove references to the category from these pins
            if (pinsReferencingCategory?.length) {
              for (const pinId of pinsReferencingCategory) {
                await sanityClient
                  .patch(pinId)
                  .unset([`categories[_ref == "${category._id}"]`])
                  .commit();
              }
              console.log('3. Removed category references from these pins.');
            }

            // Delete the category if no image references are left
            await sanityClient.delete(category._id);
            console.log(`3. Category ${category?.name} deleted as it has no more image references.`);
          }
        }

        console.log('3. COMPLETE Category refs are removed.')
      }

      // Step 4: Delete all comments associated with the pin
      const commentsToDelete = pin.comments; // Assuming the pin object contains a "comments" array of references

      console.log('4. Comments of the pin: ', commentsToDelete);

      if (commentsToDelete?.length) {
        // Remove the references to comments from the pin document
        
        const filteredComments = commentsToDelete.filter(comment => comment._id);

        console.log('4. Pin id used to unset comments: ', pinId)

        await sanityClient
            .patch(pinId)
            .unset(['comments'])
            .commit();

        console.log('4. References to comments removed from the pin.');

        for (const comment of commentsToDelete) {
          if (comment._id) {
            console.log('4. Deleting comment: ', comment)

            await sanityClient.delete(comment._id);
          } else {
              console.log('4. Skipping deletion as the comment does not have a valid _ref:', comment);
          }
        }
        console.log('4. COMPLETE Comments associated with the pin deleted.');
      }
      
      // Step 5: Delete the draft document
      await deleteAllDrafts();
      console.log('5. COMPLETE Drafts deleted.')
      
      // Step 6: Delete the pin document from Sanity
      await sanityClient.delete(pinId);
      console.log('6. COMPLETE Pin deleted.');
      
      // Step 7: Delete the image asset
      await sanityClient.delete(imageAssetId);
      console.log('7. COMPLETE Asset deleted.');

      return 'The pin has been successfully deleted.'

    } catch (error) {
      console.error('Error deleting pin or asset:', error);

      // Use rejectWithValue to handle errors in a standardized way
      return rejectWithValue('Failed to delete pin or associated asset');
    }
  }
);

export const fetchPinComments = createAsyncThunk(
  'pin/fetchPinComments',
  async (args) => {
    const pinId = args;
    const params = { pinId };

    const query = `
      *[_type == "pin" && _id == $pinId][0]{
        comments[]->{
          _id,
          comment,
          _createdAt,
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
          }
        }
      }
    `;

    try {
      const response = await sanityClient.fetch(query, params);
      return response.comments;

    } catch (error) {
      console.error('Error fetching comments: ', error);
      throw error;
    }

  }
);

export const pinSlice = createSlice({
    name: 'pin',
    initialState: INITIAL_STATE,
    reducers: {
        setCurrentPin: (state, action) => {
            state.pin = action.payload;
        },

        setCurrentComments: (state, action) => {
            state.comments = action.payload;
        },

        addComment: (state, action) => {
          const previousComments = [...state.comments];
          const newComment = action.payload;
          return { 
            ...state, 
            comments: [...previousComments, newComment] 
          }
        },

        deleteComment: (state, action) => {
          const commentIdToDelete = action.payload; 
          return {
              ...state,
              comments: state.comments.filter(comment => comment._id !== commentIdToDelete)
          };
        }
    },
    extraReducers: (builder) => {
        builder.addCase(savePin.pending, (state) => {
          state.isLoading = true
        })
        builder.addCase(savePin.fulfilled, (state, action) => {
          state.isLoading = false
          state.message = action.payload
        })
        builder.addCase(savePin.rejected, (state, action) => {
          state.isLoading = false
          state.error = action.error.message
        })

        builder.addCase(fetchPin.pending, (state) => {
          state.isLoading = true
        })
        builder.addCase(fetchPin.fulfilled, (state, action) => {
          state.isLoading = false
          state.pin = action.payload
        })
        builder.addCase(fetchPin.rejected, (state, action) => {
          state.isLoading = false
          state.error = action.error.message
        })

        builder.addCase(fetchPinComments.pending, (state) => {
          state.isLoading = true
        })
        builder.addCase(fetchPinComments.fulfilled, (state, action) => {
          state.isLoading = false
          state.comments = action.payload
        })
        builder.addCase(fetchPinComments.rejected, (state, action) => {
          state.isLoading = false
          state.error = action.error.message
        })

        builder.addCase(deletePin.pending, (state) => {
          state.isLoading = true
        })
        builder.addCase(deletePin.fulfilled, (state, action) => {
          state.isLoading = false
          state.message = action.payload
        })
        builder.addCase(deletePin.rejected, (state, action) => {
          state.isLoading = false
          state.error = action.error.message
        })
      },
});

export const { setCurrentPin, setCurrentComments, addComment, deleteComment } = pinSlice.actions;

export const pinReducer = pinSlice.reducer;

export const selectPin = (state) => state.pin.pin;
export const selectMessage = (state) => state.pin.message;
export const selectIsLoading = (state) => state.pin.isLoading;
export const selectError = (state) => state.pin.error;
export const selectCurrentComments = (state) => state.pin.comments;