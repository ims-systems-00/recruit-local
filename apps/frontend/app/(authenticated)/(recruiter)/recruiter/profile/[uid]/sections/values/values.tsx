'use client';
import { Brain, Layers2, Star, Target, Users } from 'lucide-react';
import React, { useCallback, useState, useEffect } from 'react';
import { TenantData } from '@/services/tenants/tenants.type';
import { VALUE_TYPE_ENUM } from '@rl/types';
import ValueItem from './value-item';

const VALUE_LIST = [
  {
    id: '1',
    name: 'Working Style',
    icon: <Layers2 className="size-5 text-fg-gray-secondary" />,
    title: 'How you approach growth, learning, challenges, and innovation?',
    placeholder: 'Search your working style...',
    type: VALUE_TYPE_ENUM.WORKING_STYLE,
  },
  {
    id: '2',
    name: 'Mindset',
    icon: <Brain className="size-5 text-fg-gray-secondary" />,
    title:
      'How you prefer to work, communicate, organise, and contribute within a team or environment?',
    placeholder: 'Search your mindset...',
    type: VALUE_TYPE_ENUM.MINDSET,
  },
  {
    id: '3',
    name: 'Culture and Behavior',
    icon: <Users className="size-5 text-fg-gray-secondary" />,
    title:
      'The interpersonal, ethical, and social values that matter most to you in a workplace?',
    placeholder: 'Search your culture and behavior...',
    type: VALUE_TYPE_ENUM.CULTURE_AND_BEHAVIOR,
  },
  {
    id: '4',
    name: 'Leadership',
    icon: <Star className="size-5 text-fg-gray-secondary" />,
    title:
      'How you prefer teams to operate and how leadership supports performance, development, and collaboration?',
    placeholder: 'Search your leadership...',
    type: VALUE_TYPE_ENUM.LEADERSHIP,
  },
  {
    id: '5',
    name: 'Purpose & Motivation',
    icon: <Target className="size-5 text-fg-gray-secondary" />,
    title:
      'What motivates you professionally and what gives your work meaning and fulfilment?',
    placeholder: 'Search your purpose and motivation...',
    type: VALUE_TYPE_ENUM.MOTIVATION,
  },
];

export default function Values({ profile }: { profile: TenantData }) {
  // const values = profile.values;

  const [values, setValues] = useState(profile.values ?? []);

  // Sync when the server prop changes (e.g. after router.refresh())
  useEffect(() => {
    setValues(profile.values ?? []);
  }, [profile.values]);

  const getFilteredValues = useCallback(
    (type: VALUE_TYPE_ENUM) => {
      return values?.filter((v) => v.type === type);
    },
    [values],
  );

  return (
    <>
      <div className=" space-y-spacing-4xl">
        <div className=" flex justify-between items-center">
          <h4 className=" text-text-gray-primary text-label-xl font-label-xl-strong!">
            Values
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-spacing-2xl">
          {VALUE_LIST.map((item) => (
            <ValueItem
              key={item.id}
              name={item.name}
              icon={item.icon}
              title={item.title}
              placeholder={item.placeholder}
              type={item.type}
              values={getFilteredValues(item.type) ?? []}
              existingValues={values ?? []}
              tenantId={profile._id}
              tenantName={profile.name}
              types={[item.type]}
              onSuccess={setValues}
            />
          ))}
        </div>
      </div>
    </>
  );
}
