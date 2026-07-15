import { defineField, defineType } from "sanity";

export const productType = defineType({
  name: "product",
  title: "Products",
  type: "document",
  fields: [
    {
      name: "order",
      title: "Order Priority",
      type: "number",
      description: "Lower numbers appear first (e.g., 1, 2, 3)",
    },
    defineField({ name: "name", type: "string", title: "Product Name" }),
    defineField({ name: "title", type: "string", title: "Main Title" }),
    defineField({
      name: "signup",
      type: "string",
      title: "Sign Up Button Link",
    }),
    defineField({ name: "slug", type: "slug", options: { source: "title" } }),
    defineField({
      name: "description",
      type: "text",
      title: "Header Description",
    }),
    defineField({
      name: "mainVideo",
      type: "url",
      title: "Video URL (YouTube/Vimeo)",
    }),
    defineField({
      name: "mainThumbnail",
      type: "image",
      options: { hotspot: true },
    }),

    defineField({
      name: "logo",
      type: "image",
      title: "Product Logo",
      options: { hotspot: true },
    }),

    defineField({
      name: "overview",
      type: "object",
      title: "Overview Section",
      fields: [
        { name: "title", type: "string" },
        { name: "description", type: "text" },
        {
          name: "whoIsFor",
          type: "array",
          title: "Who is it for?",
          of: [{ type: "string" }],
        },
        {
          name: "problemSolved",
          type: "array",
          title: "Problems we solve",
          of: [{ type: "string" }],
        },
      ],
    }),

    defineField({
      name: "standards",
      type: "array",
      title: "Standard Supports (ISO Tags)",
      description: "Optional section for ISO standards names",
      of: [{ type: "string" }],
    }),

    defineField({
      name: "features",
      type: "array",
      title: "Key Features Grid",
      of: [
        {
          type: "object",
          name: "featureCard",
          fields: [
            { name: "title", type: "string" },
            { name: "description", type: "text" },
            { name: "icon", type: "image" },
          ],
        },
      ],
    }),

    defineField({
      name: "body",
      type: "array",
      title: "Additional Mixed Content",
      of: [
        { type: "block" },
        { type: "image" },
        {
          type: "object",
          name: "button",
          title: "Sign Up Button",
          fields: [
            { name: "text", type: "string" },
            { name: "url", type: "url" },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "name",
      // subtitle: "title",
      media: "logo",
    },
  },
});
