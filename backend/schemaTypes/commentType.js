import { defineType, defineField } from 'sanity';

export const commentType = defineType({
    name: 'comment',
    title: 'Comment',
    type: 'document',
    fields: [
        defineField({
            name: 'comment',
            title: 'Comment',
            type: 'string',
            validation: rule => rule.max(500).error('A comment is no longer than 500 characters.'),
        }),
        defineField({
            name: 'postedBy',
            title: 'Posted By',
            type: 'reference',
            to: [{ type: 'user' }]
        }),
    ]
})