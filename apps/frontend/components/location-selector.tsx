'use client';

import { useEffect, useState } from 'react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import { useLoadScript } from '@react-google-maps/api';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { MapPinIcon } from 'lucide-react';

export type LocationValue = {
  lat: number;
  lng: number;
  address: string;
};

type LocationSelectorProps = {
  onSelectLocation: (location: LocationValue) => void;
  defaultValue?: string;
};

const libraries: any = ['places'];

export default function LocationSelector({
  onSelectLocation,
  defaultValue = '',
}: LocationSelectorProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <PlacesAutocomplete
      onSelectLocation={onSelectLocation}
      defaultValue={defaultValue}
    />
  );
}

type PlacesAutocompleteProps = {
  onSelectLocation: (location: LocationValue) => void;
  defaultValue?: string;
};

function PlacesAutocomplete({
  onSelectLocation,
  defaultValue,
}: PlacesAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>('');

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
    defaultValue,
  });

  useEffect(() => {
    if (defaultValue) {
      setSelected(defaultValue);
      setValue(defaultValue, false);
    }
  }, [defaultValue]);

  const handleSelect = async (address: string) => {
    setSelected(address);
    setValue(address, false);
    clearSuggestions();
    setOpen(false);

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);

      onSelectLocation({ lat, lng, address });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            ' px-spacing-lg justify-start h-10! w-full rounded-lg shadow-xs border-border-gray-primary text-text-gray-quaternary',
            selected && ' text-text-gray-primary',
          )}
        >
          <span>
            <MapPinIcon className=" text-fg-gray-tertiary" />
          </span>
          {selected || 'Search address...'}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-spacing-2xl bg-white min-w-[360px] max-w-[360px]">
        <Command>
          <CommandInput
            placeholder="Search address..."
            value={value}
            onValueChange={(val) => setValue(val)}
            disabled={!ready}
            className=" placeholder:text-text-gray-quaternary text-text-gray-primary"
          />

          <CommandList className=" gap-y-spacing-xl mt-spacing-sm">
            {status === 'OK' &&
              data.map((place) => (
                <CommandItem
                  key={place.place_id}
                  value={place.description}
                  onSelect={() => handleSelect(place.description)}
                  className=" cursor-pointer hover:text-text-gray-primary"
                >
                  {place.description}
                </CommandItem>
              ))}

            {status !== 'OK' && <CommandEmpty>No results found.</CommandEmpty>}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
