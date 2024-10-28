import { defineType, defineField } from 'sanity';

export const pinType = defineType({
    name: 'pin',
    title: 'Pin',
    type: 'document',
    fields: [
        defineField({
            name: 'image',
            title: 'Image',
            type: 'image',
            validation: rule => rule.required(),
        }),
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: rule => rule.max(50).error('A title is no longer than 50 characters.'),
        }),
        defineField({
            name: 'about',
            title: 'About',
            type: 'string',
            validation: rule => rule.max(500).error('A description is no longer than 500 characters.'),
        }),
        defineField({
            name: 'categories',
            title: 'Categories',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'category' }] }],
        }),
        defineField({
            name: 'postedBy',
            title: 'Posted By',
            type: 'reference',
            to: [{ type: 'user' }]
        }),
        defineField({
            name: 'comments',
            title: 'Comments',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'comment' }] }],
        }),
        defineField({
            name: 'savedBy',
            title: 'Saved By',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'user' }] }],
        }),
    ]
})