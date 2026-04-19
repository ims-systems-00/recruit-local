'use client';

import { Label } from '@/components/ui/label';
import { Controller } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '@/components/ui/combobox';

import { QUERY_TYPE_ENUMS } from '@rl/types';
import { QueryCard } from '@/app/(authenticated)/(recruiter)/recruiter/job/[uid]/edit/steps/additional-queries';

export default function AdditionalQueryField({
  card,
  index,
  control,
}: {
  card: Partial<QueryCard>;
  index: number;
  control: any;
}) {
  return (
    <div className="space-y-2">
      {/* Label */}
      <Label>
        {card.question}
        {card.isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {/* PARAGRAPH */}
      {card.type === QUERY_TYPE_ENUMS.PARAGRAPH && (
        <Controller
          control={control}
          name={`answers.${index}.answer`}
          render={({ field }) => (
            <textarea
              {...field}
              placeholder="Write your thoughts here"
              className="w-full h-24 border rounded-lg px-3 py-2"
            />
          )}
        />
      )}

      {/* SHORT ANSWER */}
      {card.type === QUERY_TYPE_ENUMS.SHORT_ANSWER && (
        <Controller
          control={control}
          name={`answers.${index}.answer`}
          render={({ field }) => (
            <input
              {...field}
              placeholder="Write your thoughts here"
              className="w-full h-10 border rounded-lg px-3"
            />
          )}
        />
      )}

      {/* SINGLE CHOICE */}
      {card.type === QUERY_TYPE_ENUMS.SINGLE_CHOICE && (
        <Controller
          control={control}
          name={`answers.${index}.answer`}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>

              <SelectContent>
                {card.options?.map((opt: any) => (
                  <SelectItem key={opt.id} value={opt.text}>
                    {opt.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      )}

      {/* MULTIPLE CHOICE */}
      {card.type === QUERY_TYPE_ENUMS.MULTIPLE_CHOICE && (
        <Controller
          control={control}
          name={`answers.${index}.answer`}
          render={({ field }) => (
            <Combobox
              multiple
              items={card.options || []}
              value={field.value || []}
              onValueChange={field.onChange}
            >
              <ComboboxChips className="w-full min-h-10 border rounded-lg px-2">
                <ComboboxValue>
                  {(values: string[]) => (
                    <>
                      {values.map((value) => (
                        <ComboboxChip key={value}>{value}</ComboboxChip>
                      ))}
                      <ComboboxChipsInput
                        placeholder={!values.length ? 'Select options' : ''}
                      />
                    </>
                  )}
                </ComboboxValue>
              </ComboboxChips>

              <ComboboxContent>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.id} value={item.text}>
                      {item.text}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          )}
        />
      )}
    </div>
  );
}
