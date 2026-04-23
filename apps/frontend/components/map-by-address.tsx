'use client';

import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
import { getGeocode, getLatLng } from 'use-places-autocomplete';

const libraries: any = ['places'];

type Props = {
  address: string;
};

export default function MapByAddress({ address }: Props) {
  console.log('address', address);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!address || !isLoaded) return;

    const getCoordinates = async () => {
      try {
        const results = await getGeocode({ address });
        const { lat, lng } = await getLatLng(results[0]);

        setLocation({ lat, lng });
      } catch (error) {
        console.error('Geocode error:', error);
      }
    };

    getCoordinates();
  }, [address, isLoaded]);

  if (!isLoaded || !location)
    return (
      <div className="relative">
        <MapSkeleton />
        <span className="absolute bottom-2 right-3 text-label-xs text-text-gray-secondary">
          Loading map...
        </span>
      </div>
    );

  return (
    <div className="h-[126px] rounded-lg border border-border-gray-secondary">
      <GoogleMap
        center={location}
        zoom={14}
        mapContainerClassName="h-full w-full rounded-lg"
        options={{
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        <Marker position={location} />
      </GoogleMap>
    </div>
  );
}

const MapSkeleton = () => {
  return (
    <div className="h-[126px] w-full rounded-lg overflow-hidden border border-border-gray-secondary">
      <div className="h-full w-full animate-pulse bg-gray-200 relative">
        {/* Fake map grid effect */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px)] bg-size-[40px_40px]" />
      </div>
    </div>
  );
};
