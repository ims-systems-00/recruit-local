import { defineType, defineField } from 'sanity';
import { UserIcon } from 'lucide-react';

export const authorType = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role / Designation',
      type: 'string',
      description: 'e.g., CEO & Founder',
    }),
    defineField({
      name: 'avatar',
      title: 'Avatar Image',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
});
