/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export enum BuildingType {
  None = 'None',
  Road = 'Road',
  Residential = 'Residential',
  Commercial = 'Commercial',
  Industrial = 'Industrial',
  Park = 'Park',
  Mosque = 'Mosque',
  BigHouse = 'BigHouse',
  Hospital = 'Hospital',
  Skyscraper = 'Skyscraper',
  PowerPlant = 'PowerPlant',
  Kost = 'Kost',
  Laundry = 'Laundry',
  Apotek = 'Apotek',
  Bengkel = 'Bengkel',
  WarungMakan = 'WarungMakan',
  Sekolah = 'Sekolah',
  Universitas = 'Universitas',
}

export interface BuildingConfig {
  type: BuildingType;
  cost: number;
  name: string;
  description: string;
  color: string; // Main color for 3D material
  popGen: number; // Population generation per tick
  incomeGen: number; // Money generation per tick
  width?: number; // width in tiles (default 1)
  depth?: number; // depth in tiles (default 1)
}

export enum BuildingStatus {
  Normal = 'Normal',
  Fire = 'Fire',
  Robbed = 'Robbed',
  TheftCooldown = 'TheftCooldown',
}

export interface TileData {
  x: number;
  y: number;
  buildingType: BuildingType;
  isOrigin?: boolean; // For multi-tile buildings, marks the main tile
  parentTile?: {x: number, y: number}; // Reference to origin tile
  // Suggested by AI for visual variety later
  variant?: number;
  status?: BuildingStatus;
  statusExpiry?: number; // When status expires (used for cooldowns)
}

export type Grid = TileData[][];

export interface CityStats {
  money: number;
  population: number;
  day: number;
  reputation: number;
}

export interface NewsItem {
  id: string;
  text: string;
  type: 'positive' | 'negative' | 'neutral' | 'info';
}