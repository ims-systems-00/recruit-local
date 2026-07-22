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
  useComboboxAnchor,
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
  console.log(card);
  const multipleChoiceAnchor = useComboboxAnchor();
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
              className="w-full h-24 border rounded-lg px-3 py-2 focus:outline-none focus:ring-0"
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
              className="w-full h-10 border rounded-lg px-3 focus:outline-none focus:ring-0"
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
              <SelectTrigger className="min-h-10 h-10 w-full">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>

              <SelectContent className="bg-white">
                {card.options?.map((opt: any, index: number) => (
                  <SelectItem key={index} value={opt}>
                    {opt}
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
              <ComboboxChips
                ref={multipleChoiceAnchor}
                className="w-full min-h-10 border rounded-lg px-2 focus:outline-none focus:ring-0"
              >
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

              <ComboboxContent
                anchor={multipleChoiceAnchor}
                className="bg-white"
              >
                <ComboboxList>
                  {(item: any, index: number) => (
                    <ComboboxItem key={index} value={item}>
                      {item}
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
