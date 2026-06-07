import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Users, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag,
  Receipt,
  CheckCircle,
  Wine,
  Calendar,
  Clock,
  ExternalLink,
  FileDown
} from 'lucide-react';
import { Comanda, Product, ActivityLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { generateEstablishmentPDF } from '../utils/pdfGenerator';

interface DashboardViewProps {
  comandas: Comanda[];
  paidComandas: Comanda[];
  products: Product[];
  logs: ActivityLog[];
  setTab: (tab: string) => void;
  setSelectedComandaId: (id: string | null) => void;
  setOpenNewComandaModal: (open: boolean) => void;
  onClearDemoData?: () => void;
}

export default function DashboardView({
  comandas,
  paidComandas,
  products,
  logs,
  setTab,
  setSelectedComandaId,
  setOpenNewComandaModal,
  onClearDemoData
}: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [time, setTime] = useState(new Date());

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  };

  const formatTime = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // Calculations
  const openCount = comandas.filter(c => c.status === 'open').length;

  const calculateComandaTotal = (comanda: Comanda) => {
    const subtotal = comanda.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let total = subtotal;
    if (comanda.serviceCharge) {
      total += subtotal * 0.10; // 10%
    }
    if (comanda.discount) {
      total -= comanda.discount;
    }
    return Math.max(0, total);
  };

  // Total invoice for today (sums all paid comandas + active open ones as overall business volume)
  const paidTotalToday = paidComandas.reduce((sum, c) => sum + calculateComandaTotal(c), 0);
  const openTotalVolume = comandas.reduce((sum, c) => sum + calculateComandaTotal(c), 0);
  const revenueToday = paidTotalToday + openTotalVolume;

  const averageTicket = paidComandas.length > 0 
    ? paidTotalToday / paidComandas.length 
    : (comandas.length > 0 ? openTotalVolume / comandas.length : 0);

  // Category sales sums (paid + open for global picture)
  const categorySales: { [key: string]: number } = {
    'Bebidas': 0,
    'Cervejas': 0,
    'Destilados': 0,
    'Petiscos': 0,
    'Outros': 0
  };

  const addItemsToCategorySales = (itemCollection: any[]) => {
    itemCollection.forEach(item => {
      const cat = item.category || 'Outros';
      if (categorySales[cat] !== undefined) {
        categorySales[cat] += item.price * item.quantity;
      } else {
        categorySales['Outros'] += item.price * item.quantity;
      }
    });
  };

  comandas.forEach(c => addItemsToCategorySales(c.items));
  paidComandas.forEach(c => addItemsToCategorySales(c.items));

  const totalCatSum = Object.values(categorySales).reduce((a, b) => a + b, 0) || 1;

  // Pie chart parameters
  const categoriesList = [
    { name: 'Bebidas', color: '#0ea5e9', value: categorySales['Bebidas'] },
    { name: 'Cervejas', color: '#4f46e5', value: categorySales['Cervejas'] },
    { name: 'Destilados', color: '#8b5cf6', value: categorySales['Destilados'] },
    { name: 'Petiscos', color: '#10b981', value: categorySales['Petiscos'] },
    { name: 'Outros', color: '#94a3b8', value: categorySales['Outros'] }
  ].sort((a, b) => b.value - a.value);

  // Filter open comandas
  const filteredComandas = comandas
    .filter(c => c.status === 'open')
    .filter(c => 
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.includes(searchTerm) ||
      `#${c.id}`.includes(searchTerm)
    );

  // Custom high fidelity SVG donut chart calculations
  let accumulatedAngle = 0;
  const svgRadius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * svgRadius;

  const donutSlices = categoriesList.map((cat) => {
    const percentage = cat.value / totalCatSum;
    const angle = percentage * 360;
    const dashArray = `${(percentage * circumference).toFixed(2)} ${(circumference - (percentage * circumference)).toFixed(2)}`;
    const dashOffset = (-accumulatedAngle / 360 * circumference).toFixed(2);
    accumulatedAngle += angle;
    return {
      ...cat,
      percentage: (percentage * 100).toFixed(1),
      dashArray,
      dashOffset
    };
  });

  const handleOpenComanda = (comandaId: string) => {
    setSelectedComandaId(comandaId);
    setTab('comandas');
  };

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white leading-tight">Dashboard</h2>
          <p className="text-sm text-slate-400">Bem-vindo de volta, administrador!</p>
        </div>

        {/* Date, Time and Core Action Option */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
            <Calendar className="w-4 h-4 text-gold-500" />
            <span>{formatDate(time)}</span>
            <span className="w-px h-3 bg-slate-800 mx-1" />
            <Clock className="w-4 h-4 text-gold-500" />
            <span className="font-mono">{formatTime(time)}</span>
          </div>

          <button
            id="btn-exportar-pdf-top"
            onClick={() => generateEstablishmentPDF(comandas, paidComandas)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-gold-500 border border-slate-800 hover:border-gold-500/35 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg cursor-pointer gold-glow active:scale-95"
          >
            <FileDown className="w-4.5 h-4.5 stroke-[2.5]" />
            Exportar Relatório
          </button>

          <button
            id="btn-abrir-comanda-top"
            onClick={() => setOpenNewComandaModal(true)}
            className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-slate-950 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg cursor-pointer gold-glow active:scale-95"
          >
            <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
            Abrir Comanda
          </button>
        </div>
      </div>

      {/* Demo Data Alert Banner */}
      {(products.some(p => p.id === 'p1') || comandas.some(c => c.id === '001')) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Dados de Simulação Ativos</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                O aplicativo vem predefinido com produtos e comandas de teste. Deseja deletá-los e zerar o sistema para começar suas vendas reais?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onClearDemoData) {
                onClearDemoData();
              }
            }}
            className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all duration-300 shadow active:scale-95 cursor-pointer uppercase tracking-wider shrink-0"
          >
            Zerar e Começar do Zero
          </button>
        </div>
      )}

      {/* Grid of Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metr 1 - Comandas Abertas */}
        <div id="metric-open-comandas" className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-gold-500/20 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Comandas Abertas</span>
              <h3 className="text-2xl font-display font-bold text-white mt-1 group-hover:text-gold-500 transition-colors">{openCount}</h3>
              <p className="text-[11px] text-slate-500 mt-1">Total no momento</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-gold-500/10 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>

        {/* Metr 2 - Faturamento Hoje */}
        <div id="metric-faturamento-hoje" className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-gold-500/20 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Faturamento Hoje</span>
              <h3 className="text-2xl font-display font-bold text-gold-500 mt-1">
                R$ {revenueToday.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Total do dia (abertas + pagas)</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-gold-500/10 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>

        {/* Metr 3 - Ticket Médio */}
        <div id="metric-ticket-medio" className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-gold-500/20 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Ticket Médio</span>
              <h3 className="text-2xl font-display font-bold text-white mt-1">
                R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Média por comanda finalizada</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-gold-500/10 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>

        {/* Metr 4 - Produtos Cadastrados */}
        <div id="metric-produtos-cadastrados" className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-gold-500/20 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Produtos</span>
              <h3 className="text-2xl font-display font-bold text-white mt-1">{products.length}</h3>
              <p className="text-[11px] text-slate-500 mt-1">Cadastrados no cardápio</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-gold-500/10 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>
      </div>

      {/* Main Double Column Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Double-Grid Panel: Charts & Logs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sales by Category Card */}
          <div id="vendas-categoria-card" className="bg-slate-900 border border-slate-800/80 p-6 rounded-3xl relative overflow-hidden">
            {/* Background Logo Blur Accent */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.02] text-white select-none pointer-events-none pr-10">
              <h1 className="text-9xl font-display font-black leading-none italic uppercase">PIT</h1>
              <h1 className="text-9xl font-display font-black leading-none italic uppercase text-gold-500">STOP</h1>
            </div>

            <h3 className="text-base font-display font-semibold text-white mb-6">Vendas por Categoria (Hoje)</h3>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              {/* Custom SVG Animated Donut Chart */}
              <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  {/* Empty track for zero sales safeguarding */}
                  <circle
                    cx="60"
                    cy="60"
                    r={svgRadius}
                    className="stroke-slate-800"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  {totalCatSum > 0 && donutSlices.map((slice, idx) => (
                    slice.value > 0 ? (
                      <circle
                        key={idx}
                        cx="60"
                        cy="60"
                        r={svgRadius}
                        stroke={slice.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={slice.dashArray}
                        strokeDashoffset={slice.dashOffset}
                        strokeLinecap="butt"
                        fill="transparent"
                        className="transition-all duration-500 hover:stroke-[16px] cursor-pointer"
                      />
                    ) : null
                  ))}
                </svg>

                {/* Inside Text Label */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-display font-extrabold text-white">
                    R$ {revenueToday >= 1000 ? `${(revenueToday / 1000).toFixed(2)}k` : revenueToday.toFixed(0)}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Total</span>
                </div>
              </div>

              {/* Legendary Labels List */}
              <div className="flex-1 space-y-2.5 w-full">
                {categoriesList.map((cat, idx) => {
                  const slice = donutSlices.find(s => s.name === cat.name);
                  const percentage = slice ? slice.percentage : '0.0';
                  return (
                    <div key={idx} className="flex items-center justify-between group py-0.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-slate-200">
                          R$ {cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-slate-500 text-[10px] w-10 text-right">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Logs Stream */}
          <div id="recent-logs-card" className="bg-slate-900 border border-slate-800/80 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-display font-semibold text-white">Movimentações Recentes</h3>
              <button 
                onClick={() => setTab('historico')}
                className="text-xs text-gold-500 hover:text-gold-400 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                Ver todas
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 max-h-76 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">Nenhuma movimentação recente registrada.</div>
                ) : (
                  logs.slice(0, 5).map((log, idx) => {
                    const isAdd = log.type === 'add_item';
                    const isPay = log.type === 'pay';
                    const isOpen = log.type === 'open';
                    const isProd = log.type === 'add_product';

                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-950 border border-slate-900 p-3.5 rounded-xl flex items-center justify-between gap-3 group hover:border-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isPay ? 'bg-emerald-500/10 text-emerald-500' :
                            isAdd ? 'bg-gold-500/10 text-gold-400' :
                            isOpen ? 'bg-sky-500/10 text-sky-400' :
                            'bg-purple-500/10 text-purple-400'
                          }`}>
                            {isPay ? <CheckCircle className="w-4.5 h-4.5" /> :
                             isAdd ? <Plus className="w-4.5 h-4.5" /> :
                             isOpen ? <Receipt className="w-4.5 h-4.5" /> :
                             <Wine className="w-4.5 h-4.5" />}
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-white group-hover:text-gold-400 transition-colors">{log.title}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{log.details}</p>
                            {log.operator && (
                              <p className="text-[9px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                <span>Operador:</span>
                                <span className="text-gold-500/80">{log.operator}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex flex-col justify-center">
                          {log.value !== undefined && (
                            <span className={`text-[11px] font-mono font-bold ${isPay ? 'text-emerald-500' : 'text-gold-500'}`}>
                              + R$ {log.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-500 mt-0.5">{log.timestamp}</span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Dashboard Column: Open Comandas Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div id="open-comandas-panel" className="bg-slate-900 border border-slate-800/80 p-6 rounded-3xl flex flex-col h-full min-h-[500px]">
            <h3 className="text-base font-display font-semibold text-white mb-4">Comandas Abertas</h3>

            {/* In-Panel Search Input */}
            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                id="search-comandas-input"
                type="text"
                placeholder="Buscar comanda ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-gold-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
              />
              <button className="absolute right-2 top-1.5 p-1 rounded-md bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-gold-500 transition-colors">
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable list of active comandas */}
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 max-h-[380px] scrollbar-thin">
              {filteredComandas.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                  <Receipt className="w-8 h-8 text-slate-700 stroke-[1.5]" />
                  <span>Nenhuma comanda aberta localizada.</span>
                </div>
              ) : (
                filteredComandas.map((comanda) => {
                  const total = calculateComandaTotal(comanda);
                  const itemsCount = comanda.items.reduce((acc, current) => acc + current.quantity, 0);

                  return (
                    <div
                      key={comanda.id}
                      id={`dashboard-comanda-item-${comanda.id}`}
                      onClick={() => handleOpenComanda(comanda.id)}
                      className="bg-slate-950 border border-slate-900/60 hover:border-gold-500/35 p-3.5 rounded-xl flex items-center justify-between cursor-pointer group transition-all duration-300"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-gold-500">#{comanda.id}</span>
                          <span className="text-xs font-bold text-slate-100 group-hover:text-white transition-colors">{comanda.customerName}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                            {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
                          </span>
                          <span className="text-slate-600">|</span>
                          <span>Início: {comanda.openedAt}</span>
                          {comanda.createdBy && (
                            <>
                              <span className="text-slate-600">|</span>
                              <span>Op: <strong className="text-gold-500/80 font-semibold">{comanda.createdBy}</strong></span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div className="space-y-0.5">
                          <div className="text-xs font-mono font-extrabold text-white">
                            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <span className="text-[9px] text-slate-400 block tracking-wide">comanda aberta</span>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800/80 text-slate-500 flex items-center justify-center group-hover:bg-gold-500/10 group-hover:text-gold-500 group-hover:border-gold-500/20 transition-all">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Panel Actions Option */}
            <div className="pt-4 border-t border-slate-800 mt-4">
              <button 
                onClick={() => setTab('comandas')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-gold-500/30 text-xs font-bold text-slate-300 hover:text-gold-500 rounded-xl transition-all duration-300 cursor-pointer"
              >
                Ver todas as comandas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
