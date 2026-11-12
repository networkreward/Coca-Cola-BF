import { ProductItem } from '../types';

import bottlesImg from '../assets/images/coke_glass_bottles_1789988245951.jpg';
import vendingImg from '../assets/images/coke_vending_machine_1789988268340.jpg';
import warehouseImg from '../assets/images/coke_warehouse_stock_1789988282380.jpg';
import cansImg from '../assets/images/coke_cans_pack_1789988294244.jpg';
import petBottlesImg from '../assets/images/coke_pet_bottles_1790171422952.jpg';
import truckImg from '../assets/images/coke_delivery_truck_1790508697660.jpg';
import coldStorageImg from '../assets/images/coke_cold_storage_1790508712396.jpg';
import truckFleetImg from '../assets/images/coke_truck_fleet_1790508727781.jpg';
import distribCenterImg from '../assets/images/coke_distrib_center_1790508741775.jpg';

export const INITIAL_PRODUCTS: ProductItem[] = [
  { 
    id: 1, 
    packNumber: 1,
    name: 'Pack Découverte', 
    subtitle: 'Distribution locale',
    category: 'BOTTLES',
    categoryLabel: 'Distribution locale',
    description: 'Investissement dans le réseau de distribution locale de canettes et bouteilles Coca-Cola fraîches.',
    price: 6000, 
    daily: 1000, 
    duration: 90, 
    tag: 'PACK 1',
    image: cansImg,
    allocation: 92,
    isVip: false
  },
  { 
    id: 2, 
    packNumber: 2,
    name: 'Pack Essentiel', 
    subtitle: 'Camions de livraison',
    category: 'VENDING',
    categoryLabel: 'Camions de livraison',
    description: 'Participation au déploiement des camions de livraison Coca-Cola pour l’approvisionnement des points de vente.',
    price: 9000, 
    daily: 1500, 
    duration: 90, 
    tag: 'PACK 2',
    image: truckImg,
    allocation: 90,
    isVip: false
  },
  { 
    id: 3, 
    packNumber: 3,
    name: 'Pack Silver', 
    subtitle: 'Chambre froide',
    category: 'VENDING',
    categoryLabel: 'Chambre froide',
    description: 'Financement et maintenance des chambres froides industrielles Coca-Cola assurant la chaîne du froid.',
    price: 15000, 
    daily: 2600, 
    duration: 90, 
    tag: 'PACK 3',
    image: coldStorageImg,
    allocation: 88,
    isVip: false
  },
  { 
    id: 4, 
    packNumber: 4,
    name: 'Pack Bronze', 
    subtitle: 'Stockage & Logistique',
    category: 'STOCKS',
    categoryLabel: 'Stockage & Logistique',
    description: 'Gestion des palettes et du stockage logistique stratégique dans nos grands entrepôts régionaux.',
    price: 30000, 
    daily: 5500, 
    duration: 90, 
    tag: 'PACK 4',
    image: warehouseImg,
    allocation: 85,
    isVip: false
  },
  { 
    id: 5, 
    packNumber: 5,
    name: 'Pack Gold', 
    subtitle: 'Centre de distribution',
    category: 'STOCKS',
    categoryLabel: 'Centre de distribution',
    description: 'Centre de distribution moderne Coca-Cola avec quais de chargement et flux de marchandises ininterrompu.',
    price: 60000, 
    daily: 11500, 
    duration: 90, 
    tag: 'PACK 5',
    image: distribCenterImg,
    allocation: 84,
    isVip: false
  },
  { 
    id: 6, 
    packNumber: 6,
    name: 'Pack Platine', 
    subtitle: 'Flotte logistique',
    category: 'STOCKS',
    categoryLabel: 'Flotte logistique',
    description: 'Flotte logistique complète de véhicules et semi-remorques Coca-Cola desservant les grands axes commerciaux.',
    price: 120000, 
    daily: 23000, 
    duration: 90, 
    tag: 'PACK 6',
    image: truckFleetImg,
    allocation: 78,
    isVip: true
  },
  { 
    id: 7, 
    packNumber: 7,
    name: 'Pack VIP', 
    subtitle: 'Entrepôt régional',
    category: 'STOCKS',
    categoryLabel: 'Entrepôt régional',
    description: 'Grand entrepôt régional automatisé assurant le stockage massif et la redistribution multi-villes.',
    price: 250000, 
    daily: 55000, 
    duration: 90, 
    tag: 'PACK 7',
    image: distribCenterImg,
    allocation: 95,
    isVip: true
  },
  { 
    id: 8, 
    packNumber: 8,
    name: 'Pack Super VIP', 
    subtitle: 'Centre logistique',
    category: 'STOCKS',
    categoryLabel: 'Centre logistique',
    description: 'Plateforme multimodale et hub logistique haute cadence pour les grossistes et hypermarchés.',
    price: 450000, 
    daily: 100000, 
    duration: 90, 
    tag: 'PACK 8',
    image: warehouseImg,
    allocation: 75,
    isVip: true
  },
  { 
    id: 9, 
    packNumber: 9,
    name: 'Pack Excellence', 
    subtitle: 'Flotte complète',
    category: 'STOCKS',
    categoryLabel: 'Flotte complète',
    description: 'Supervision et quote-part sur l’ensemble de la flotte de distribution nationale Coca-Cola.',
    price: 700000, 
    daily: 156000, 
    duration: 90, 
    tag: 'PACK 9',
    image: truckFleetImg,
    allocation: 82,
    isVip: true
  },
  { 
    id: 10, 
    packNumber: 10,
    name: 'Pack Prestige', 
    subtitle: 'Réseau national',
    category: 'STOCKS',
    categoryLabel: 'Réseau national',
    description: 'Réseau national intégré d’embouteillage et de distribution des boissons de The Coca-Cola Company.',
    price: 1200000, 
    daily: 280000, 
    duration: 90, 
    tag: 'PACK 10',
    image: distribCenterImg,
    allocation: 91,
    isVip: true
  },
  { 
    id: 11, 
    packNumber: 11,
    name: 'Pack Légende', 
    subtitle: 'Partenariat stratégique',
    category: 'STOCKS',
    categoryLabel: 'Partenariat stratégique',
    description: 'Partenariat stratégique de premier rang au niveau continental, bénéficiant des plus hauts rendements journaliers.',
    price: 2000000, 
    daily: 480000, 
    duration: 90, 
    tag: 'PACK 11',
    image: truckFleetImg,
    allocation: 98,
    isVip: true
  },
];

const STORAGE_KEY = 'coca_app_custom_products';

export const getStoredProducts = (): ProductItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 11 && parsed.some((p: ProductItem) => p.packNumber !== undefined)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse stored products', e);
  }
  saveCustomProducts(INITIAL_PRODUCTS);
  return INITIAL_PRODUCTS;
};

export const saveCustomProducts = (products: ProductItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event('coca_products_updated'));
};

export const resetProductsToDefault = (): ProductItem[] => {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('coca_products_updated'));
  return INITIAL_PRODUCTS;
};

export const updateSingleProduct = (id: number, updates: Partial<ProductItem>): ProductItem[] => {
  const current = getStoredProducts();
  const updated = current.map(p => p.id === id ? { ...p, ...updates } : p);
  saveCustomProducts(updated);
  return updated;
};

export const addProduct = (productData: Omit<ProductItem, 'id'>): ProductItem[] => {
  const current = getStoredProducts();
  const maxId = current.reduce((max, p) => Math.max(max, p.id), 0);
  const newProduct: ProductItem = {
    ...productData,
    id: maxId + 1
  };
  const updated = [newProduct, ...current];
  saveCustomProducts(updated);
  return updated;
};

export const deleteProduct = (id: number): ProductItem[] => {
  const current = getStoredProducts();
  const updated = current.filter(p => p.id !== id);
  saveCustomProducts(updated);
  return updated;
};
