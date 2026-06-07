import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  FolderPlus, 
  DollarSign, 
  User, 
  Hash, 
  Percent, 
  CheckCircle,
  Clock,
  Phone,
  Coins,
  CreditCard,
  QrCode,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { Comanda, Product, ComandaItem, ActivityLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ComandasViewProps {
  comandas: Comanda[];
  products: Product[];
  selectedComandaId: string | null;
  setSelectedComandaId: (id: string | null) => void;
  onUpdateComanda: (comanda: Comanda) => void;
  onPayComanda: (comandaId: string, paymentMethod: 'PIX' | 'Cartão' | 'Dinheiro', finalValue: number, discount: number, serviceChargeApplied: boolean) => void;
  onCancelComanda?: (id: string) => void;
  setOpenNewComandaModal: (open: boolean) => void;
  addActivityLog: (type: ActivityLog['type'], title: string, details: string, value?: number) => void;
}

export default function ComandasView({
  comandas,
  products,
  selectedComandaId,
  setSelectedComandaId,
  onUpdateComanda,
  onPayComanda,
  onCancelComanda,
  setOpenNewComandaModal,
  addActivityLog
}: ComandasViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Cartão' | 'Dinheiro'>('PIX');
  const [mobileSubTab, setMobileSubTab] = useState<'consumption' | 'catalog'>('consumption');
  
  // Custom states for checkouts
  const [discountInput, setDiscountInput] = useState<string>('');
  const [cashReceived, setCashReceived] = useState<string>('');

  // Selected comanda data
  const openComandas = comandas.filter(c => c.status === 'open');
  const currentComanda = openComandas.find(c => c.id === selectedComandaId) || null;

  // Search filtered comandas
  const filteredComandas = openComandas.filter(c => 
    c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.includes(searchTerm) ||
    `#${c.id}`.includes(searchTerm)
  );

  // Math totals for active comanda
  const getSubtotal = (comanda: Comanda) => {
    return comanda.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getServiceCharge = (comanda: Comanda) => {
    return comanda.serviceCharge ? getSubtotal(comanda) * 0.10 : 0;
  };

  const getFinalTotal = (comanda: Comanda) => {
    const sub = getSubtotal(comanda);
    const tax = getServiceCharge(comanda);
    const disc = comanda.discount || 0;
    return Math.max(0, sub + tax - disc);
  };

  // Adjust quantities of item inside current comanda
  const handleUpdateQty = (productId: string, delta: number) => {
    if (!currentComanda) return;
    
    const updatedItems = currentComanda.items.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    });

    onUpdateComanda({
      ...currentComanda,
      items: updatedItems
    });
  };

  // Set notes for a specific item
  const handleSetNotes = (productId: string, notes: string) => {
    if (!currentComanda) return;
    const updatedItems = currentComanda.items.map(item => {
      if (item.productId === productId) {
        return { ...item, notes };
      }
      return item;
    });
    onUpdateComanda({ ...currentComanda, items: updatedItems });
  };

  // Remove item
  const handleRemoveItem = (productId: string, name: string) => {
    if (!currentComanda) return;
    const updatedItems = currentComanda.items.filter(item => item.productId !== productId);
    onUpdateComanda({ ...currentComanda, items: updatedItems });
    addActivityLog('add_item', `Comanda #${currentComanda.id} atualizada`, `${currentComanda.customerName} removeu item: ${name}`);
  };

  // Add product to comanda consumption
  const handleAddProduct = (product: Product) => {
    if (!currentComanda) return;

    const existingItem = currentComanda.items.find(item => item.productId === product.id);
    let updatedItems: ComandaItem[] = [];

    const timeString = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (existingItem) {
      updatedItems = currentComanda.items.map(item => {
        if (item.productId === product.id) {
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      });
    } else {
      updatedItems = [
        ...currentComanda.items,
        {
          productId: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          quantity: 1,
          addedAt: timeString
        }
      ];
    }

    onUpdateComanda({
      ...currentComanda,
      items: updatedItems
    });

    addActivityLog(
      'add_item', 
      `Comanda #${currentComanda.id} atualizada`, 
      `${currentComanda.customerName} adicionou ${product.name}`,
      product.price
    );
  };

  const handleToggleService = () => {
    if (!currentComanda) return;
    onUpdateComanda({
      ...currentComanda,
      serviceCharge: !currentComanda.serviceCharge
    });
  };

  const handleApplyDiscount = () => {
    if (!currentComanda) return;
    const value = parseFloat(discountInput) || 0;
    onUpdateComanda({
      ...currentComanda,
      discount: value > 0 ? value : undefined
    });
    setDiscountInput('');
  };

  // Start payment checkout trigger
  const handleStartCheckout = () => {
    if (!currentComanda || currentComanda.items.length === 0) {
      alert("A comanda precisa ter pelo menos 1 produto para ser finalizada!");
      return;
    }
    setCashReceived('');
    setShowPayModal(true);
  };

  // Complete Payment Action
  const handleCompletePayment = () => {
    if (!currentComanda) return;
    
    const finalValue = getFinalTotal(currentComanda);
    const disc = currentComanda.discount || 0;
    const serviceApplied = currentComanda.serviceCharge || false;

    if (paymentMethod === 'Dinheiro') {
      const receivedNum = parseFloat(cashReceived) || 0;
      if (receivedNum < finalValue) {
        alert("O valor recebido em dinheiro é inferior ao valor total cobrado!");
        return;
      }
    }

    onPayComanda(currentComanda.id, paymentMethod, finalValue, disc, serviceApplied);
    setShowPayModal(false);
    setSelectedComandaId(null);
  };

  // Categories in the cardapio
  const itemCategories = ['all', 'Bebidas', 'Cervejas', 'Destilados', 'Petiscos', 'Outros'];

  // Filter products for the catalog injection
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.category.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = activeCategoryFilter === 'all' || p.category === activeCategoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div id="comandas-view" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full lg:h-[calc(100vh-145px)]">
      {/* 1. Left Side: Searchable Open Comandas List (4 cols) */}
      <div className={`lg:col-span-4 bg-slate-900 border border-slate-800/80 rounded-3xl p-5 flex flex-col h-full overflow-hidden ${selectedComandaId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-white">Comandas Abertas</h3>
          <button
            onClick={() => setOpenNewComandaModal(true)}
            className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Nova comanda
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="search-comandas-page"
            type="text"
            placeholder="Buscar comanda ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-gold-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
          />
        </div>

        {/* List of active tabs */}
        <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
          {filteredComandas.length === 0 ? (
            <div className="text-center py-24 text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <Receipt className="w-8 h-8 text-slate-800 stroke-[1.5]" />
              <span>Nenhuma comanda ativa localizada.</span>
            </div>
          ) : (
            filteredComandas.map((comanda) => {
              const isSelected = selectedComandaId === comanda.id;
              const sub = getSubtotal(comanda);
              const itemsCount = comanda.items.reduce((acc, c) => acc + c.quantity, 0);

              return (
                <div
                  key={comanda.id}
                  id={`comanda-list-item-${comanda.id}`}
                  onClick={() => setSelectedComandaId(comanda.id)}
                  className={`border p-4 rounded-2xl cursor-pointer flex items-center justify-between hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group ${
                    isSelected 
                      ? 'bg-slate-950 border-gold-500 shadow-md' 
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1 z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gold-500">#{comanda.id}</span>
                      <h4 className="text-xs font-bold text-slate-100 group-hover:text-white transition-colors">{comanda.customerName}</h4>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-gold-500/80" />
                        {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {comanda.openedAt}
                      </span>
                    </div>
                    {comanda.createdBy && (
                      <div className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-1 tracking-tight">
                        <span>Op:</span>
                        <span className="text-gold-500/80 font-medium">{comanda.createdBy}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right z-10">
                    <span className={`text-xs font-mono font-black ${isSelected ? 'text-gold-500' : 'text-slate-200'}`}>
                      R$ {getFinalTotal(comanda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="block text-[9px] text-slate-500 tracking-normal mt-0.5">Clique para abrir</span>
                  </div>

                  {/* Little vertical edge color indicator */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${
                    isSelected ? 'bg-gold-500' : 'bg-slate-800'
                  }`} />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Side: Selected Comanda detailed management (8 cols) */}
      <div className={`lg:col-span-8 h-full flex flex-col overflow-hidden ${!selectedComandaId ? 'hidden lg:flex' : 'flex'}`}>
        {currentComanda ? (
          <div id="inspector-active-panel" className="bg-slate-900 border border-slate-800/80 rounded-3xl p-4 sm:p-5 flex flex-col h-full overflow-hidden relative">
            
            {/* Delete Confirmation Overlay */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-50 rounded-3xl p-6 flex flex-col items-center justify-center text-center select-none"
                >
                  <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                    <Trash2 className="w-7 h-7" />
                  </div>
                  <h3 className="font-display font-extrabold text-white text-lg">Excluir Comanda #{currentComanda.id}?</h3>
                  <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
                    Você tem certeza que deseja cancelar e apagar permanentemente esta comanda de <strong className="text-white">{currentComanda.customerName}</strong>? Esta ação é irreversível e removerá todo o consumo associado.
                  </p>
                  <div className="flex gap-3 mt-6 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-3 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Voltar, Não excluir
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onCancelComanda) {
                          onCancelComanda(currentComanda.id);
                        }
                        setShowDeleteConfirm(false);
                      }}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-lg shadow-red-900/10"
                    >
                      Sim, Apagar!
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inspector Header: Client details */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 mb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gold-500/10 border border-gold-500/20 text-gold-500 rounded-xl flex items-center justify-center">
                  <User className="w-[22px] h-[22px]" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display font-extrabold text-white text-base">{currentComanda.customerName}</h3>
                    <span className="text-[10px] h-4.5 px-2 bg-slate-950 font-mono font-bold text-gold-500 border border-gold-500/20 rounded-md flex items-center justify-center">
                      Comanda #{currentComanda.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    {currentComanda.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {currentComanda.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      Iniciada às {currentComanda.openedAt}
                    </span>
                  </div>
                  <div className="hidden sm:flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400 mt-2 border-t border-slate-800/40 pt-2">
                    {currentComanda.createdBy && (
                      <span className="px-2 py-0.5 bg-slate-950 text-slate-500 rounded-md border border-slate-800/60">
                        Aberta por: <strong className="text-gold-500 font-semibold">{currentComanda.createdBy}</strong>
                      </span>
                    )}
                    {currentComanda.updatedBy && (
                      <span className="px-2 py-0.5 bg-slate-950 text-slate-500 rounded-md border border-slate-800/60">
                        Última alteração: <strong className="text-amber-500 font-semibold">{currentComanda.updatedBy}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 px-2 bg-red-950/40 hover:bg-red-900 border border-red-500/20 text-red-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 transition"
                  title="Excluir Comanda"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Excluir</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedComandaId(null)}
                  className="p-1.5 px-2.5 bg-slate-950 hover:bg-slate-850 text-gold-500 hover:text-white rounded-lg text-xs font-bold cursor-pointer border border-slate-800/80 flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>
              </div>
            </div>

            {/* Mobile Sub-tabs Switcher for screen sizes < md */}
            <div className="flex md:hidden bg-slate-950 p-1 rounded-xl border border-slate-800/60 mb-3.5 select-none shrink-0">
              <button
                type="button"
                onClick={() => setMobileSubTab('consumption')}
                className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all ${
                  mobileSubTab === 'consumption'
                    ? 'bg-gold-500 text-slate-950 shadow-sm font-extrabold'
                    : 'text-slate-400'
                }`}
              >
                Itens de Consumo
              </button>
              <button
                type="button"
                onClick={() => setMobileSubTab('catalog')}
                className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all ${
                  mobileSubTab === 'catalog'
                    ? 'bg-gold-500 text-slate-950 shadow-sm font-extrabold'
                    : 'text-slate-400'
                }`}
              >
                + Adicionar Itens
              </button>
            </div>

            {/* Split Grid inside Inspector: Left = Consumed Items table, Right = Add Items Menu Catalog */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 overflow-hidden">
              
              {/* Consumption Items Area (7 cols) */}
              <div className={`md:col-span-7 flex flex-col h-full overflow-hidden ${mobileSubTab === 'consumption' ? 'flex' : 'hidden md:flex'}`}>
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Itens de Consumo</span>
                  <span className="text-xs bg-slate-950 font-mono px-2 py-0.5 rounded text-slate-300">
                    {currentComanda.items.length} tipo(s) de item
                  </span>
                </div>

                {/* Items scrollbox */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-4">
                  {currentComanda.items.length === 0 ? (
                    <div className="text-center py-20 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800/80 flex flex-col items-center justify-center gap-2">
                      <FolderPlus className="w-8 h-8 text-slate-700" />
                      <p className="text-xs text-slate-500 px-6 leading-relaxed">Esta comanda está vazia! Selecione produtos no painel à direita para adicionar itens de consumo.</p>
                    </div>
                  ) : (
                    currentComanda.items.map((item) => (
                      <div 
                        key={item.productId}
                        className="bg-slate-950 border border-slate-900 rounded-xl p-3 space-y-2 group hover:border-slate-800 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-100 group-hover:text-white transition-colors">{item.name}</h4>
                            <span className="text-[10px] text-gold-500 font-mono">
                              R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} un
                            </span>
                          </div>
                          
                          {/* Trash button */}
                          <button
                            onClick={() => handleRemoveItem(item.productId, item.name)}
                            className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded transition shadow-sm cursor-pointer opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Modifiers & Note Row */}
                        <div className="flex items-center justify-between gap-3 pt-1">
                          {/* Quantity Selector toggler */}
                          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                            <button
                              onClick={() => handleUpdateQty(item.productId, -1)}
                              className="w-5.5 h-5.5 rounded bg-slate-950 text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-800"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-mono font-bold text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQty(item.productId, 1)}
                              className="w-5.5 h-5.5 rounded bg-slate-950 text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-800"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Multiplier total */}
                          <div className="text-right flex items-center gap-2">
                            {/* In-Line Custom Notes Input */}
                            <input
                              type="text"
                              placeholder="Observação (ex: sem gelo...)"
                              value={item.notes || ''}
                              onChange={(e) => handleSetNotes(item.productId, e.target.value)}
                              className="bg-transparent border-0 focus:ring-0 text-[10px] text-slate-500 placeholder:text-slate-600 focus:placeholder:text-slate-500 text-right outline-none max-w-28 truncate"
                            />
                            
                            <span className="text-xs font-mono font-bold text-white shrink-0">
                              R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Subfooter calculation panel inside Left inspector column */}
                <div className="mt-auto bg-slate-950 border border-slate-900 p-4 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Insumos Subtotal</span>
                    <span className="font-mono font-semibold text-slate-200">
                      R$ {getSubtotal(currentComanda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Service Fee toggler */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <button 
                      onClick={handleToggleService}
                      className="flex items-center gap-1.5 hover:text-gold-400 cursor-pointer text-left transition"
                    >
                      <input 
                        type="checkbox" 
                        checked={currentComanda.serviceCharge || false}
                        onChange={handleToggleService}
                        className="rounded border-slate-800 bg-slate-900 text-gold-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer accent-gold-500"
                      />
                      <span>Taxa de Serviço 10%</span>
                    </button>
                    <span className="font-mono font-semibold text-slate-200">
                      R$ {getServiceCharge(currentComanda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Discount Application row */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <span>Desconto</span>
                      {currentComanda.discount && (
                        <button 
                          onClick={() => onUpdateComanda({ ...currentComanda, discount: undefined })}
                          className="text-[9px] text-red-400 hover:underline border border-red-500/20 bg-red-500/5 px-1 py-0.2 rounded"
                        >
                          remover
                        </button>
                      )}
                    </div>
                    {currentComanda.discount ? (
                      <span className="font-mono font-semibold text-red-400">
                        - R$ {currentComanda.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="R$ 0,00"
                          value={discountInput}
                          onChange={(e) => setDiscountInput(e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-[10px] w-14 px-1 rounded text-right tracking-tight outline-none"
                        />
                        <button 
                          onClick={handleApplyDiscount}
                          className="p-1 px-1.5 font-bold hover:bg-gold-500 hover:text-slate-950 text-[10px] bg-slate-900 border border-slate-800 rounded transition cursor-pointer text-gold-500"
                        >
                          aplicar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Total row and checkout button */}
                  <div className="pt-2.5 border-t border-slate-900 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Valor Total Cobrado</span>
                      <h3 className="text-xl font-display font-extrabold text-gold-500 mt-0.5">
                        R$ {getFinalTotal(currentComanda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h3>
                    </div>

                    <button
                      onClick={handleStartCheckout}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-md gold-glow cursor-pointer active:scale-95"
                    >
                      Encerrar & Pagar
                    </button>
                  </div>
                </div>
              </div>

              {/* Menu catalog insertion panel (5 cols) */}
              <div className={`md:col-span-5 flex flex-col h-full overflow-hidden border-l border-slate-800/40 pl-2 md:pl-4 ${mobileSubTab === 'catalog' ? 'flex' : 'hidden md:flex'}`}>
                <div className="mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Cardápio do PitStop</span>
                  
                  {/* Category Filter Pills on small scrollbox */}
                  <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                    {itemCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategoryFilter(cat)}
                        className={`text-[9px] px-2 py-1 font-bold rounded-lg cursor-pointer shrink-0 transition-all ${
                          activeCategoryFilter === cat
                            ? 'bg-gold-500 text-slate-950'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80 hover:bg-slate-900/60'
                        }`}
                      >
                        {cat === 'all' ? 'TODOS' : cat.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* Catalog search bar */}
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-600">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Pesquisar bebida, petisco..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-gold-500 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-slate-200 outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Listing of products inside comanda catalog insertion */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[340px]">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-10 text-[10px] text-slate-500">Nenhum produto cadastrado filter.</div>
                  ) : (
                    filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        id={`catalog-product-${p.id}`}
                        onClick={() => handleAddProduct(p)}
                        className="w-full text-left bg-slate-950/40 hover:bg-slate-950 border border-slate-900 hover:border-gold-500/30 p-2.5 rounded-xl flex items-center justify-between gap-3 group transition-all"
                      >
                        <div className="space-y-0.5 overflow-hidden">
                          <h4 className="text-[11px] font-bold text-slate-300 group-hover:text-white truncate transition-all">
                            {p.name}
                          </h4>
                          <span className="text-[9px] font-medium text-slate-500 block">
                            {p.category}
                          </span>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-gold-500">
                            R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <div className="w-5 h-5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 group-hover:bg-gold-500 group-hover:text-slate-950 group-hover:border-gold-500 flex items-center justify-center transition-all">
                            <Plus className="w-3 h-3" />
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-8 flex flex-col items-center justify-center text-center h-full">
            <div className="w-16 h-16 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-center text-gold-500 mb-4 animate-bounce">
              <Receipt className="w-8 h-8 text-gold-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-2">Comanda não selecionada</h3>
            <p className="text-xs text-slate-400 max-w-84 leading-relaxed">
              Dê um clique em qualquer comanda da listagem lateral para inspecionar, adicionar novos produtos, alterar consumos ou realizar fechamentos em tempo real.
            </p>
            <button
              onClick={() => {
                if (openComandas.length > 0) {
                  setSelectedComandaId(openComandas[0].id);
                } else {
                  setOpenNewComandaModal(true);
                }
              }}
              className="mt-6 bg-gold-500 hover:bg-gold-400 text-slate-950 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              {openComandas.length > 0 ? 'Selecionar Primeira Comanda' : 'Abrir primeira comanda'}
            </button>
          </div>
        )}
      </div>

      {/* 3. Interactive Payment Checkout Drawer Modal */}
      <AnimatePresence>
        {showPayModal && currentComanda && (
          <div id="payment-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md relative gold-glow-strong max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
                <div>
                  <h3 className="font-display font-extrabold text-white text-lg">Pagamento de Comanda</h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Comanda #{currentComanda.id} • {currentComanda.customerName}</span>
                </div>
                <button 
                  onClick={() => setShowPayModal(false)}
                  className="p-1 px-2.5 bg-slate-950 text-slate-400 hover:text-white border border-slate-800 rounded-lg text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Totals Summary */}
              <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl mb-4 text-center">
                <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">VALOR TOTAL DO CONSUMO</span>
                <h2 className="text-3xl font-display font-black text-gold-500 mt-1">
                  R$ {getFinalTotal(currentComanda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>
                {currentComanda.discount && (
                  <span className="text-[10px] text-red-400 block mt-1">Desconto de R$ {currentComanda.discount.toFixed(2)} já abatido</span>
                )}
              </div>

              {/* Payment Method Selector */}
              <span className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wide">Escolha a forma de pagamento</span>
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {[
                  { id: 'PIX', name: 'PIX/Transfer.', icon: QrCode },
                  { id: 'Cartão', name: 'Cartão/Maq.', icon: CreditCard },
                  { id: 'Dinheiro', name: 'Dinheiro Fís.', icon: Coins }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setPaymentMethod(item.id as any)}
                      className={`py-3.5 border rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-gold-500/10 border-gold-500 text-gold-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-bold tracking-tight">{item.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cash payment change calculator input */}
              {paymentMethod === 'Dinheiro' && (
                <div className="bg-slate-950 border border-slate-900 p-4.5 rounded-2xl mb-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Quantia Recebida</label>
                    <span className="text-[10px] text-slate-500">Mínimo: R$ {getFinalTotal(currentComanda).toFixed(2)}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 font-mono text-xs">R$</span>
                    <input
                      type="number"
                      placeholder="0,00"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-2 pl-9 pr-4 text-xs font-mono outline-none focus:border-gold-500"
                    />
                  </div>
                  {parseFloat(cashReceived) > getFinalTotal(currentComanda) && (
                    <div className="flex items-center justify-between text-xs bg-slate-900 border border-slate-800/60 p-2 rounded-lg">
                      <span className="text-slate-400 font-medium">Troco Recomendado</span>
                      <span className="font-mono font-extrabold text-emerald-400">
                        R$ {(parseFloat(cashReceived) - getFinalTotal(currentComanda)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic summary information depending on type */}
              {paymentMethod === 'PIX' && (
                <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl mb-4 flex items-center gap-3">
                  <div className="w-14 h-14 bg-white p-1 rounded-lg flex items-center justify-center shrink-0">
                    {/* Simulated elegant static QR vector */}
                    <div className="w-full h-full bg-slate-950 rounded flex items-center justify-center text-white text-[8px] font-mono select-none">
                      PIT PIX
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[11px] font-extrabold text-slate-200">Chave PIX do Estabelecimento</h5>
                    <p className="text-[10px] text-slate-400 font-mono select-all mt-0.5">pix@pitstopcohab.com.br</p>
                    <span className="text-[9px] text-slate-500 mt-1 block">Aponte o telefone ou use copiar e colar</span>
                  </div>
                </div>
              )}

              {/* Submit panel checkout triggers */}
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  onClick={() => setShowPayModal(false)}
                  className="py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCompletePayment}
                  className="py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-md gold-glow"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirmar Baixa
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
