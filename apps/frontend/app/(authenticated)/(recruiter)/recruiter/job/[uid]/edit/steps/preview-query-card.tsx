import { Label } from '@/components/ui/label';
import { QueryCard } from './additional-queries';
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
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { QUERY_TYPE_ENUMS } from '@rl/types';

export default function PreviewQueryCard({ card }: { card: QueryCard }) {
  const multipleChoiceAnchor = useComboboxAnchor();

  return (
    <div className="space-y-spacing-xs">
      {/* Label */}
      <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
        {card.question}{' '}
        {card.isRequired && (
          <span className=" text-text-brand-secondary">*</span>
        )}
      </Label>

      {/* Field Preview */}
      {card.type === QUERY_TYPE_ENUMS.PARAGRAPH && (
        <textarea
          disabled
          placeholder="Write your thoughts here"
          className="w-full text-label-md border border-border-gray-secondary  rounded-lg px-spacing-lg py-spacing-sm text-text-gray-primary placeholder:text-text-gray-quaternary resize-none outline-none focus:border-border-brand-primary focus:ring-1 focus:ring-border-brand-primary h-24"
        />
      )}

      {card.type === QUERY_TYPE_ENUMS.SHORT_ANSWER && (
        <input
          disabled
          placeholder="Write your thoughts here"
          className="w-full text-label-md h-10 border border-border-gray-secondary  rounded-lg px-spacing-lg py-spacing-sm text-text-gray-primary placeholder:text-text-gray-quaternary  outline-none focus:border-border-brand-primary focus:ring-1 focus:ring-border-brand-primary"
        />
      )}

      {card.type === QUERY_TYPE_ENUMS.SINGLE_CHOICE && (
        <Select>
          <SelectTrigger className="h-10! w-full rounded-lg shadow-xs border-border-gray-primary data-placeholder:text-text-gray-quaternary text-text-gray-secondary text-label-md">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent className=" bg-white">
            {card.options.map((opt: any) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {card.type === QUERY_TYPE_ENUMS.MULTIPLE_CHOICE && (
        <Combobox multiple items={card.options} autoHighlight>
          <ComboboxChips
            ref={multipleChoiceAnchor}
            className="w-full focus-within:ring-0! min-h-10! rounded-lg shadow-xs border-border-gray-primary data-placeholder:text-text-gray-quaternary text-text-gray-primary text-label-md font-label-md-strong!"
          >
            <ComboboxValue>
              {(values: string[]) => (
                <>
                  {values.map((value) => (
                    <ComboboxChip
                      key={value}
                      className={' capitalize bg-bg-gray-soft-secondary'}
                    >
                      {value}
                    </ComboboxChip>
                  ))}

                  <ComboboxChipsInput
                    placeholder={!values.length ? 'Eg. Sunday' : ''}
                  />
                </>
              )}
            </ComboboxValue>
          </ComboboxChips>

          <ComboboxContent
            anchor={multipleChoiceAnchor}
            className={'bg-white ring-border-gray-primary! max-w-[350px]'}
          >
            <ComboboxEmpty>No items found.</ComboboxEmpty>
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
    </div>
  );
}
