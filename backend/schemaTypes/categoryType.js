import { defineType, defineField } from 'sanity';

export const categoryType = defineType({
    name: 'category',
    title: 'Category',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
        }),
        defineField({
            name: 'imageRefs',
            title: 'Image References',
            type: 'array',
            of: [{ type: 'imageRef' }], 
        }),
    ]
})