import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { POI } from '../lib/poiData';
import { COLORS } from '../lib/constants';
import LocationIcon from '../../assets/location.svg';

interface LocationCardProps {
  poi: POI;
  onAddToItinerary: () => void;
  onClose: () => void;
}

export default function LocationCard({ poi, onAddToItinerary, onClose }: LocationCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{poi.poiName}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <LocationIcon width={16} height={16} fill={COLORS.primary} />
          <Text style={styles.infoText}>
            {poi.lat.toFixed(4)}, {poi.long.toFixed(4)}
          </Text>
        </View>
        
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{poi.theme}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.addButton} onPress={onAddToItinerary}>
        <Text style={styles.addButtonText}>Add to Itinerary</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    flex: 1,
  },
  closeButton: {
    fontSize: 32,
    color: COLORS.gray[500],
    paddingLeft: 8,
  },
  content: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  icon: {
    width: 16,
    height: 16,
    tintColor: COLORS.primary,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  categoryBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
