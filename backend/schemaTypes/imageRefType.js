import { defineType, defineField } from 'sanity';

export const imageRefType = defineType({
    name: 'imageRef',
    title: 'Image Reference',
    type: 'object',
    fields: [
        defineField({
            name: 'assetId',
            title: 'Asset ID',
            type: 'string',  // Storing the asset ID directly
        }),
    ],
})