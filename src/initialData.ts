import { Product, Comanda, ActivityLog, Customer, ConsignmentOrder } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Boa Romarinho', category: 'Cervejas', price: 2.99, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p2', name: 'Brahma Romarinho', category: 'Cervejas', price: 2.99, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p3', name: 'Skol Romarinho', category: 'Cervejas', price: 2.99, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p4', name: 'Império Romarinho', category: 'Cervejas', price: 2.99, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p5', name: 'Original Romarinho', category: 'Cervejas', price: 3.49, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p6', name: 'Bud Romarinho', category: 'Cervejas', price: 3.49, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p7', name: 'Heineken Lata', category: 'Cervejas', price: 6.90, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p8', name: 'Heineken 330ml LN', category: 'Cervejas', price: 7.90, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p9', name: 'Spaten 330ml LN', category: 'Cervejas', price: 6.90, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p10', name: 'Stella Artois 330ml LN', category: 'Cervejas', price: 7.90, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p11', name: 'Imperio Lata', category: 'Cervejas', price: 3.50, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p12', name: 'Coca Cola 600ml', category: 'Bebidas', price: 6.90, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p13', name: 'Coca Cola 1L', category: 'Bebidas', price: 7.90, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p14', name: 'Coca Cola 2L', category: 'Bebidas', price: 12.90, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p15', name: 'Copão De Gin', category: 'Destilados', price: 15.00, description: 'Gin com menos %', inStock: true },
  { id: 'p16', name: 'Copão Red/Cavalo', category: 'Destilados', price: 25.00, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p17', name: 'Copão De Jack Daniels', category: 'Destilados', price: 30.00, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p18', name: 'Combo Gin', category: 'Destilados', price: 35.00, description: 'Gin/Energético 2L / 3 Gelos saborizados', inStock: true },
  { id: 'p19', name: 'Suco Kappo Uva', category: 'Bebidas', price: 2.90, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p20', name: 'Torcida', category: 'Petiscos', price: 3.90, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p21', name: 'Corona Zero 330ml LN', category: 'Cervejas', price: 7.90, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p22', name: 'San Marino', category: 'Outros', price: 6.00, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p23', name: 'Copão Gin Promo', category: 'Destilados', price: 20.00, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p24', name: 'Brahma Lata Zero', category: 'Bebidas', price: 4.20, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p25', name: 'Amstel 600ml', category: 'Cervejas', price: 8.90, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p26', name: 'Coca Cola Lata', category: 'Bebidas', price: 4.50, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p27', name: 'Crystal Latão', category: 'Cervejas', price: 3.50, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p28', name: 'Sal e Limão', category: 'Outros', price: 5.00, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p29', name: 'Coca Cola Retornavel 2L', category: 'Bebidas', price: 8.90, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p30', name: 'Pão de Alho', category: 'Petiscos', price: 15.90, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p31', name: 'Imperio Lata Zero Lata', category: 'Cervejas', price: 5.50, description: 'Sem descrição cadastrada do item.', inStock: true },
  { id: 'p32', name: 'Eisenbahn', category: 'Cervejas', price: 8.90, description: 'Sem descrição cadastrada do item.', inStock: true }
];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_COMANDAS: Comanda[] = [];

export const INITIAL_PAID_COMANDAS: Comanda[] = [];

export const INITIAL_LOGS: ActivityLog[] = [];

export const INITIAL_CONSIGNMENTS: ConsignmentOrder[] = [];
