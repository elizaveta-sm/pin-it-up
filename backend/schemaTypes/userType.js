import { defineType, defineField } from 'sanity';

export const userType = defineType({
    name: 'user',
    title: 'User',
    type: 'document',
    fields: [
        defineField({
            name: 'email',
            title: 'Email',
            type: 'string',
        }),
        defineField({
            name: 'username',
            title: 'Username',
            type: 'string',
        }),
        defineField({
            name: 'firstName',
            title: 'First Name',
            type: 'string'
        }),
        defineField({
            name: 'lastName',
            title: 'Last Name',
            type: 'string'
        }),
        defineField({
            name: 'photo',
            title: 'Photo',
            type: 'image',
        }),
        defineField({
            name: 'savedPins',
            title: 'Saved Pins',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'pin' }] }],
        }),
        defineField({
            name: 'createdPins',
            title: 'Created Pins',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'pin' }] }],
        }),
    ]
})