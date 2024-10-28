import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { sanityClient } from "../../config/sanity-client";

const INITIAL_STATE = {
    categories: null,
    isLoading: false,
    error: null,
};

const fetchCategoriesQuery = `*[_type == "category"]{
  _id,
  name,
  imageRefs[] {
    assetId
  }
}`;

export const fetchCategories = createAsyncThunk(
    'categories/fetchCategories',
    async () => {
      try {
        console.log('Fetching categories from sanity...')
        
        const response = await sanityClient.fetch(fetchCategoriesQuery);
        return response;
        
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
);

export const deleteCategoryIfEmpty = createAsyncThunk('categories/deleteCategoryIfEmpty', async (categoryId) => {
  try {
      const category = await sanityClient.fetch(
        `*[_type == "category" && _id == $categoryId][0]`
      , { categoryId });

      if (!category?.imageRefs?.length) {
          console.log(`Deleting category ${category.name} from Sanity...`);
          await sanityClient.delete(categoryId);
          return categoryId;
      }

  } catch (error) {
      console.error('Error deleting category:', error);
  }
});

export const categoriesSlice = createSlice({
    name: 'categories',
    initialState: INITIAL_STATE,

    reducers: {
      addCategory: (state, action) => {
        const previousCategories = [...state.categories];
        const newCategory = action.payload;
        return { 
          ...state, 
          categories: [...previousCategories, newCategory] 
        }
      },

      updateCategories: (state, action) => {
        const updatedCategory = action.payload;

        const updatedCategories = state.categories.map(category => 
          category._id === updatedCategory._id ? { ...category, ...updatedCategory } : category
        );
        console.log('updated categories: ', updatedCategories)
  
        return {
          ...state,
          categories: updatedCategories,
        };
      },
      
      deleteCategory: (state, action) => {
        console.log('deleted category: ', action.payload)
        const deletedCategoryId = action.payload._id 
        const updatedCategories = state.categories.filter(category => category._id !== deletedCategoryId);
        console.log('updated categories: ', updatedCategories)
  
        return {
          ...state,
          categories: updatedCategories,
        }
      },

    },

    extraReducers: (builder) => {
        builder.addCase(fetchCategories.pending, (state) => {
          state.isLoading = true
        })
        builder.addCase(fetchCategories.fulfilled, (state, action) => {
          state.isLoading = false
          state.categories = action.payload
        })
        builder.addCase(fetchCategories.rejected, (state, action) => {
          state.isLoading = false
          state.error = action.error.message
        })

        builder.addCase(deleteCategoryIfEmpty.fulfilled, (state, action) => {
            // Remove the category from state if it was deleted
            state.categories = state.categories.filter(category => category._id !== action.payload);
        })
      },
});

export const { addCategory, updateCategories, deleteCategory } = categoriesSlice.actions;

export const categoriesReducer = categoriesSlice.reducer;

export const selectCategories = (state) => state.categories.categories;
export const selectCategoriesAreLoading = (state) => state.categories.isLoading;
export const selectCategoriesError = (state) => state.categories.error;