export const createPattern = (text) => {
    if (!text) return null;

    // removes all characters that are not word characters (\w) or whitespace (\s).
    const cleanedText = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '');

    // splits into words
    const allWords = cleanedText.split(/\s+/); // Using \s+ to handle multiple spaces
    // console.log('all words: ', allWords)

    const commonWords = new Set([
        'the', 'is', 'and', 'or', 'but', 'a', 'an', 'in', 'on', 'at', 
        'by', 'for', 'with', 'about', 'against', 'between', 'into', 
        'through', 'during', 'before', 'after', 'above', 'below', 
        'to', 'from', 'up', 'down', 'of', 'off', 'over', 'under', 
        'again', 'further', 'then', 'once', 'here', 'there', 'when', 
        'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 
        'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 
        'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 
        'can', 'will', 'just', 'don', 'should', 'now', 'it', 'its', 
        'kinda', 'sorta', 'this', 'that', 'i', 'my', 'your', 'their',
        'his', 'her', 
    ]);

    // creates new array only of those words that are not in commonWords and have a length greater than 0
    const keywords = allWords.filter(word => !commonWords.has(word) && word.length > 0);
    // console.log('keywords: ', keywords)

    if (!keywords.length) return null; 

    return keywords.map(keyword => `${keyword}*`);
};