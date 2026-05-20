import DraftEditor from '@/components/draft-editor/draft-editor';
import { defineType, defineField, defineArrayMember } from 'sanity';

export const blogType = defineType({
  name: 'blog',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'date',
      title: 'Publish Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
    }),
    defineField({
      name: 'title',
      title: 'Blog Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: (input) =>
          input
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .split('-')
            .slice(0, 6)
            .join('-'),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Short Description',
      type: 'text',
      rows: 3,
      description: 'A brief summary of the blog post.',
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'thumbnailDescription',
          title: 'Hover Text (Thumbnail Description)',
          type: 'string',
          description:
            'Optional: Text that appears when hovering over the thumbnail.',
        }),
      ],
    }),

    defineField({
      name: 'content',
      title: 'Flexible Content Blocks',
      description: 'Add and rearrange sections to build your blog post.',
      type: 'array',
      of: [
        // defineArrayMember({
        //   title: "Rich Text",
        //   type: "block",
        // }),
        defineArrayMember({
          name: 'classicEditor',
          title: 'Text',
          type: 'object',
          fields: [
            defineField({
              name: 'htmlString',
              title: 'Write your text here',
              type: 'text',
              components: {
                input: DraftEditor,
              },
            }),
          ],
          preview: {
            select: {
              htmlContent: 'htmlString', // Grab the HTML string from the field above
            },
            prepare(selection) {
              const { htmlContent } = selection;

              if (!htmlContent) {
                return { title: 'Text Block', subtitle: 'Empty' };
              }

              // Use a simple Regex to strip out all HTML tags (like <p>, <strong>, etc.)
              const plainText = htmlContent.replace(/<[^>]+>/g, '');

              // Truncate the text so it doesn't take up too much space in the list
              const truncated =
                plainText.length > 50
                  ? plainText.slice(0, 50) + '...'
                  : plainText;

              return {
                title: 'Text Block',
                subtitle: truncated,
              };
            },
          },
        }),

        defineArrayMember({
          name: 'youtubeVideo',
          title: 'YouTube Video',
          type: 'object',
          fields: [
            defineField({
              name: 'url',
              title: 'YouTube URL',
              type: 'url',
              description: 'Paste the YouTube video link here.',
              validation: (Rule) =>
                Rule.uri({
                  scheme: ['http', 'https'],
                }),
            }),
          ],
        }),

        defineArrayMember({
          name: 'quoteCard',
          title: 'Quote Card',
          type: 'object',
          fields: [
            defineField({
              name: 'personImage',
              title: 'Person Image',
              type: 'image',
              options: { hotspot: true },
            }),
            defineField({
              name: 'quote',
              title: 'Main Quote',
              type: 'text',
              rows: 4,
            }),
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
            }),
            defineField({
              name: 'designation',
              title: 'Designation',
              type: 'string',
              description: 'e.g., CEO of XYZ',
            }),
          ],
        }),

        // defineArrayMember({
        //   name: "additionalText",
        //   title: "Additional Text Block",
        //   type: "object",
        //   fields: [
        //     defineField({
        //       name: "text",
        //       title: "Text Content",
        //       type: "text",
        //     }),
        //   ],
        // }),

        // defineArrayMember({
        //   name: "subHeadingSection",
        //   title: "Sub-Heading & Text",
        //   type: "object",
        //   fields: [
        //     defineField({
        //       name: "subHeading",
        //       title: "Sub Heading",
        //       type: "string",
        //     }),
        //     defineField({
        //       name: "bodyText",
        //       title: "Corresponding Text",
        //       type: "text",
        //     }),
        //   ],
        // }),
      ],
    }),
  ],
});
