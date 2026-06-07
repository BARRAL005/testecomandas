import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Calendar, 
  DollarSign, 
  ArrowLeftRight, 
  Check, 
  Download, 
  Printer, 
  X,
  FileText
} from 'lucide-react';
import { Comanda } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryViewProps {
  paidComandas: Comanda[];
}

export default function HistoryView({ paidComandas }: HistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaidComandaId, setSelectedPaidComandaId] = useState<string | null>(null);

  const currentInvoice = paidComandas.find(c => c.id === selectedPaidComandaId) || null;

  // Filter paid list
  const filteredComandas = paidComandas.filter(c => 
    c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.includes(searchTerm) ||
    c.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getSubtotal = (comanda: Comanda) => {
    return comanda.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Stats summaries
  const totalInvoiced = paidComandas.reduce((sum, c) => sum + calculateComandaTotal(c), 0);
  const totalDiscounts = paidComandas.reduce((sum, c) => sum + (c.discount || 0), 0);
  const totalTaxes = paidComandas.reduce((sum, c) => sum + (c.serviceCharge ? getSubtotal(c) * 0.10 : 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="history-view" className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-white leading-tight">Histórico de Fechamentos</h2>
        <p className="text-sm text-slate-400">Verifique todas as comandas quitadas, faturamento retrospectivo, descontos aplicados e consulte comprovantes.</p>
      </div>

      {/* Stats indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800/80 p-4.5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Liquidado</span>
          <h3 className="text-xl font-display font-extrabold text-emerald-400 mt-1">
            R$ {totalInvoiced.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <span className="text-[10px] text-slate-500 mt-1 block">{paidComandas.length} comanda(s) arquivada(s)</span>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4.5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Descontos Sancionados</span>
          <h3 className="text-xl font-display font-extrabold text-red-400 mt-1">
            R$ {totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <span className="text-[10px] text-slate-500 mt-1 block">Total de reduções manuais hoje</span>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4.5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Taxas Adicionais</span>
          <h3 className="text-xl font-display font-extrabold text-gold-500 mt-1">
            R$ {totalTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <span className="text-[10px] text-slate-500 mt-1 block">Montante acumulado de taxa de serviço</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - list (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col max-h-[460px] overflow-hidden">
          <h3 className="font-display font-semibold text-white mb-4">Comandas Finalizadas</h3>

          {/* Search box */}
          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="search-history"
              type="text"
              placeholder="Buscar por cliente, id ou modalidade de pagamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-gold-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Listings */}
          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
            {filteredComandas.map((c) => {
              const totalValue = calculateComandaTotal(c);
              const itemsCount = c.items.reduce((acc, current) => acc + current.quantity, 0);

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedPaidComandaId(c.id)}
                  className={`bg-slate-950/60 hover:bg-slate-950 p-3.5 border rounded-xl flex items-center justify-between cursor-pointer transition ${
                    selectedPaidComandaId === c.id ? 'border-gold-500' : 'border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">#{c.id}</span>
                      <h4 className="text-xs font-bold text-slate-100">{c.customerName}</h4>
                      <span className="text-[9px] font-semibold px-2 py-0.2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md">
                        Paga
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                      <span>{itemsCount} item(s)</span>
                      <span>•</span>
                      <span>Fim: {c.closedAt}</span>
                      <span>•</span>
                      <span className="text-gold-500 font-bold">{c.paymentMethod}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-white block">
                      R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">ver cupom</span>
                  </div>
                </div>
              );
            })}

            {filteredComandas.length === 0 && (
              <div className="text-center py-24 text-xs text-slate-500">Nenhum fechamento localizado.</div>
            )}
          </div>
        </div>

        {/* Right column - invoice print simulator (5 cols) */}
        <div className="lg:col-span-5 h-full">
          {currentInvoice ? (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col h-full min-h-[460px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-bold font-display text-slate-100 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gold-500" />
                  Comprovante Digital
                </span>
                <button
                  onClick={() => setSelectedPaidComandaId(null)}
                  className="p-1 px-2.5 bg-slate-950 text-slate-400 hover:text-white border border-slate-850 rounded text-xs"
                >
                  Fechar
                </button>
              </div>

              {/* Thermal Invoice Canvas */}
              <div id="receipt-paper" className="bg-white text-slate-900 p-5 rounded flex flex-col font-mono text-[10px] leading-relaxed shadow-lg select-all max-h-[310px] overflow-y-auto">
                <div className="text-center space-y-0.5 border-b-2 border-dashed border-slate-300 pb-3.5">
                  <h4 className="font-extrabold text-xs tracking-wider uppercase">PITSTOP COHAB BAR</h4>
                  <p className="text-[9px] text-slate-500">AV. PRINCIPAL, S/N - COHAB</p>
                  <p className="text-[9px] text-slate-500">CNPJ: 12.345.678/0001-99</p>
                  <p className="text-[9px] text-slate-500">TEL: (11) 98765-4321</p>
                </div>

                {/* Details */}
                <div className="py-2.5 space-y-0.5 border-b-2 border-dashed border-slate-300">
                  <p>CUPOM AUXILIAR DE VENDA</p>
                  <p>COMANDA: #{currentInvoice.id}</p>
                  <p>CLIENTE: {currentInvoice.customerName.toUpperCase()}</p>
                  <p>DATA: 01/06/2026 {currentInvoice.closedAt}</p>
                </div>

                {/* Items */}
                <div className="py-2.5 space-y-1 border-b-2 border-dashed border-slate-300">
                  <div className="flex justify-between font-bold text-[9px]">
                    <span>ITEM DETALHE</span>
                    <span>QTD x VAL = TOTAL</span>
                  </div>
                  {currentInvoice.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate max-w-40">{item.name}</span>
                      <span>{item.quantity}x R$ {item.price.toFixed(2)} = R$ {(item.price*item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="py-2.5 space-y-0.5 text-right font-bold text-xs">
                  <p className="text-[10px] font-normal">Subtotal: R$ {getSubtotal(currentInvoice).toFixed(2)}</p>
                  {currentInvoice.serviceCharge && (
                    <p className="text-[10px] font-normal">S. Taxa (10%): R$ {(getSubtotal(currentInvoice)*0.1).toFixed(2)}</p>
                  )}
                  {currentInvoice.discount && (
                    <p className="text-[10px] font-normal text-red-600">Desconto: - R$ {currentInvoice.discount.toFixed(2)}</p>
                  )}
                  <p className="pt-1.5 text-slate-950 font-black border-t border-slate-200 mt-1">TOTAL PAGO: R$ {calculateComandaTotal(currentInvoice).toFixed(2)}</p>
                  <p className="text-[9px] font-normal text-slate-500 mt-2">MET. PAGAMENTO: {currentInvoice.paymentMethod?.toUpperCase()}</p>
                </div>

                <div className="text-center pt-4 border-t-2 border-dashed border-slate-300 text-slate-400 mt-4 uppercase">
                  Obrigado pela preferência!
                </div>
              </div>

              {/* Print Action button */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-950 hover:bg-slate-850 hover:text-white border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Cupom
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[460px]">
              <History className="w-12 h-12 text-slate-800 stroke-[1.5] mb-3" />
              <h4 className="font-display font-semibold text-slate-400">Cupom não selecionado</h4>
              <p className="text-xs text-slate-500 max-w-xs px-6 leading-relaxed mt-1">Clique em qualquer uma das comandas quitadas listadas à esquerda para simular comprovantes fiscais, cupom auxiliar e opções de impressão.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
