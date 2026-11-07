import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Place } from '../types';

type Props = {
  places: Place[];
  selectedPlace: Place | null;
  onSelect: (place: Place) => void;
};

// Región inicial: Colón, Entre Ríos
const COLON: Region = {
  latitude: -32.2241,
  longitude: -58.1411,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export default function PlacesMap({ places, selectedPlace, onSelect }: Props) {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // Pedir permiso de ubicación
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (e) {
        console.warn('No se pudo pedir el permiso de ubicación', e);
      }
    })();
  }, []);

  // Encuadrar los pines cuando el mapa está listo o cambia el filtro
  useEffect(() => {
    if (!mapReady || places.length === 0) return;
    mapRef.current?.fitToCoordinates(
      places.map((p) => ({
        latitude: p.coordinates.latitude,
        longitude: p.coordinates.longitude,
      })),
      { edgePadding: { top: 80, right: 40, bottom: 160, left: 40 }, animated: true }
    );
  }, [places, mapReady]);

  // Centrar la cámara en el lugar seleccionado
  useEffect(() => {
    if (!mapReady || !selectedPlace) return;
    mapRef.current?.animateToRegion(
      {
        latitude: selectedPlace.coordinates.latitude,
        longitude: selectedPlace.coordinates.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      600
    );
  }, [selectedPlace?.id, mapReady]);

  const handleReady = useCallback(() => setMapReady(true), []);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={COLON}
      onMapReady={handleReady}
      showsUserLocation={hasPermission}
      showsMyLocationButton={hasPermission}
    >
      {places.map((p) => {
        const isSel = selectedPlace?.id === p.id;
        return (
          <Marker
            key={p.id}
            coordinate={{
              latitude: p.coordinates.latitude,
              longitude: p.coordinates.longitude,
            }}
            title={p.title}
            description={p.address}
            pinColor={isSel ? '#4F46E5' : '#EF4444'}
            onPress={() => onSelect(p)}
          />
        );
      })}
    </MapView>
  );
}