export interface Product {
  id: string;
  name: string;
  category: 'Bebidas' | 'Cervejas' | 'Destilados' | 'Petiscos' | 'Outros' | 'Consignados';
  price: number;
  description?: string;
  inStock?: boolean;
}

export interface ComandaItem {
  productId: string;
  name: string;
  category: Product['category'];
  price: number;
  quantity: number;
  addedAt: string;
  notes?: string;
}

export type ComandaStatus = 'open' | 'paid';

export interface Comanda {
  id: string; // e.g. "0012"
  number: number; // e.g. 12
  customerName: string;
  phone?: string;
  items: ComandaItem[];
  status: ComandaStatus;
  openedAt: string;
  closedAt?: string;
  paymentMethod?: 'PIX' | 'Cartão' | 'Dinheiro';
  discount?: number;
  serviceCharge?: boolean; // 10% tax
  createdBy?: string; // Operator name who created
  updatedBy?: string; // Operator name who last modified
}

export interface ActivityLog {
  id: string;
  type: 'open' | 'add_item' | 'pay' | 'add_product' | 'close_register' | 'consign_create' | 'consign_finalize' | 'consign_cancel';
  title: string;
  details: string;
  value?: number;
  timestamp: string;
  operator?: string; // Operator who did the event
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalSpent: number;
  visits: number;
}

export interface ConsignmentItem {
  id: string;
  name: string;
  quantityConsigned: number; // Qtd total disponibilizada
  quantityReturned: number;   // Qtd que retornou cheia/lacrada
  price: number;             // Preço unitário acertado
}

export interface ConsignmentAsset {
  id: string;
  name: string;              // e.g "Caixa Térmica 50L", "Engradado Vazio", "Chopeira"
  quantity: number;
  returned: boolean;         // Se o cliente devolveu do evento
  securityDepositValue: number; // Valor de caução ou multa por perda
}

export interface ConsignmentOrder {
  id: string;
  customerName: string;
  phone: string;
  cpf?: string;
  address?: string;
  eventDate: string;
  deliveryDate: string;
  returnDate?: string;
  items: ConsignmentItem[];
  assets: ConsignmentAsset[];
  status: 'consignado' | 'finalizado' | 'cancelado';
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  observation?: string;
  paymentMethod?: 'PIX' | 'Cartão' | 'Dinheiro';
  totalPaid?: number;
  createdBy?: string;
  deliveryFee?: number;
  serviceFee?: number;
  otherFees?: number;
}

export interface RegisterTransaction {
  id: string;
  type: 'entrada' | 'saida';
  tag: 'comanda' | 'suprimento' | 'sangria' | 'despesa';
  title: string;
  value: number;
  timestamp: string;
  method: string;
}
