import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  Printer, 
  FileText, 
  Box, 
  Calendar, 
  Phone, 
  User, 
  Activity, 
  AlertCircle,
  HelpCircle,
  Clock,
  MapPin,
  Search,
  CheckCircle,
  X,
  CreditCard,
  QrCode,
  DollarSign,
  Lock,
  Unlock,
  Sparkles
} from 'lucide-react';
import { ConsignmentOrder, ConsignmentItem, ConsignmentAsset, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import PitStopLogo from './PitStopLogo';
import { generateConsignmentNotePDF } from '../utils/pdfGenerator';

interface ConsignacoesViewProps {
  consignments: ConsignmentOrder[];
  products: Product[];
  onAddConsignment: (newOrder: ConsignmentOrder) => void;
  onUpdateConsignment: (updated: ConsignmentOrder) => void;
  onDeleteConsignment: (id: string) => void;
  addActivityLog: (type: any, title: string, details: string, value?: number) => void;
}

export default function ConsignacoesView({
  consignments,
  products = [],
  onAddConsignment,
  onUpdateConsignment,
  onDeleteConsignment,
  addActivityLog
}: ConsignacoesViewProps) {
  // Password Lock state
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('pitstop_consign_unlocked') === 'true';
  });
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // General state
  const [activeTab, setActiveTab] = useState<'ativos' | 'finalizados' | 'todos'>('ativos');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [printTemplate, setPrintTemplate] = useState<'A4' | 'thermal'>('A4');

  // Creation Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newDeliveryDate, setNewDeliveryDate] = useState('');
  const [newObservation, setNewObservation] = useState('');
  const [newDeliveryFee, setNewDeliveryFee] = useState<string>('0');
  const [newServiceFee, setNewServiceFee] = useState<string>('0');
  const [newOtherFees, setNewOtherFees] = useState<string>('0');

  // Temporary arrays for creating items/assets in creation modal
  const [newItems, setNewItems] = useState<(Omit<ConsignmentItem, 'id'> & { id?: string; quantityReturned?: number })[]>([]);
  const [newAssets, setNewAssets] = useState<(Omit<ConsignmentAsset, 'id'> & { id?: string; returned?: boolean })[]>([]);

  // Item Input Temp states
  const [tempItemName, setTempItemName] = useState('');
  const [tempItemPrice, setTempItemPrice] = useState<string>('');
  const [tempItemQuantity, setTempItemQuantity] = useState<string>('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Asset Input Temp states
  const [tempAssetName, setTempAssetName] = useState('');
  const [tempAssetQuantity, setTempAssetQuantity] = useState<string>('');
  const [tempAssetDeposit, setTempAssetDeposit] = useState<string>('');

  // Pay Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Cartão' | 'Dinheiro'>('PIX');

  const consignmentPassword = import.meta.env.VITE_CONSIGNADO_PASSWORD || localStorage.getItem('pitstop_consign_password') || '12345678th';

  // Security Unlock Handler
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordAttempt === consignmentPassword) {
      setIsUnlocked(true);
      sessionStorage.setItem('pitstop_consign_unlocked', 'true');
      setPasswordError(false);
      setPasswordAttempt('');
    } else {
      setPasswordError(true);
      setPasswordAttempt('');
    }
  };

  // Lock Out Handler
  const handleLockOut = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('pitstop_consign_unlocked');
  };

  // Edit consignment state
  const [isEditing, setIsEditing] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const handleStartEditConsignment = (order: ConsignmentOrder) => {
    setIsEditing(true);
    setEditingOrderId(order.id);
    setNewCustomerName(order.customerName);
    setNewPhone(order.phone || '');
    setNewCpf(order.cpf || '');
    setNewAddress(order.address || '');
    setNewEventDate(order.eventDate || '');
    setNewDeliveryDate(order.deliveryDate || '');
    setNewObservation(order.observation || '');
    setNewDeliveryFee(order.deliveryFee?.toString() || '0');
    setNewServiceFee(order.serviceFee?.toString() || '0');
    setNewOtherFees(order.otherFees?.toString() || '0');
    setNewItems(order.items);
    setNewAssets(order.assets);
    setShowCreateModal(true);
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingOrderId(null);
    setNewCustomerName('');
    setNewPhone('');
    setNewCpf('');
    setNewAddress('');
    setNewEventDate('');
    setNewDeliveryDate('');
    setNewObservation('');
    setNewDeliveryFee('0');
    setNewServiceFee('0');
    setNewOtherFees('0');
    setNewItems([]);
    setNewAssets([]);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setIsEditing(false);
    setEditingOrderId(null);
    setNewCustomerName('');
    setNewPhone('');
    setNewCpf('');
    setNewAddress('');
    setNewEventDate('');
    setNewDeliveryDate('');
    setNewObservation('');
    setNewDeliveryFee('0');
    setNewServiceFee('0');
    setNewOtherFees('0');
    setNewItems([]);
    setNewAssets([]);
  };

  // Currently inspected Order
  const currentOrder = consignments.find(c => c.id === selectedOrderId);

  // Filtered orders
  const filteredOrders = consignments.filter(order => {
    if (activeTab === 'ativos' && order.status !== 'consignado') return false;
    if (activeTab === 'finalizados' && order.status !== 'finalizado') return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        order.customerName.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q) ||
        (order.phone && order.phone.includes(q))
      );
    }
    return true;
  });

  // Calculate Consumed quantity & cost for items
  const calculateItemConsumed = (item: ConsignmentItem) => {
    const consumed = Math.max(0, item.quantityConsigned - item.quantityReturned);
    return {
      consumed,
      subtotal: consumed * item.price
    };
  };

  // Calculate overall consignment financials
  const getOrderFinancials = (order: ConsignmentOrder) => {
    let itemsTotal = 0;
    order.items.forEach(item => {
      const consumed = Math.max(0, item.quantityConsigned - item.quantityReturned);
      itemsTotal += consumed * item.price;
    });

    let pendingAssetsValue = 0;
    order.assets.forEach(asset => {
      pendingAssetsValue += (asset.securityDepositValue * asset.quantity);
    });

    const deliveryFee = order.deliveryFee || 0;
    const serviceFee = order.serviceFee || 0;
    const otherFees = order.otherFees || 0;

    return {
      itemsTotal,
      pendingAssetsValue,
      deliveryFee,
      serviceFee,
      otherFees,
      grandTotal: itemsTotal + pendingAssetsValue + deliveryFee + serviceFee + otherFees
    };
  };

  // Handle adding temporary items in Modal creation
  const handleAddTempItem = () => {
    if (!tempItemName.trim()) return;
    const price = parseFloat(tempItemPrice) || 0;
    const qty = parseInt(tempItemQuantity) || 1;
    setNewItems([
      ...newItems,
      {
        name: tempItemName,
        price,
        quantityConsigned: qty,
        quantityReturned: 0
      }
    ]);
    setTempItemName('');
    setTempItemPrice('');
    setTempItemQuantity('');
  };

  const handleRemoveTempItem = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  // Handle adding temporary assets in Modal creation
  const handleAddTempAsset = () => {
    if (!tempAssetName.trim()) return;
    const qty = parseInt(tempAssetQuantity) || 1;
    const deposit = parseFloat(tempAssetDeposit) || 0;
    setNewAssets([
      ...newAssets,
      {
        name: tempAssetName,
        quantity: qty,
        returned: false,
        securityDepositValue: deposit
      }
    ]);
    setTempAssetName('');
    setTempAssetQuantity('');
    setTempAssetDeposit('');
  };

  const handleRemoveTempAsset = (index: number) => {
    setNewAssets(newAssets.filter((_, i) => i !== index));
  };

  // Save the newly drafted Consignment Note
  const handleSaveDraftConsignment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCustomerName.trim() || !newPhone.trim()) {
      alert("Por favor insira o nome do cliente e pelo menos um telefone para contato!");
      return;
    }

    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let finalOrderId = '';

    if (isEditing && editingOrderId) {
      finalOrderId = editingOrderId;
      const orderToEdit = consignments.find(c => c.id === editingOrderId);
      if (orderToEdit) {
        const updatedOrder: ConsignmentOrder = {
          ...orderToEdit,
          customerName: newCustomerName,
          phone: newPhone,
          cpf: newCpf.trim() || undefined,
          address: newAddress.trim() || undefined,
          eventDate: newEventDate || new Date().toISOString().split('T')[0],
          deliveryDate: newDeliveryDate || new Date().toISOString().split('T')[0],
          items: newItems.map((it, idx) => ({
            ...it,
            id: it.id || `it_${Date.now()}_${idx}`,
            quantityReturned: it.quantityReturned ?? 0
          })) as ConsignmentItem[],
          assets: newAssets.map((as, idx) => ({
            ...as,
            id: as.id || `as_${Date.now()}_${idx}`,
            returned: as.returned ?? false
          })) as ConsignmentAsset[],
          updatedAt: timestamp,
          observation: newObservation.trim() || undefined,
          deliveryFee: parseFloat(newDeliveryFee) || 0,
          serviceFee: parseFloat(newServiceFee) || 0,
          otherFees: parseFloat(newOtherFees) || 0
        };

        onUpdateConsignment(updatedOrder);
        addActivityLog('consign_create', `Consignado Editado ${editingOrderId}`, `Cliente: ${newCustomerName}`);
      }
    } else {
      const nextNumber = consignments.length + 1;
      const padNum = nextNumber.toString().padStart(4, '0');
      finalOrderId = `CSG-${padNum}`;

      const newOrder: ConsignmentOrder = {
        id: finalOrderId,
        customerName: newCustomerName,
        phone: newPhone,
        cpf: newCpf.trim() || undefined,
        address: newAddress.trim() || undefined,
        eventDate: newEventDate || new Date().toISOString().split('T')[0],
        deliveryDate: newDeliveryDate || new Date().toISOString().split('T')[0],
        items: newItems.map((it, idx) => ({
          ...it,
          id: `it_${Date.now()}_${idx}`,
          quantityReturned: 0
        })) as ConsignmentItem[],
        assets: newAssets.map((as, idx) => ({
          ...as,
          id: `as_${Date.now()}_${idx}`,
          returned: false
        })) as ConsignmentAsset[],
        status: 'consignado',
        createdAt: timestamp,
        updatedAt: timestamp,
        observation: newObservation.trim() || undefined,
        createdBy: 'PitStop Cohab',
        deliveryFee: parseFloat(newDeliveryFee) || 0,
        serviceFee: parseFloat(newServiceFee) || 0,
        otherFees: parseFloat(newOtherFees) || 0
      };

      onAddConsignment(newOrder);
      addActivityLog('consign_create', `Consignado Criado ${finalOrderId}`, `Cliente: ${newCustomerName}`);
    }
    
    // Reset inputs
    setNewCustomerName('');
    setNewPhone('');
    setNewCpf('');
    setNewAddress('');
    setNewEventDate('');
    setNewDeliveryDate('');
    setNewObservation('');
    setNewDeliveryFee('0');
    setNewServiceFee('0');
    setNewOtherFees('0');
    setNewItems([]);
    setNewAssets([]);
    setIsEditing(false);
    setEditingOrderId(null);
    setShowCreateModal(false);
    setSelectedOrderId(finalOrderId);
  };

  // Quick preset products to facilitate consignment drafting
  const insertPresetProduct = (name: string, price: number) => {
    setTempItemName(name);
    setTempItemPrice(price.toString());
    setTempItemQuantity('10'); // Generous starting amount for events
  };

  // Quick preset assets
  const insertPresetAsset = (name: string, security: number) => {
    setTempAssetName(name);
    setTempAssetQuantity('1');
    setTempAssetDeposit(security.toString());
  };

  // Returns logic handlers inside inspector
  const handleUpdateItemReturnCount = (itemId: string, returnQty: number) => {
    if (!currentOrder) return;
    const updatedItems = currentOrder.items.map(item => {
      if (item.id === itemId) {
        const clappedQty = Math.max(0, Math.min(item.quantityConsigned, returnQty));
        return {
          ...item,
          quantityReturned: clappedQty
        };
      }
      return item;
    });

    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    onUpdateConsignment({
      ...currentOrder,
      items: updatedItems,
      updatedAt: timestamp
    });
  };

  const handleToggleAssetReturn = (assetId: string) => {
    if (!currentOrder) return;
    const updatedAssets = currentOrder.assets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          returned: !asset.returned
        };
      }
      return asset;
    });

    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    onUpdateConsignment({
      ...currentOrder,
      assets: updatedAssets,
      updatedAt: timestamp
    });
  };

  // Finalize Consignment Order & collect payment
  const handleConfirmSettlePayment = () => {
    if (!currentOrder) return;

    const financials = getOrderFinancials(currentOrder);
    const finalValue = financials.grandTotal;
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const updatedOrder: ConsignmentOrder = {
      ...currentOrder,
      status: 'finalizado',
      paymentMethod,
      totalPaid: finalValue,
      closedAt: timestamp,
      updatedAt: timestamp
    };

    onUpdateConsignment(updatedOrder);
    addActivityLog('consign_finalize', `Consignado Fechado ${currentOrder.id}`, `Recebido via ${paymentMethod}`, finalValue);
    
    setShowPayModal(false);
  };

  // Cancel overall consignment process
  const handleCancelOrder = () => {
    if (!currentOrder) return;
    if (window.confirm(`Deseja realmente cancelar e anular este pedido consignado ${currentOrder.id}?`)) {
      const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      onUpdateConsignment({
        ...currentOrder,
        status: 'cancelado',
        updatedAt: timestamp
      });
      addActivityLog('consign_cancel', `Consignado Cancelado ${currentOrder.id}`, `Cliente: ${currentOrder.customerName}`);
      setSelectedOrderId(null);
    }
  };

  // Print system action trigger
  const handlePrintNote = () => {
    if (printTemplate === 'A4' && currentOrder) {
      generateConsignmentNotePDF(currentOrder);
    } else {
      window.print();
    }
  };

  // If locked, render the password screen
  if (!isUnlocked) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-slate-950 min-h-0 select-none">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8 text-slate-300 gold-glow"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-5 text-slate-950 shadow-md">
              <Lock className="w-8 h-8 stroke-[2.2]" />
            </div>
            
            <h3 className="font-display font-black text-2xl text-slate-100 tracking-tight flex items-center gap-1">
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
              Consignado Protegido
            </h3>
            <p className="text-xs text-slate-400 mt-2 max-w-[280px] leading-relaxed font-semibold">
              O acesso a este módulo é restrito. Digite a credencial para gerenciar notas e ativos de festas.
            </p>
          </div>

          <form onSubmit={handleVerifyPassword} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Chave de Acesso
              </label>
              <input
                type="password"
                placeholder="Insira a senha do consignado"
                value={passwordAttempt}
                onChange={(e) => {
                  setPasswordAttempt(e.target.value);
                  setPasswordError(false);
                }}
                className="w-full bg-slate-950 border border-slate-850 text-slate-100 font-sans rounded-xl py-3 px-4 text-xs tracking-wider outline-none focus:ring-4 focus:ring-amber-500/15 focus:border-amber-500 transition-all text-center font-bold"
                autoFocus
              />
              {passwordError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-bold text-red-600 mt-1.5 text-center"
                >
                  Senha incorreta! Tente novamente.
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-gold-500 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-150 active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Verificar Acesso</span>
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 px-3 sm:px-6 py-4 relative">
      
      {/* Dynamic embedded Print Style element */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body, html {
            background-color: white !important;
            background-image: none !important;
            color: black !important;
          }
          /* Hide everything on the viewport from being printed */
          body * {
            visibility: hidden !important;
          }
          /* Explicitly render our print ticket card and its child assets */
          #print-invoice-area, #print-invoice-area * {
            visibility: visible !important;
          }
          /* Position absolutely on the printing page canvas */
          #print-invoice-area {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            font-family: 'Inter', system-ui, sans-serif !important;
            margin: 0 !important;
            padding: 10px !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print\\:text-black {
            color: black !important;
          }
          .print\\:border-black {
            border-color: black !important;
          }
          .print\\:border-dashed {
            border-style: dashed !important;
          }
        }
      `}} />

      {/* Screen Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 shrink-0 print:hidden">
        <div>
          <h2 className="font-display font-black text-xl sm:text-2xl text-slate-100 tracking-tight flex items-center gap-2 flex-wrap">
            <span className="p-1 px-2.5 bg-gold-400 text-slate-100 rounded-lg text-[10px] sm:text-xs font-black italic">CONSIGNADO</span>
            Controle de Festas & Consignações
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Gelo, bebidas e recipientes térmicos consignados. Cobra e tarifa apenas o que o contratante consumir.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleLockOut}
            className="p-2 sm:p-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Bloquear Módulo"
          >
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Bloquear</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="p-3 bg-slate-950 text-gold-500 border border-slate-800 hover:bg-gold-500 hover:text-slate-900 hover:scale-[1.01] cursor-pointer rounded-2xl text-xs font-black font-display tracking-tight flex items-center justify-center gap-2 transition-all active:scale-95 flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4" />
            Novo Consignado
          </button>
        </div>
      </div>

      {/* Primary Split Screen dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        
        {/* Left Pane: Orders List (4 cols on lg) */}
        <div className={`lg:col-span-4 flex flex-col h-full bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-4.5 min-h-0 overflow-hidden relative shadow-md ${selectedOrderId ? 'hidden lg:flex' : 'flex'} print:hidden`}>
          
          <div className="flex justify-between items-center mb-3 shrink-0">
            <span className="text-[11px] font-black uppercase text-slate-100 tracking-wider">Notas de Consignados</span>
            <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-850 px-2 py-0.5 rounded-full font-bold">
              {filteredOrders.length} notas
            </span>
          </div>

          {/* Tab Selection Row */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 mb-3 select-none shrink-0 border-solid">
            {(['ativos', 'finalizados', 'todos'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedOrderId(null);
                }}
                className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-slate-900 text-gold-400 font-black shadow-sm border border-slate-800'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'ativos' && 'Ativos'}
                {tab === 'finalizados' && 'Finalizados'}
                {tab === 'todos' && 'Todos'}
              </button>
            ))}
          </div>

          {/* Client filter field */}
          <div className="relative mb-3.5 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Digite o nome, tel ou código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 text-slate-100 rounded-xl py-2.5 pl-9 pr-4 text-xs tracking-tight outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 font-medium"
            />
          </div>

          {/* Scroll container of notes entries */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 h-full min-h-0" style={{ contentVisibility: 'auto' }}>
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <Box className="w-7 h-7 text-slate-300" />
                <span className="text-[11px] font-bold">Nenhum registro encontrado</span>
              </div>
            ) : (
              filteredOrders.map(order => {
                const financials = getOrderFinancials(order);
                const isSelected = order.id === selectedOrderId;

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none relative ${
                      isSelected 
                        ? 'bg-amber-500/10 border-amber-500 shadow-sm' 
                        : 'bg-slate-950 hover:bg-slate-850/80 border-slate-850 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-mono font-black border px-1.5 py-0.5 rounded ${
                            isSelected 
                              ? 'bg-amber-500/20 border-amber-400 text-gold-400' 
                              : 'bg-slate-850 border-slate-800 text-slate-300'
                          }`}>
                            {order.id}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            order.status === 'consignado' 
                              ? 'bg-amber-400 text-slate-950' 
                              : order.status === 'finalizado' 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-slate-300 text-slate-700'
                          }`}>
                            {order.status === 'consignado' ? 'Ativo' : order.status === 'finalizado' ? 'Satisfeito' : 'Cancelado'}
                          </span>
                        </div>
                        <h4 className={`font-display font-black text-sm mt-2 truncate w-full max-w-[170px] ${
                          isSelected ? 'text-gold-400' : 'text-slate-100'
                        }`}>
                          {order.customerName}
                        </h4>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-slate-500 font-extrabold uppercase block">Parcial</span>
                        <span className={`text-xs sm:text-sm font-mono font-black ${
                          isSelected ? 'text-white' : 'text-slate-100'
                        }`}>
                          R$ {financials.grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2.5 pt-2.5 border-t border-slate-850 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-500" /> Evento: {order.eventDate}
                      </span>
                      <span className={`font-bold ${isSelected ? 'text-gold-500' : 'text-slate-400'}`}>{order.items.length + order.assets.length} Itens</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Selected Audit & printable note details (8 cols) */}
        <div className={`lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-5 flex flex-col h-full min-h-0 overflow-y-auto shadow-md ${!selectedOrderId ? 'hidden lg:flex' : 'flex'}`}>
          
          {currentOrder ? (
            <div className="flex flex-col h-full min-h-0">
              
              {/* Actions Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-850 mb-4 shrink-0 print:hidden">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedOrderId(null)}
                    className="p-2 px-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-xl text-xs font-extrabold text-slate-300 flex items-center justify-center gap-1.5 transition lg:hidden"
                  >
                    ← Voltar para lista
                  </button>

                  {/* Print Template Switcher */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-850 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPrintTemplate('A4')}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg cursor-pointer transition-all duration-150 ${
                        printTemplate === 'A4'
                          ? 'bg-slate-900 text-amber-500 shadow-sm border border-slate-800'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
                      }`}
                    >
                      Guia Completa A4
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintTemplate('thermal')}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg cursor-pointer transition-all duration-150 ${
                        printTemplate === 'thermal'
                          ? 'bg-slate-900 text-amber-500 shadow-sm border border-slate-800'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
                      }`}
                    >
                      Cupom Térmico (80mm)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto justify-end">
                  <button
                    onClick={handlePrintNote}
                    className="p-2.5 px-4 bg-slate-950 hover:bg-slate-850 text-gold-500 border border-slate-800 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition duration-150 active:scale-95 shadow-sm"
                  >
                    {printTemplate === 'A4' ? (
                      <>
                        <FileText className="w-4 h-4 text-amber-500" />
                        Gerar PDF da Guia A4
                      </>
                    ) : (
                      <>
                        <Printer className="w-4 h-4" />
                        Imprimir Cupom Térmico
                      </>
                    )}
                  </button>

                  {currentOrder.status === 'consignado' && (
                    <>
                      <button
                        onClick={() => handleStartEditConsignment(currentOrder)}
                        className="p-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition active:scale-95"
                      >
                        <Sparkles className="w-4 h-4 stroke-[2.5]" />
                        Editar / Adicionar Itens
                      </button>

                      <button
                        onClick={() => setShowPayModal(true)}
                        className="p-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition active:scale-95"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Fechar Conta
                      </button>

                      <button
                        onClick={handleCancelOrder}
                        className="p-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/10 text-rose-400 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
                        title="Anular Consignado"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Inspected Content Board */}
              <div className="flex-1 space-y-5 print:p-0">
                
                {/* Printable element container */}
                <div id="print-invoice-area" className="bg-white p-4 sm:p-5 border border-slate-200 rounded-2xl text-slate-900 space-y-5 shadow-sm">
                  {printTemplate === 'A4' ? (
                    <>
                      {/* A4 Guia Completa Layout (Full High-contrast Professional Invoice) */}
                      {/* Beautiful Invoice Ticket Header */}
                      <div className="flex flex-col items-center justify-center text-center pb-5 border-b border-dashed border-slate-300">
                        <div className="mb-2">
                          <PitStopLogo size="sm" showText={false} />
                        </div>
                        <h1 className="text-2xl font-black uppercase text-slate-950 leading-tight tracking-wider">PITSTOP COHAB</h1>
                        <span className="text-[10px] font-mono font-extrabold bg-slate-100 text-amber-600 px-3 py-0.5 rounded mt-1.5 uppercase tracking-widest">
                          DISTRIBUIDORA & CONVENIÊNCIA
                        </span>
                        <p className="text-[10px] text-slate-600 mt-2 font-bold uppercase tracking-wider">
                          CNPJ: 64.712.625/0001-69 | Av. Ana Jacinta, n. 2039 - PITSTOP COHAB | WhatsApp: (18) 99623-8015
                        </p>
                        <div className="w-full bg-slate-950 text-white font-black text-center py-2.5 rounded-xl uppercase text-xs tracking-[0.2em] my-4 shadow-sm">
                          NOTA DE FECHAMENTO | EVENTO EM CONSIGNAÇÃO
                        </div>
                        <div className="px-5 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-black tracking-widest uppercase inline-block">
                          Nº DO EVENTO: #{currentOrder.id.toUpperCase()}
                        </div>
                      </div>

                      {/* Operational status details card */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 border border-slate-200 shadow-sm rounded-xl">
                        <div>
                          <span className="text-[9px] font-extrabold text-slate-500 uppercase block leading-none">Código da Guia</span>
                          <strong className="text-sm font-mono text-slate-950 mt-1 block">{currentOrder.id}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-slate-500 uppercase block leading-none">Data Emissão</span>
                          <strong className="text-[11px] text-slate-900 mt-1 block font-bold">Criado às {currentOrder.createdAt}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-slate-500 uppercase block leading-none">Situação Atual</span>
                          <span className={`inline-block text-[10px] sm:text-xs font-black uppercase mt-1 ${
                            currentOrder.status === 'consignado' ? 'text-amber-500 font-extrabold' : 'text-emerald-600 font-extrabold'
                          }`}>
                            {currentOrder.status === 'consignado' ? '● Em Evento / Ativo' : '✓ Finalizado/Satisfeito'}
                          </span>
                        </div>
                      </div>

                      {/* Customer Information Column block */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-2 shadow-sm">
                          <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1 border-b border-slate-100 pb-1.5 mb-2">
                            <User className="w-3.5 h-3.5" />
                            DADOS DO CLIENTE E RECEPTOR
                          </h5>
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-500 uppercase block">Nome Completo / Razão</span>
                            <p className="text-xs font-black text-slate-950">{currentOrder.customerName}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase block">Contato</span>
                              <p className="text-xs font-mono font-bold text-slate-950">{currentOrder.phone}</p>
                            </div>
                            {currentOrder.cpf && (
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase block">CPF / CNPJ</span>
                                <p className="text-xs font-mono font-bold text-slate-950">{currentOrder.cpf}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-2 shadow-sm">
                          <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1 border-b border-slate-100 pb-1.5 mb-2">
                            <Calendar className="w-3.5 h-3.5" />
                            CRONOGRAMA LOGISTÍCO DO EVENTO
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase block">Data Entrega</span>
                              <p className="text-xs font-bold text-slate-950">{currentOrder.deliveryDate}</p>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase block">Data Festividade</span>
                              <p className="text-xs font-bold text-slate-950">{currentOrder.eventDate}</p>
                            </div>
                          </div>
                          {currentOrder.address && (
                            <div className="pt-1">
                              <span className="text-[9px] text-slate-500 uppercase block">Destino do Envio</span>
                              <p className="text-xs font-semibold text-slate-950">{currentOrder.address}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Consigned items inventory list */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pl-1">
                          <h5 className="text-[10px] font-black text-slate-950 uppercase tracking-widest flex items-center gap-1.5">
                            <Box className="w-3.5 h-3.5 text-amber-500" />
                            CONFERÊNCIA DE PRODUTOS LÍQUIDOS CONSUMIDOS
                          </h5>
                          <span className="text-[8px] sm:text-[9px] bg-slate-100 text-amber-600 px-2 py-0.5 rounded font-black font-mono">
                            Apenas fardos/unidades violados e consumidos serão cobrados
                          </span>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                          <div className="min-w-[600px] w-full">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-905 text-[10px] font-black uppercase text-amber-500 border-b border-amber-600">
                                  <th className="p-3 text-slate-950 bg-slate-100">Descrição do Produto</th>
                                  <th className="p-3 text-center text-slate-950 bg-slate-100">Cedidos</th>
                                  <th className="p-3 text-center text-slate-950 bg-slate-100">Devolvidos</th>
                                  <th className="p-3 text-center text-amber-600 uppercase font-black bg-amber-50 font-mono">Consumidos</th>
                                  <th className="p-3 text-right text-slate-950 bg-slate-100 font-mono">Preço Unit.</th>
                                  <th className="p-3 text-right text-slate-950 bg-slate-100 font-mono">Custo Final</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 text-slate-900">
                                {currentOrder.items.map(item => {
                                  const { consumed, subtotal } = calculateItemConsumed(item);
                                  const isEditable = currentOrder.status === 'consignado';

                                  return (
                                    <tr key={item.id} className="text-xs transition hover:bg-slate-50">
                                      <td className="p-3 font-semibold text-slate-950">{item.name}</td>
                                      <td className="p-3 text-center font-mono font-bold bg-slate-50 text-slate-950">{item.quantityConsigned}</td>
                                      <td className="p-3 text-center bg-white">
                                        {isEditable ? (
                                          <div className="flex items-center justify-center gap-1 inline-flex hover:scale-105 transition no-print">
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateItemReturnCount(item.id, item.quantityReturned - 1)}
                                              className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black flex items-center justify-center rounded-lg cursor-pointer transition border border-slate-300"
                                            >
                                              -
                                            </button>
                                            <span className="font-mono font-black text-slate-950 min-w-[28px] text-center text-xs">
                                              {item.quantityReturned}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateItemReturnCount(item.id, item.quantityReturned + 1)}
                                              className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black flex items-center justify-center rounded-lg cursor-pointer transition border border-slate-300"
                                            >
                                              +
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="font-mono font-semibold text-slate-950">{item.quantityReturned}</span>
                                        )}
                                        {/* Print layout always displays quantity strictly */}
                                        <span className="hidden print:inline font-mono font-semibold text-slate-950">
                                          {item.quantityReturned}
                                        </span>
                                      </td>
                                      <td className="p-3 text-center font-mono font-black text-rose-700 bg-rose-50/50">
                                        {consumed}
                                      </td>
                                      <td className="p-3 text-right font-mono text-slate-700">
                                        R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="p-3 text-right font-mono font-black text-slate-950 bg-slate-50/30">
                                        R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  );
                                })}
                                {/* Summary total drinks row inside table */}
                                <tr className="bg-slate-100 font-bold">
                                  <td colSpan={5} className="p-3 text-right text-slate-750 font-extrabold uppercase text-[10px]">TOTAL PARCIAL BEBIDAS CONSUMIDAS:</td>
                                  <td className="p-3 text-right font-mono font-black text-slate-950 text-xs">
                                    R$ {getOrderFinancials(currentOrder).itemsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Retained Equipment & Coolers (Caução) */}
                      {currentOrder.assets.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between pl-1">
                            <h5 className="text-[10px] font-black text-slate-950 uppercase tracking-widest flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-amber-500" />
                              ESTRUTURA DE SUPORTE EM COMODATO E VASILHAMES
                            </h5>
                            <span className="text-[8px] sm:text-[9px] text-amber-600 font-extrabold uppercase">
                              Danos ou perdas de recipientes geram multas de reposição
                            </span>
                          </div>

                          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                            <div className="min-w-[600px] w-full">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-905 text-[10px] font-black uppercase text-amber-500 border-b border-amber-600">
                                    <th className="p-3 text-slate-950 bg-slate-100">Equipamento / Vasillhame</th>
                                    <th className="p-3 text-center text-slate-950 bg-slate-100">Qtd Cedida</th>
                                    <th className="p-3 text-center text-slate-950 bg-slate-100">Devolução status</th>
                                    <th className="p-3 text-right text-slate-955 bg-slate-100">Valor Unitário</th>
                                    <th className="p-3 text-right text-slate-955 bg-slate-100 font-mono font-black border-l border-slate-200">Total Cobrado (Uso)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-slate-900">
                                  {currentOrder.assets.map(asset => {
                                    const isEditable = currentOrder.status === 'consignado';
                                    const lossCharge = asset.securityDepositValue * asset.quantity;

                                    return (
                                      <tr key={asset.id} className="text-xs hover:bg-slate-50 transition">
                                        <td className="p-3 font-semibold text-slate-950 flex items-center gap-2">
                                          <Box className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                          {asset.name}
                                        </td>
                                        <td className="p-3 text-center font-mono font-bold text-slate-950 bg-slate-50">{asset.quantity}</td>
                                        <td className="p-3 text-center">
                                          {isEditable ? (
                                            <button
                                              type="button"
                                              onClick={() => handleToggleAssetReturn(asset.id)}
                                              className={`px-3 py-1.5 text-[9px] font-black rounded-lg border transition cursor-pointer hover:scale-105 duration-100 no-print ${
                                                asset.returned 
                                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                                  : 'bg-red-50 text-red-650 border-red-200'
                                              }`}
                                            >
                                              {asset.returned ? 'Devolvido (OK)' : 'Pendente de Devolução'}
                                            </button>
                                          ) : (
                                            <span className={`text-[10px] font-bold uppercase ${asset.returned ? 'text-emerald-600' : 'text-red-600'}`}>
                                              {asset.returned ? 'Devolvido (OK)' : 'Pendente de Devolução'}
                                            </span>
                                          )}
                                          <span className="hidden print:inline font-bold text-xs text-slate-950">
                                            {asset.returned ? 'DEVOLVIDO (OK)' : 'PENDENTE DE DEVOLUÇÃO'}
                                          </span>
                                        </td>
                                        <td className="p-3 text-right font-mono text-slate-700">
                                          R$ {asset.securityDepositValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-3 text-right font-mono font-black text-amber-600 bg-amber-50/40 border-l border-slate-100">
                                          R$ {lossCharge.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {/* Summary total equipment row inside table */}
                                  <tr className="bg-slate-100 font-bold">
                                    <td colSpan={4} className="p-3 text-right text-slate-750 font-extrabold uppercase text-[10px]">TOTAL TAXAS DE INFRAESTRUTURA / EQUIPAMENTOS:</td>
                                    <td className="p-3 text-right font-mono font-black text-amber-600 text-xs border-l border-slate-200 bg-amber-50/10">
                                      R$ {getOrderFinancials(currentOrder).pendingAssetsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Observations & Legal disclaimers */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 pt-4 border-t border-slate-200">
                        <div className="space-y-1.5 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-500 block">Observações do Acerto / logística</span>
                            <div className="p-3 bg-slate-50 text-xs text-slate-955 rounded-xl border border-slate-200 min-h-[70px] shadow-sm font-semibold leading-relaxed mt-1">
                              {currentOrder.observation || "Nenhuma observação operacional registrada para este evento."}
                            </div>
                          </div>
                          
                          {/* Corporate account coordinates */}
                          <div className="bg-amber-50 border border-dashed border-amber-300 rounded-xl p-3 text-[10px] text-amber-950 mt-3 font-semibold space-y-1">
                            <span className="block font-black text-amber-800 uppercase tracking-widest text-[9px]">DADOS DE FATURAMENTO / PIX</span>
                            <p>CHAVE PIX CNPJ: <strong className="font-mono text-xs">64.712.625/0001-69</strong></p>
                            <p>BANCO SICREDI | PITSTOP COHAB LTDA</p>
                          </div>
                        </div>

                        {/* Financial breakdowns panel (high visibility black fonts) */}
                        <div className="bg-white p-4 border border-slate-200 rounded-xl flex flex-col justify-between shadow-sm">
                          <span className="text-[9px] font-black uppercase text-slate-500 block border-b border-slate-100 pb-1.5 mb-2">COMPOSIÇÃO FINANCEIRA DO ACERTO</span>
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center text-xs text-slate-600">
                              <span className="font-semibold">Bebidas Líquidas Consumidas:</span>
                              <span className="font-mono font-black text-slate-950">
                                R$ {getOrderFinancials(currentOrder).itemsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            {getOrderFinancials(currentOrder).pendingAssetsValue > 0 && (
                              <div className="flex justify-between items-center text-xs text-rose-700 font-semibold">
                                <span>Equipamentos Perdidos / Danificados:</span>
                                <span className="font-mono font-black">
                                  R$ {getOrderFinancials(currentOrder).pendingAssetsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                            {getOrderFinancials(currentOrder).deliveryFee > 0 && (
                              <div className="flex justify-between items-center text-xs text-slate-600">
                                <span className="font-semibold">Frete Logístico (Entrega e Recolhimento):</span>
                                <span className="font-mono font-black text-slate-950">
                                  R$ {getOrderFinancials(currentOrder).deliveryFee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                            {getOrderFinancials(currentOrder).serviceFee > 0 && (
                              <div className="flex justify-between items-center text-xs text-slate-600">
                                <span className="font-semibold">Serviço de Gelagem / Suporte Técnico:</span>
                                <span className="font-mono font-black text-slate-950">
                                  R$ {getOrderFinancials(currentOrder).serviceFee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                            {getOrderFinancials(currentOrder).otherFees > 0 && (
                              <div className="flex justify-between items-center text-xs text-slate-600">
                                <span className="font-semibold">Outros Custos / Acréscimos:</span>
                                <span className="font-mono font-black text-slate-950">
                                  R$ {getOrderFinancials(currentOrder).otherFees.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-slate-200 mt-4 pt-3 flex justify-between items-end">
                            <span className="text-[11px] font-black text-slate-900 uppercase">VALOR TOTAL ACERTADO</span>
                            <div className="text-right">
                              {currentOrder.status === 'finalizado' && currentOrder.paymentMethod && (
                                <span className="inline-block text-[8px] bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-md mb-1 uppercase tracking-wider">
                                  Liquidado ({currentOrder.paymentMethod})
                                </span>
                              )}
                              <span className="text-lg sm:text-2xl font-mono font-black text-slate-950 block leading-none">
                                R$ {getOrderFinancials(currentOrder).grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Print signature clauses */}
                      <div className="hidden print:block text-slate-950 mt-12 pt-8 text-[11px] font-medium leading-relaxed border-t border-solid border-slate-300 bg-white">
                        <p className="text-center font-bold uppercase mb-4 tracking-wider">DECLARAÇÃO DE CONVENIENTES E ASSINATURAS</p>
                        <p className="text-slate-600 text-[9px] text-justify leading-relaxed">
                          Declaramos para os devidos fins legais que as quantidades de bebidas efetivamente consumidas e recipientes retornados foram fiscalizados mutuamente pelas partes. Desta forma, o contratante concorda irrevogavelmente com os valores totais de acerto descritos nesta nota fiscal de acerto comercial pós-evento, dando mútua e plena quitação.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-8 mt-12 text-center pt-4">
                          <div className="space-y-12">
                            <div className="border-b border-black w-4/5 mx-auto"></div>
                            <p className="font-extrabold uppercase text-[9px] text-slate-900">RESPONSÁVEL PITSTOP COHAB</p>
                          </div>
                          <div className="space-y-12">
                            <div className="border-b border-black w-4/5 mx-auto"></div>
                            <p className="font-extrabold uppercase text-[9px] text-slate-900">{currentOrder.customerName}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Thermal Receipt Layout (Cupom Térmico 80mm - Centered Receipt Design) */}
                      <div className="max-w-[320px] mx-auto bg-white p-2 text-slate-900 font-mono text-[11px] leading-relaxed select-all">
                        
                        {/* Header */}
                        <div className="flex flex-col items-center justify-center text-center pb-3">
                          <div className="mb-1 bg-slate-150 p-1.5 rounded-lg flex justify-center">
                            <Box className="w-8 h-8 text-amber-500" />
                          </div>
                          <h2 className="text-sm font-black tracking-widest text-slate-950 uppercase leading-tight font-sans">PITSTOP COHAB</h2>
                          <p className="text-[9px] font-bold text-slate-500 uppercase">Distribuidora & Conveniência</p>
                          <p className="text-[8px] text-slate-600 mt-1">CNPJ: 64.712.625/0001-69</p>
                          <p className="text-[8px] text-slate-600 font-bold">Av. Ana Jacinta, nº 2039 - PITSTOP COHAB</p>
                          <p className="text-[8px] text-slate-600">WhatsApp: (18) 99623-8015</p>
                        </div>

                        <div className="border-b border-dashed border-slate-400 my-1"></div>
                        
                        {/* Title bar */}
                        <div className="text-center bg-slate-950 text-white font-black py-1 px-1 my-1 rounded uppercase tracking-wider text-[9px]">
                          CUPOM DE FECHAMENTO CONSIGNADO
                        </div>
                        <div className="text-center font-bold mt-1 text-[10px] bg-slate-50 border border-slate-200 p-1 rounded font-mono">
                          ID EVENTO: #{currentOrder.id.toUpperCase()}
                        </div>

                        <div className="border-b border-dashed border-slate-400 my-2"></div>

                        {/* Customer data */}
                        <div className="space-y-1">
                          <p className="flex justify-between"><span>CLIENTE:</span> <strong className="truncate max-w-[150px]">{currentOrder.customerName}</strong></p>
                          <p className="flex justify-between"><span>CONTATO:</span> <strong>{currentOrder.phone}</strong></p>
                          {currentOrder.cpf && <p className="flex justify-between"><span>CPF:</span> <strong>{currentOrder.cpf}</strong></p>}
                          <p className="flex justify-between"><span>DATA EVENTO:</span> <strong>{currentOrder.eventDate}</strong></p>
                          <p className="flex justify-between"><span>EMISSÃO:</span> <strong>{currentOrder.createdAt}</strong></p>
                        </div>

                        <div className="border-b border-dashed border-slate-400 my-2"></div>

                        {/* Drinks Title */}
                        <div className="text-center font-black uppercase text-[10px] pb-1">-- PRODUTOS CONSUMIDOS --</div>
                        
                        {/* Table of items */}
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-12 font-bold text-[9px] uppercase border-b border-solid border-slate-300 pb-1">
                            <span className="col-span-6">DESCRIÇÃO</span>
                            <span className="col-span-2 text-center">CED</span>
                            <span className="col-span-2 text-center">DEV</span>
                            <span className="col-span-2 text-right">CONS</span>
                          </div>
                          
                          {currentOrder.items.map(item => {
                            const { consumed, subtotal } = calculateItemConsumed(item);
                            return (
                              <div key={item.id} className="space-y-0.5">
                                <div className="grid grid-cols-12 text-[10px]">
                                  <span className="col-span-6 truncate font-sans font-bold">{item.name}</span>
                                  <span className="col-span-2 text-center font-bold">{item.quantityConsigned}</span>
                                  <span className="col-span-2 text-center">{item.quantityReturned}</span>
                                  <span className="col-span-2 text-right font-black text-rose-700">{consumed}</span>
                                </div>
                                <div className="flex justify-between text-[8px] text-slate-500 pl-2">
                                  <span>Preço un: R$ {item.price.toFixed(2)}</span>
                                  <span>Sub: R$ {subtotal.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Rented Equipment Caucao */}
                        {currentOrder.assets.length > 0 && (
                          <>
                            <div className="border-b border-dashed border-slate-400 my-2"></div>
                            <div className="text-center font-black uppercase text-[10px] pb-1">-- SUPORTE & COMODATO --</div>
                            <div className="space-y-1">
                              {currentOrder.assets.map(asset => {
                                const lossCharge = asset.returned ? 0 : (asset.securityDepositValue * asset.quantity);
                                return (
                                  <div key={asset.id} className="flex justify-between text-[10px]">
                                    <span className="truncate max-w-[130px] font-sans">{asset.name} ({asset.quantity}x)</span>
                                    <span className="font-bold uppercase text-[9px]">
                                      {asset.returned ? '[DEV_OK]' : `[PERDA R$ ${lossCharge.toFixed(2)}]`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}

                        <div className="border-b border-dashed border-slate-400 my-2"></div>

                        {/* Financial balance breakdown */}
                        <div className="space-y-1 font-sans text-xs">
                          <div className="flex justify-between">
                            <span>Consumo de Bebidas:</span>
                            <span className="font-mono font-bold">R$ {getOrderFinancials(currentOrder).itemsTotal.toFixed(2)}</span>
                          </div>
                          {getOrderFinancials(currentOrder).pendingAssetsValue > 0 && (
                            <div className="flex justify-between text-rose-700 font-bold">
                              <span>Perdas/Avarias Comodato:</span>
                              <span className="font-mono">R$ {getOrderFinancials(currentOrder).pendingAssetsValue.toFixed(2)}</span>
                            </div>
                          )}
                          {getOrderFinancials(currentOrder).deliveryFee > 0 && (
                            <div className="flex justify-between">
                              <span>Taxa de Frete/Entrega:</span>
                              <span className="font-mono font-bold">R$ {getOrderFinancials(currentOrder).deliveryFee.toFixed(2)}</span>
                            </div>
                          )}
                          {getOrderFinancials(currentOrder).serviceFee > 0 && (
                            <div className="flex justify-between">
                              <span>Taxas de Serviço:</span>
                              <span className="font-mono font-bold">R$ {getOrderFinancials(currentOrder).serviceFee.toFixed(2)}</span>
                            </div>
                          )}
                          {getOrderFinancials(currentOrder).otherFees > 0 && (
                            <div className="flex justify-between">
                              <span>Outros Acréscimos:</span>
                              <span className="font-mono font-bold">R$ {getOrderFinancials(currentOrder).otherFees.toFixed(2)}</span>
                            </div>
                          )}
                          
                          <div className="border-t border-solid border-slate-900 my-1.5 pt-1.5 flex justify-between items-center text-sm font-black font-sans">
                            <span>TOTAL ACERTADO:</span>
                            <span className="font-mono text-base block font-black">R$ {getOrderFinancials(currentOrder).grandTotal.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Payment Info */}
                        <div className="border-b border-dashed border-slate-400 my-2"></div>
                        <div className="text-center space-y-1 bg-slate-50 border border-slate-200 p-2 rounded">
                          <span className="block font-black text-[9px] uppercase tracking-wider">PIX CHAVE CNPJ</span>
                          <span className="block font-mono font-extrabold text-[12px] bg-slate-950 text-amber-500 py-1 px-1 rounded">64.712.625/0001-69</span>
                          <span className="text-[7.5px] text-slate-500 block uppercase leading-none mt-1 font-bold">Banco: Sicredi | PitStop Distribuidora COHAB</span>
                        </div>

                        {/* QR code / Footer info */}
                        <div className="flex flex-col items-center justify-center text-center mt-3 pt-2">
                          <div className="p-1 bg-white flex items-center justify-center rounded-lg border border-slate-200 mb-1.5 shadow-sm">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&color=09090b&data=${encodeURIComponent(
                                `00020101021226540014br.gov.bcb.pix0114647126250001695204000053039865405${(currentOrder ? getOrderFinancials(currentOrder).grandTotal : 0).toFixed(2)}5802BR5913PITSTOPCOHAB6008PRUDENTE62070503***6304`
                              )}`}
                              alt="Pix QR Code"
                              className="w-16 h-16 object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Agradecemos a Preferência!</span>
                          <span className="text-[8.5px] text-slate-600 block">Siga no Instagram: @pitstop_cohab</span>
                        </div>

                        {/* Thermal signatures */}
                        <div className="hidden print:block mt-8 pt-4 border-t border-slate-400 text-center space-y-8">
                          <div className="space-y-1">
                            <div className="border-b border-slate-400 w-4/5 mx-auto"></div>
                            <span className="text-[7.5px] uppercase font-bold">Vendedor / Admin PitStop</span>
                          </div>
                          <div className="space-y-1">
                            <div className="border-b border-slate-400 w-4/5 mx-auto"></div>
                            <span className="text-[7.5px] uppercase font-bold">Assinatura do Responsável</span>
                          </div>
                        </div>

                      </div>
                    </>
                  )}
                </div>

              </div>
              
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
              <Box className="w-12 h-12 text-slate-300 animate-pulse" />
              <div className="text-center">
                <h3 className="font-display font-black text-sm text-slate-900">Fila de Consignados</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs px-4 leading-normal">
                  Selecione um pedido consignado na listagem à esquerda para visualizar, imprimir comprovante, atualizar unidades devolvidas ou liquidar a conta do evento.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div id="create-consign-modal" className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 w-full max-w-3xl relative shadow-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100 gold-glow-strong"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-850 mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-gold-400 border border-amber-500/20 flex items-center justify-center">
                    <Box className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base text-slate-100">
                      {isEditing ? `Editar Guia Consignado ${editingOrderId}` : 'Novo Consignado Eventos'}
                    </h3>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {isEditing ? 'Altere produtos, adicione mais itens, mais caixas térmicas (patrimônios) ou modifique taxas' : 'Registre fardos, bebidas e vasilhames para festividades externas'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCloseCreateModal}
                  className="p-1.5 bg-slate-950 hover:bg-slate-850 text-slate-400 border border-slate-800 rounded-lg text-xs cursor-pointer transition flex items-center justify-center active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid split form layout */}
              <form onSubmit={handleSaveDraftConsignment} className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  
                  {/* Left Column Fields (7 cols) */}
                  <div className="md:col-span-7 space-y-4">
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest pl-0.5">Identificação e Prazos</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1">
                          <User className="w-3 h-3 text-amber-500" />
                          Nome do Cliente *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="EX: Roberto Vasconcelos"
                          value={newCustomerName}
                          onChange={(e) => setNewCustomerName(e.target.value)}
                          className="w-full bg-slate-850 border border-slate-200 text-slate-100 rounded-xl py-2 px-3 text-xs outline-none focus:border-amber-500 hover:border-slate-300 font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1">
                          <Phone className="w-3 h-3 text-amber-500" />
                          Celular / Telefone *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="EX: (98) 98112-2334"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="w-full bg-slate-850 border border-slate-200 text-slate-100 rounded-xl py-2 px-3 text-xs outline-none focus:border-amber-500 hover:border-slate-300 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-550 uppercase">CPF Garantia</label>
                        <input
                          type="text"
                          placeholder="EX: 123.456.789-00"
                          value={newCpf}
                          onChange={(e) => setNewCpf(e.target.value)}
                          className="w-full bg-slate-850 border border-slate-200 text-slate-100 rounded-xl py-1.5 px-3 text-xs outline-none focus:border-amber-500 font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-550 uppercase">Data Entrega</label>
                        <input
                          type="date"
                          value={newDeliveryDate}
                          onChange={(e) => setNewDeliveryDate(e.target.value)}
                          className="w-full bg-slate-850 border border-slate-200 text-slate-100 rounded-xl py-1.5 px-2.5 text-[11px] outline-none focus:border-amber-500 font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-550 uppercase">Data Evento</label>
                        <input
                          type="date"
                          value={newEventDate}
                          onChange={(e) => setNewEventDate(e.target.value)}
                          className="w-full bg-slate-850 border border-slate-200 text-slate-100 rounded-xl py-1.5 px-2.5 text-[11px] outline-none focus:border-amber-500 font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-550 uppercase">Endereço de Destino (Local do Evento)</label>
                      <input
                        type="text"
                        placeholder="EX: Chácara Olho D'Água, Rua das Flores Nº 10"
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        className="w-full bg-slate-850 border border-slate-200 text-slate-100 rounded-xl py-2 px-3 text-xs outline-none focus:border-amber-500 font-bold"
                      />
                    </div>

                    {/* Temporary items builder */}
                    <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl space-y-3.5 shadow-sm">
                      <span className="text-[10px] font-black text-slate-100 block border-b border-slate-800 pb-1 uppercase">
                        Vincular Categoria de Bebidas
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-6 relative">
                          <label className="text-[8px] font-extrabold uppercase text-slate-400 block mb-0.5">Descrição do Produto</label>
                          <input
                            type="text"
                            placeholder="Pesquise o produto cadastrado..."
                            value={tempItemName}
                            onChange={(e) => {
                              setTempItemName(e.target.value);
                              setShowProductDropdown(true);
                            }}
                            onFocus={() => setShowProductDropdown(true)}
                            className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg py-1.5 px-3 text-xs outline-none focus:border-amber-500 font-bold"
                          />
                          {showProductDropdown && (
                            <div className="absolute left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl shadow-xl divide-y divide-slate-850">
                              {products.filter(p => 
                                !tempItemName || p.name.toLowerCase().includes(tempItemName.toLowerCase())
                              ).slice(0, 8).map((prod) => (
                                <button
                                  key={prod.id}
                                  type="button"
                                  onClick={() => {
                                    setTempItemName(prod.name);
                                    setTempItemPrice(prod.price.toString());
                                    setShowProductDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-200 flex justify-between items-center transition-colors cursor-pointer"
                                >
                                  <span className="truncate">{prod.name}</span>
                                  <span className="font-mono text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded font-bold shrink-0 ml-1">
                                    R$ {prod.price.toFixed(2)}
                                  </span>
                                </button>
                              ))}
                              {products.filter(p => 
                                !tempItemName || p.name.toLowerCase().includes(tempItemName.toLowerCase())
                              ).length === 0 && (
                                <div className="p-3 text-center text-[11px] text-slate-500 font-bold">
                                  Nenhum produto correspondente cadastrado.
                                </div>
                              )}
                            </div>
                          )}
                          {showProductDropdown && (
                            <div 
                              className="fixed inset-0 z-20" 
                              onClick={() => setShowProductDropdown(false)} 
                            />
                          )}
                        </div>
                        <div className="sm:col-span-3 z-10 relative">
                          <label className="text-[8px] font-extrabold uppercase text-slate-400 block mb-0.5">Preço Unit/Caixa</label>
                          <input
                            type="number"
                            placeholder="EX: 49.90"
                            value={tempItemPrice}
                            onChange={(e) => setTempItemPrice(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg py-1.5 px-3 text-xs outline-none focus:border-amber-500 font-bold"
                          />
                        </div>
                        <div className="sm:col-span-3 z-10 relative">
                          <label className="text-[8px] font-extrabold uppercase text-slate-400 block mb-0.5">Qtd Concedida</label>
                          <input
                            type="number"
                            placeholder="EX: 20"
                            value={tempItemQuantity}
                            onChange={(e) => setTempItemQuantity(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg py-1.5 px-3 text-xs outline-none focus:border-amber-500 font-bold"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddTempItem}
                        className="w-full py-2 bg-slate-900 text-gold-500 border border-slate-800 hover:bg-slate-850 hover:text-white rounded-lg text-xs font-black cursor-pointer transition duration-150 active:scale-95"
                      >
                        + Confirmar Bebida na Nota
                      </button>

                      {/* Display added items inside popup */}
                      {newItems.length > 0 && (
                        <div className="pt-1.5">
                          <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Insumos já adicionados:</span>
                          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 max-h-24 overflow-y-auto space-y-1 shadow-inner">
                            {newItems.map((it, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[11px] text-slate-100 font-bold">
                                <span>{it.name} ({it.quantityConsigned} un)</span>
                                <div className="flex items-center gap-2 font-mono">
                                  <strong>R$ {(it.price * it.quantityConsigned).toFixed(2)}</strong>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTempItem(idx)}
                                    className="text-red-400 hover:text-red-500 font-black cursor-pointer text-[10px]"
                                  >
                                    Remover
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase">Observações Operacionais</label>
                      <textarea
                        placeholder="Contrato assinado em loja. Prever fornecimento de gelo moído complementar no local da festa."
                        value={newObservation}
                        onChange={(e) => setNewObservation(e.target.value)}
                        className="w-full bg-slate-850 border border-slate-200 text-slate-100 rounded-xl py-2 px-3 text-xs outline-none h-14 resize-none font-semibold focus:border-amber-500"
                      ></textarea>
                    </div>

                  </div>
                  
                  {/* Right Column Fields (5 cols) */}
                  <div className="md:col-span-5 space-y-4">
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest pl-0.5">Equipamentos e Atalhos</h4>

                    {/* Asset builder widget */}
                    <div className="bg-slate-900/60 p-3 border border-slate-800 rounded-xl space-y-3 shadow-md">
                      <span className="text-[10px] font-black text-slate-300 block border-b border-slate-800 pb-1.5 uppercase">
                        Patrimônio / Cooler Alugado
                      </span>

                      <div className="space-y-2">
                        <label className="text-[8px] font-extrabold uppercase text-slate-400 block mb-0.5">Descrição do Material</label>
                        <input
                          type="text"
                          placeholder="EX: Cooler Azul Térmico 45L"
                          value={tempAssetName}
                          onChange={(e) => setTempAssetName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg py-1.5 px-3 text-xs outline-none font-bold focus:border-amber-500 transition placeholder-slate-600"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] font-extrabold uppercase text-slate-400 block mb-0.5">Quantidade</label>
                            <input
                              type="number"
                              placeholder="1"
                              value={tempAssetQuantity}
                              onChange={(e) => setTempAssetQuantity(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg py-1.5 px-3 text-xs outline-none font-bold focus:border-amber-500 transition"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-extrabold uppercase text-slate-400 block mb-0.5">Taxa Perda (Unidade)</label>
                            <input
                              type="number"
                              placeholder="150"
                              value={tempAssetDeposit}
                              onChange={(e) => setTempAssetDeposit(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg py-1.5 px-3 text-xs outline-none font-bold focus:border-amber-500 transition"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddTempAsset}
                        className="w-full py-2 bg-slate-950 text-gold-500 border border-slate-800 hover:bg-slate-900 hover:text-white rounded-lg text-xs font-black cursor-pointer transition duration-150 active:scale-95"
                      >
                        + Vincular Equipamento
                      </button>

                      {/* Display added assets inside popup */}
                      {newAssets.length > 0 && (
                        <div className="pt-1.5">
                          <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Patrimônios anexados:</span>
                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 max-h-24 overflow-y-auto space-y-1 shadow-inner">
                            {newAssets.map((as, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[10px] text-slate-300 font-bold">
                                <span className="truncate max-w-[120px]">{as.name} ({as.quantity} un)</span>
                                <div className="flex items-center gap-1.5 font-mono">
                                  <strong className="text-red-400 font-black">Multa: R$ {as.securityDepositValue}</strong>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTempAsset(idx)}
                                    className="text-red-500 hover:text-red-400 font-black cursor-pointer text-[9px]"
                                  >
                                    Remover
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Speed templates panel */}
                    <div className="bg-slate-900/60 p-3.5 border border-slate-800 rounded-xl">
                      <span className="text-[9px] font-black uppercase text-amber-500 block mb-2 tracking-wider">
                        Atalhos Rápidos de Eventos
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        
                        <div className="p-2 bg-slate-950 border border-slate-850 hover:border-amber-500/50 hover:bg-slate-900 rounded-lg text-[10px] text-slate-300 font-bold cursor-pointer flex justify-between items-center transition"
                          onClick={() => insertPresetProduct("Cerveja Heineken 600ml (Caixa de 24 un)", 384.00)}>
                          <span>Caixa Heineken (24 un)</span>
                          <span className="font-mono text-amber-500 font-black">R$ 384,00</span>
                        </div>

                        <div className="p-2 bg-slate-950 border border-slate-850 hover:border-amber-500/50 hover:bg-slate-900 rounded-lg text-[10px] text-slate-300 font-bold cursor-pointer flex justify-between items-center transition"
                          onClick={() => insertPresetProduct("Cerveja Spaten 600ml (Caixa de 24 un)", 336.00)}>
                          <span>Caixa Spaten/Amstel (24 un)</span>
                          <span className="font-mono text-amber-600 font-black">R$ 336,00</span>
                        </div>

                        <div className="p-2 bg-slate-950 border border-slate-850 hover:border-amber-500/50 hover:bg-slate-900 rounded-lg text-[10px] text-slate-300 font-bold cursor-pointer flex justify-between items-center transition"
                          onClick={() => insertPresetProduct("Saco de Gelo Conservado 10kg", 15.00)}>
                          <span>Saco de Gelo Moído 10kg</span>
                          <span className="font-mono text-amber-600 font-black">R$ 15,00</span>
                        </div>

                        <div className="p-2 bg-slate-950 border border-slate-850 hover:border-red-500/50 hover:bg-slate-900 rounded-lg text-[10px] text-slate-300 font-bold cursor-pointer flex justify-between items-center transition"
                          onClick={() => insertPresetAsset("Caixa Térmica de Inox 120L", 250)}>
                          <span>Vasilhame Caixa Térmica 120L</span>
                          <span className="text-red-400 font-black font-mono">Caução R$ 250</span>
                        </div>

                        <div className="p-2 bg-slate-950 border border-slate-850 hover:border-red-500/50 hover:bg-slate-900 rounded-lg text-[10px] text-slate-300 font-bold cursor-pointer flex justify-between items-center transition"
                          onClick={() => insertPresetAsset("Caixa Térmica Plástica Especial 45L", 120)}>
                          <span>Vasilhame Caixa Térmica 45L</span>
                          <span className="text-red-400 font-black font-mono">Caução R$ 120</span>
                        </div>

                      </div>
                    </div>

                     {/* Operational trigger dispatch controls */}
                    <div className="pt-3 grid grid-cols-2 gap-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={handleCloseCreateModal}
                        className="py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded-xl text-xs font-black cursor-pointer transition flex items-center justify-center active:scale-95"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black cursor-pointer shadow-md flex items-center justify-center gap-1.5 transition duration-150 active:scale-95 font-sans uppercase tracking-wider"
                      >
                        <Check className="w-4 h-4 stroke-[3]" strokeWidth={3} />
                        {isEditing ? 'Salvar Edição' : 'Gerar Guia'}
                      </button>
                    </div>

                  </div>

                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settle pay model popup drawer */}
      <AnimatePresence>
        {showPayModal && currentOrder && (
          <div id="consign-pay-overlay" className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md relative shadow-2xl text-slate-100 gold-glow"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-950/55 text-emerald-400 border border-emerald-900/40 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 font-bold" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-sm text-slate-100 leading-none">Liquidar Consignado</h3>
                    <span className="text-[10px] text-slate-500 mt-1 block font-semibold">Apurado com base no conferido e devolvido</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="p-1.5 bg-slate-950 hover:bg-slate-850 text-slate-400 border border-slate-800 rounded-lg text-xs cursor-pointer transition flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Recapitulation summary sheet (total text elements black) */}
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl mb-4.5 space-y-2.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span className="font-semibold">Código da Guia:</span>
                  <span className="font-mono font-black text-amber-500">#{currentOrder.id.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span className="font-semibold">Responsável:</span>
                  <span className="font-black text-slate-100">{currentOrder.customerName}</span>
                </div>
                
                <div className="border-t border-slate-800 pt-2 flex justify-between text-xs font-semibold text-slate-400">
                  <span>Insumos Consumidos:</span>
                  <span className="font-mono font-black text-slate-100">
                    R$ {getOrderFinancials(currentOrder).itemsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between text-xs font-semibold text-red-400">
                  <span>Equipamentos Perdidos:</span>
                  <span className="font-mono font-black text-red-500">
                    R$ {getOrderFinancials(currentOrder).pendingAssetsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="border-t border-dashed border-slate-800 pt-2.5 flex justify-between items-end">
                  <span className="text-xs font-black text-slate-350 uppercase">Total Arrecadado:</span>
                  <strong className="text-lg sm:text-xl font-mono font-black text-emerald-400 block">
                    R$ {getOrderFinancials(currentOrder).grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {/* Payment choice box */}
              <div className="space-y-2 mb-5">
                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest pl-1">Forma de Liquidação</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition ${
                      paymentMethod === 'PIX'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500 font-extrabold shadow-sm shadow-amber-500/15'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700 font-semibold'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="text-[10px] font-black">PIX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cartão')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition ${
                      paymentMethod === 'Cartão'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500 font-extrabold shadow-sm shadow-amber-500/15'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700 font-semibold'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-[10px] font-black">Cartão</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Dinheiro')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition ${
                      paymentMethod === 'Dinheiro'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500 font-extrabold shadow-sm shadow-amber-500/15'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700 font-semibold'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span className="text-[10px] font-black">Dinheiro</span>
                  </button>
                </div>
              </div>

              {/* Action trigger submit */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="py-3 bg-slate-950 hover:bg-slate-850 text-slate-400 border border-slate-850 rounded-xl text-xs font-black cursor-pointer transition flex items-center justify-center active:scale-95"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSettlePayment}
                  className="py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 border border-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition duration-150 active:scale-95 font-sans uppercase tracking-wider"
                >
                  <Check className="w-4 h-4 stroke-[3]" strokeWidth={3} />
                  Quitar Conta
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
