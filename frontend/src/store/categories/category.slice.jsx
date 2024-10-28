import { createAsyncThunk, createSlice, nanoid } from "@reduxjs/toolkit";
import { sanityClient } from "../../config/sanity-client";
import { v4 as uuidv4 } from 'uuid';

const INITIAL_STATE = {
    categoryIds: null,
    isLoading: false,
    error: null,
};

export const updateCategory = createAsyncThunk(
    'category/updateCategory',
    async (args, thunkAPI) => {
        const { categoriesArr, imageAsset } = args; 
        const { rejectWithValue } = thunkAPI; 

        try {
            const categoryIds = await Promise.all(
                categoriesArr.map(async (categoryName) => {
    
                    const query = `*[_type == "category" && name == $name][0]`;
                    
                    const name = categoryName.trim();
                    const params = { name };
                
                    // Look for an existing category with the same name
                    const existingCategory = await sanityClient.fetch(query, params);
                    console.log('existing category: ', existingCategory)
                    
                    // Update the existing category with the new image reference
                    if (existingCategory) {
                        console.log(`Updating existing category "${name}"...`)

                        await sanityClient
                            .patch(existingCategory._id)
                            .setIfMissing({ imageRefs: [] })
                            .insert('after', 'imageRefs[-1]', [
                                { 
                                    assetId: imageAsset._id, 
                                    _key: nanoid() 
                                }
                            ])
                            .commit({
                                autoGenerateArrayKeys: true,
                            });
                        
                        return existingCategory._id;

                    } else {
                    // If that category doesn't exist -> create a new one
                        console.log(`Creating new category "${name}"...`);

                        const newCategoryDoc = await sanityClient.create({
                            _type: 'category',
                            _id: uuidv4(),
                            name,
                            imageRefs: [{ 
                                assetId: imageAsset._id, 
                                _key: nanoid(),
                            }],
                        });

                        return newCategoryDoc._id;
                    }
                })
            );
            
            return categoryIds;

        } catch (err) {
            console.error('Error updating categories:', err);
            return rejectWithValue(err.message);
        }

    }
);

export const categorySlice = createSlice({
    name: 'category',
    initialState: INITIAL_STATE,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(updateCategory.pending, (state) => {
          state.isLoading = true
        })
        builder.addCase(updateCategory.fulfilled, (state, action) => {
          state.isLoading = false
          state.categoryIds = action.payload
        })
        builder.addCase(updateCategory.rejected, (state, action) => {
          state.isLoading = false
          state.error = action.error.message
        })
    },
});

export const categoryReducer = categorySlice.reducer;

export const selectCategoryIds = (state) => state.category.categoryIds;
export const selectCategoryIdsIsLoading = (state) => state.category.isLoading;
export const selectCategoryIdsError = (state) => state.category.error;