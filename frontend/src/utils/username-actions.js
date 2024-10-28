import { checkUsernameInSanity } from "./check-username-in-sanity";
import { v4 as uuidv4 } from 'uuid';

export const convertDisplayNameToUsername = async (displayName) => {

    if (typeof displayName !== 'string') {
        console.error('Invalid displayName: ', displayName);
        throw new Error('Display name must be a string');
    }

    // Trim any leading or trailing spaces, replace spaces with hyphens, and convert to lowercase
    const baseUsername = displayName.trim().replace(/\s+/g, '-').toLowerCase();
    // replaces all spaces (including multiple spaces) with hyphens. The \s+ is a regular expression that matches one or more whitespace characters, and the g flag indicates a global search, meaning all matches in the string will be replaced.
    
    let username = baseUsername;

    const verifyUsername = async (username) => {
        try {
            const response = await checkUsernameInSanity(username);
        
            if (response.requestStatus === 'success') {
                // if username doesnt exist -> return true
                return !response.usernameExists 
                
            } else if (response.requestStatus === 'error') {
                console.error(response.error);
                return false
            } 
        } catch (error) {
            console.error('There was an error verifying the username: ', error)
        }
    };
    
    // Check if the username exists and modify it until a unique username is found
    while (!await verifyUsername(username)) {
        username = `${baseUsername}-${uuidv4().substring(0, 4)}`;
    }

    console.log('convert function returns: ', username)
    return username;
};

export const splitDisplayName = (displayName) => {
    const nameParts = displayName.trim().split(/\s+/);
    
    let firstName = "";
    let lastName = "";
    
    // If there's no space in displayName -> displayName is firstName 
    if (nameParts.length === 1) {
      firstName = nameParts[0];
    } else if (nameParts.length > 1) {
      firstName = nameParts[0];
      lastName = nameParts[1];
    }
    
    return { firstName, lastName };
};

export const convertUsernameToDisplayName = (username) => {
    const usernameParts = username.split('-');
    console.log(usernameParts)

    // the array has only one element -> there were no hyphens
    if (usernameParts.length === 1) {
        // Capitalize the first letter of the username
        return username.charAt(0).toUpperCase() + username.slice(1);
    }

    // Capitalize the first letter of each part and join them with a space
    const displayName = usernameParts
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

    return displayName;
};

export const getFirstLetterOfUsername = (username) => {
    let firstChar = username.charAt(0);

    const regex = /\d/;
    // Check if 1st char is a digit
    if (regex.test(firstChar)) { 
        // Find the first letter
        for (let i = 1; i < username.length; i++) {
            if (!regex.test(username.charAt(i))) {
                firstChar = username.charAt(i);
                break;
            }
        }
    }

    return firstChar.toUpperCase();
};

export const getUserNameObject = (displayName, username) => {
    if (displayName) {
        return splitDisplayName(displayName);
    }
    // return splitDisplayName(convertDisplayNameToUsername(username));
    return splitDisplayName(convertUsernameToDisplayName(username));
};

export const isValidUsername = (username) => {
    // ^[a-zA-Z]+     : starts with one or more letters
    // (-[a-zA-Z]+)*$ : followed by zero or more occurrences of '-' followed by one or more letters, until the end
    const regex = /^[a-zA-Z]+(-[a-zA-Z]+)*$/;
    
    return regex.test(username);
};