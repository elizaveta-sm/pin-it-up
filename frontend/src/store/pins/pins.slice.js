import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { sanityClient } from "../../config/sanity-client";
import { createPattern } from "../../utils/create-pattern";

const INITIAL_STATE = {
    pins: null,
    pinResults: null,
    recommendedPinsById: {},
    areLoading: false,
    error: null,
};

const fetchPinsQuery = `*[_type == "pin"] | order(_createdAt desc){
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
    imageRefs[]{
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

export const fetchPins = createAsyncThunk(
    'pins/fetchPins',
    async () => {
      try {
        const response = await sanityClient.fetch(fetchPinsQuery)  
        return response;

      } catch (error) {
        console.error('Error fetching pins:', error)
      }
    }
);

const recommendationsQuery = `*[_type == "pin" && _id != $currentPinId && (
  (defined($titlePattern) && $titlePattern in title) || 
  (defined($descriptionPattern) && about match $descriptionPattern) || 
  (defined($categoriesPattern) && $categoriesPattern match categories[]->name)
)]{
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
  savedBy[]->{
    _id
  }
}`;

export const fetchRecommendedPins = createAsyncThunk(
  'pins/fetchRecommendedPins',
  async (args, { getState }) => {
    const { recommendedPinsById } = getState().pins;
    const currentPinId = args._id;
    console.log('recommended pins by id in the redux state: ', recommendedPinsById)

    // Check if the recommendations for this pin already exist in cache
    if (recommendedPinsById[currentPinId]) {
      // If cached, return the cached data
      console.log('returning cached recommendations...')
      return { currentPinId, recommendedPins: recommendedPinsById[currentPinId] };
    }

    const currentTitle = args.title || '';
    const currentAbout = args.about || '';
    const categories = args.categories || [];
    const currentCategories = categories.map(category => `${category.name.toLowerCase()}*`);

    const titlePattern = currentTitle ? createPattern(currentTitle) : "undefined";
    const descriptionPattern = currentAbout ? createPattern(currentAbout) : "undefined";
    const categoriesPattern = currentCategories.length ? currentCategories : "undefined";

    // console.log('title pattern: ', titlePattern)
    // console.log('about pattern: ', descriptionPattern)
    // console.log('categories pattern: ', categoriesPattern)

    // Prepare parameters
    const params = {
      currentPinId,
      titlePattern,
      descriptionPattern,
      categoriesPattern
    };

    // console.log('params: ', params)

    try {
      const recommendedPins = await sanityClient.fetch(recommendationsQuery, params);
      console.log('Recommended pins in the async thunk: ', recommendedPins);

      return { currentPinId, recommendedPins };
    } catch (error) {
      console.error('Error fetching recommended pins:', error);
      return [];
    }
  }
);
 
const searchQuery = `*[_type == "pin" && (
  title match $keyword || 
  about match $keyword || 
  categories[]->name match $keyword
)]{
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
  comments[]{
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
    _id,
  }
}`;

export const searchPins = createAsyncThunk(
  'pins/searchPins',
  async (keyword) => {
    try {
      const params = { keyword: `${keyword}*` };
      const results = await sanityClient.fetch(searchQuery, params);

      console.log('Search results:', results);
      return results;

    } catch (error) {
      console.error('Error searching pins:', error)
    }
  }
)

export const pinsSlice = createSlice({
    name: 'pins',
    initialState: INITIAL_STATE,
    reducers: {
      setPinResults: (state, action) => state.pinResults = action.payload,
      clearAllRecommendedPins: (state) => {
        state.recommendedPinsById = {};
      },

      addPin: (state, action) => {
        const previousPins = [...state.pins];
        const newPin = action.payload;
        return { 
          ...state, 
          pins: [...previousPins, newPin] 
        }
      },

      updatePins: (state, action) => {
        const updatedPin = action.payload;

        const updatedPins = state.pins.map(pin => 
          pin._id === updatedPin._id ? { ...pin, ...updatedPin } : pin
        );
        console.log('updated pins: ', updatedPins)
  
        return {
          ...state,
          pins: updatedPins,
        };
      },
      
      deletePin: (state, action) => {
        console.log('deleted pin: ', action.payload)
        const deletedPinId = action.payload._id 
        const updatedPins = state.pins.filter(pin => pin._id !== deletedPinId);
        console.log('updated pins: ', updatedPins)
  
        return {
          ...state,
          pins: updatedPins,
        }
      },


    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchPins.pending, (state) => {
          state.areLoading = true;
        })
        .addCase(fetchPins.fulfilled, (state, action) => {
          state.areLoading = false;
          state.pins = action.payload;
        })
        .addCase(fetchPins.rejected, (state, action) => {
          state.areLoading = false;
          state.error = action.error.message;
        })
        
        .addCase(searchPins.pending, (state) => {
          state.areLoading = true;
        })
        .addCase(searchPins.fulfilled, (state, action) => {
          state.areLoading = false;
          state.pinResults = action.payload;
        })
        .addCase(searchPins.rejected, (state, action) => {
          state.areLoading = false;
          state.error = action.error.message;
        })

        .addCase(fetchRecommendedPins.pending, (state) => {
          state.areLoading = true;
        })
        .addCase(fetchRecommendedPins.fulfilled, (state, action) => {
          state.areLoading = false;
          const { currentPinId, recommendedPins } = action.payload;
          state.recommendedPinsById[currentPinId] = recommendedPins;
        })
        .addCase(fetchRecommendedPins.rejected, (state, action) => {
          state.areLoading = false;
        })
    },
});

export const { setPinResults, clearAllRecommendedPins, addPin, updatePins, deletePin } = pinsSlice.actions;

export const pinsReducer = pinsSlice.reducer;

export const selectPins = (state) => state.pins.pins;
export const selectPinResults = (state) => state.pins.pinResults;
export const selectPinsAreLoading = (state) => state.pins.areLoading;
export const selectPinsError = (state) => state.pins.error;