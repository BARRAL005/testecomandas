import React, { useState } from 'react';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Coins, 
  FileText, 
  Lock, 
  Unlock, 
  Plus, 
  Minus,
  Check, 
  X,
  CreditCard,
  QrCode
} from 'lucide-react';
import { Comanda, ActivityLog, RegisterTransaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CaixaViewProps {
  comandas: Comanda[];
  paidComandas: Comanda[];
  addActivityLog: (type: ActivityLog['type'], title: string, details: string, value?: number) => void;
  cashTransactions: RegisterTransaction[];
  setCashTransactions: React.Dispatch<React.SetStateAction<RegisterTransaction[]>>;
}


export default function CaixaView({ comandas, paidComandas, addActivityLog, cashTransactions, setCashTransactions }: CaixaViewProps) {
  const [isRegisterOpen, setIsRegisterOpen] = useState(true);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [flowType, setFlowType] = useState<'suprimento' | 'sangria'>('suprimento');
  const [flowValue, setFlowValue] = useState('');
  const [flowDesc, setFlowDesc] = useState('');

  // Initial Cash on Drawer
  const [openingBalance, setOpeningBalance] = useState<number>(350.00);
  
  // Custom manual cash additions (suprimentos / sangrias) now come from App/Firebase.
  const manualTransactions = cashTransactions;

  const calculateComandaTotal = (comanda: Comanda) => {
    const subtotal = comanda.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let total = subtotal;
    if (comanda.serviceCharge) {
      total += subtotal * 0.10;
    }
    if (comanda.discount) {
      total -= comanda.discount;
    }
    return Math.max(0, total);
  };

  // Convert paid comandas to transactions array
  const comandaTransactions: RegisterTransaction[] = paidComandas.map(c => ({
    id: `c_tr_${c.id}`,
    type: 'entrada',
    tag: 'comanda',
    title: `Recebimento Comanda #${c.id}`,
    value: calculateComandaTotal(c),
    timestamp: c.closedAt || '21:00',
    method: c.paymentMethod || 'PIX'
  }));

  // Combine actions and sort by timestamp
  const allTransactions = [...manualTransactions, ...comandaTransactions].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Current Math
  const totalInflows = allTransactions.filter(t => t.type === 'entrada').reduce((sum, t) => sum + t.value, 0);
  const totalOutflows = allTransactions.filter(t => t.type === 'saida').reduce((sum, t) => sum + t.value, 0);
  const currentBoxBalance = totalInflows - totalOutflows;

  // Breakdown by Method
  const cashTotal = allTransactions.filter(t => t.method === 'Dinheiro').reduce((sum, t) => sum + (t.type === 'entrada' ? t.value : -t.value), 0);
  const cardTotal = allTransactions.filter(t => t.method === 'Cartão').reduce((sum, t) => sum + t.value, 0);
  const pixTotal = allTransactions.filter(t => t.method === 'PIX').reduce((sum, t) => sum + t.value, 0);

  // Submit manual flows
  const handleAddFlow = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(flowValue);
    if (isNaN(val) || val <= 0) {
      alert("Por favor insira um preço válido!");
      return;
    }

    const newTr: RegisterTransaction = {
      id: `man_${Date.now()}`,
      type: flowType === 'suprimento' ? 'entrada' : 'saida',
      tag: flowType,
      title: flowDesc.trim() || (flowType === 'suprimento' ? 'Aporte Administrativo' : 'Retirada de Caixa'),
      value: val,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      method: 'Dinheiro'
    };

    setCashTransactions((curr) => [newTr, ...curr]);
    addActivityLog(
      'close_register', 
      flowType === 'suprimento' ? 'Suprimento lançado' : 'Sangria realizada', 
      `${newTr.title}: R$ ${val.toFixed(2)}`
    );
    
    setFlowValue('');
    setFlowDesc('');
    setShowFlowModal(false);
  };

  const handleOpenFlow = (type: 'suprimento' | 'sangria') => {
    if (!isRegisterOpen) {
      alert("Abra o caixa antes de fazer lançamentos!");
      return;
    }
    setFlowType(type);
    setFlowDesc('');
    setFlowValue('');
    setShowFlowModal(true);
  };

  return (
    <div id="caixa-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white leading-tight">Fluxo de Caixa</h2>
          <p className="text-sm text-slate-400">Gerencie a abertura e fechamento, suprimentos de troco, sangrias de gaveta e despesas do dia.</p>
        </div>

        {/* Open Close status toggler */}
        <button
          onClick={() => {
            setIsRegisterOpen(!isRegisterOpen);
            addActivityLog(
              'close_register', 
              isRegisterOpen ? 'Caixa fechado' : 'Caixa reaberto', 
              `Administrador alterou status operacional do terminal`
            );
          }}
          className={`flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer select-none active:scale-95 shrink-0 ${
            isRegisterOpen 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {isRegisterOpen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {isRegisterOpen ? 'CAIXA OPERANDO: ABERTO' : 'CAIXA CONCLUÍDO: FECHADO'}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 - Saldo em Caixa */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Saldo Total em Caixa</span>
          <h3 className="text-2xl font-display font-black text-gold-500 mt-1">
            R$ {currentBoxBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-2">Saldo físico líquido consolidado</p>
        </div>

        {/* Card 2 - Caixa em Dinheiro */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-gold-500" />
            Gaveta Dinheiro Físico
          </span>
          <h3 className="text-2xl font-display font-bold text-white mt-1">
            R$ {cashTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-2">Dinheiro em papel mais troco de fundo</p>
        </div>

        {/* Card 3 - Recebido em PIX */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-sky-400" />
            Vendas em PIX
          </span>
          <h3 className="text-2xl font-display font-bold text-slate-200 mt-1">
            R$ {pixTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 mt-2">Transferências bancárias diretas</p>
        </div>

        {/* Card 4 - Caixa em Cartão */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-purple-400" />
            Maquininha Cartão
          </span>
          <h3 className="text-2xl font-display font-bold text-slate-200 mt-1">
            R$ {cardTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 mt-2">Vendas débito e crédito</p>
        </div>
      </div>

      {/* Primary Panels splitscreen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Transactions log (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col max-h-[460px] overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-semibold text-white">Transações e Entradas do Turno</h3>
            
            {/* Quick Actions sangria suprimento dropdown style buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenFlow('suprimento')}
                className="bg-slate-950 hover:bg-slate-850 hover:text-white border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:border-gold-500/20 flex items-center gap-1 cursor-pointer transition"
              >
                <Plus className="w-3 h-3 text-gold-500 bg-gold-500/10 p-0.2 rounded" strokeWidth={2.5} />
                Lançar Suprimento
              </button>
              <button
                onClick={() => handleOpenFlow('sangria')}
                className="bg-slate-950 hover:bg-slate-850 hover:text-white border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:border-gold-500/20 flex items-center gap-1 cursor-pointer transition"
              >
                <Minus className="w-3 h-3 text-red-400 bg-red-400/10 p-0.2 rounded" strokeWidth={2.5} />
                Lançar Sangria
              </button>
            </div>
          </div>

          {/* List of transitions */}
          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
            {allTransactions.map((t) => {
              const isEntrada = t.type === 'entrada';
              return (
                <div
                  key={t.id}
                  className="bg-slate-950 border border-slate-900/60 p-3 rounded-xl flex items-center justify-between hover:border-slate-800 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isEntrada ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {isEntrada ? <ArrowDownLeft className="w-4.5 h-4.5" /> : <ArrowUpRight className="w-4.5 h-4.5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{t.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">
                        {t.tag} • {t.method}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-mono font-extrabold ${isEntrada ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isEntrada ? '+' : '-'} R$ {t.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">{t.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar help guidelines (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
          <h3 className="font-display font-semibold text-white">Manual Operacional de Sangrias</h3>
          
          <div className="space-y-3.5 text-xs text-slate-400 leading-relaxed">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-900">
              <h5 className="font-bold text-slate-200 mb-1">Suprimento (Fundo de Gaveta)</h5>
              <p className="text-[11px] text-slate-500">Utilize o suprimento administrativo para registrar incrementos de moedas e notas em espécie de troco inicial.</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-900">
              <h5 className="font-bold text-slate-200 mb-1">Sangria (Prevenção e Coleta)</h5>
              <p className="text-[11px] text-slate-500">A sangria permite esvaziar parcialmente montantes de alto valor acumulados em dinheiro do bar para envio ao cofre seguro.</p>
            </div>

            <div className="p-3 bg-gold-500/5 border border-gold-500/25 text-gold-500 rounded-2xl flex items-start gap-2.5">
              <Coins className="w-5 h-5 shrink-0" />
              <div>
                <h6 className="font-extrabold text-[11px] uppercase tracking-wide">Importante</h6>
                <p className="text-[10px] text-gold-400 mt-1">Todos os lançamentos efetuados retroalimentam as estatísticas de caixa unificado no ato.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sangria Suprimento Modal */}
      <AnimatePresence>
        {showFlowModal && (
          <div id="flow-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm relative gold-glow-strong"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
                <div>
                  <h3 className="font-display font-extrabold text-white text-base uppercase tracking-wide">
                    {flowType === 'suprimento' ? 'Lançar de Suprimento' : 'Lançar de Sangria'}
                  </h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Operações de caixa em espécie</span>
                </div>
                <button 
                  onClick={() => setShowFlowModal(false)}
                  className="p-1 px-2.5 bg-slate-950 text-slate-400 hover:text-white border border-slate-850 rounded text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddFlow} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Valor R$</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 text-xs font-mono">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0,00"
                      value={flowValue}
                      onChange={(e) => setFlowValue(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-gold-500 text-white rounded-xl py-2 pl-9 pr-4 text-xs font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Motivo / Descrição</label>
                  <input
                    type="text"
                    placeholder="ex: Retirada p/ malote segurança"
                    value={flowDesc}
                    onChange={(e) => setFlowDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-gold-500 text-white rounded-xl py-2 px-3.5 text-xs outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowFlowModal(false)}
                    className="py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 bg-gold-500 hover:bg-gold-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer shadow-md gold-glow flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    Confirmar Lançamento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
