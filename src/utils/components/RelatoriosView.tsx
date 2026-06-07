import React from 'react';
import { 
  TrendingUp, 
  ChevronRight, 
  Award, 
  DollarSign, 
  Percent, 
  Wine, 
  PieChart, 
  Calendar,
  FileDown
} from 'lucide-react';
import { Comanda, Product } from '../types';
import { generateEstablishmentPDF } from '../utils/pdfGenerator';

interface RelatoriosViewProps {
  comandas: Comanda[];
  paidComandas: Comanda[];
  products: Product[];
}

export default function RelatoriosView({ comandas, paidComandas, products }: RelatoriosViewProps) {
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

  const paidTotal = paidComandas.reduce((sum, c) => sum + calculateComandaTotal(c), 0);
  const openTotal = comandas.reduce((sum, c) => sum + calculateComandaTotal(c), 0);
  const totalBarActivity = paidTotal + openTotal;

  // 1. Calculate best-selling products by quantity sold
  const productQuantitySold: { [key: string]: { name: string, qty: number, revenue: number, category: string } } = {};

  const tallyItems = (comandasArray: Comanda[]) => {
    comandasArray.forEach(c => {
      c.items.forEach(item => {
        if (!productQuantitySold[item.productId]) {
          productQuantitySold[item.productId] = {
            name: item.name,
            qty: 0,
            revenue: 0,
            category: item.category
          };
        }
        productQuantitySold[item.productId].qty += item.quantity;
        productQuantitySold[item.productId].revenue += item.price * item.quantity;
      });
    });
  };

  tallyItems(comandas);
  tallyItems(paidComandas);

  const bestSellers = Object.values(productQuantitySold)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const maxBestSellerQty = bestSellers[0]?.qty || 1;

  // 2. Revenue by Payment Method
  const paymentMethodSums = { PIX: 0, Cartão: 0, Dinheiro: 0 };
  paidComandas.forEach(c => {
    if (c.paymentMethod && paymentMethodSums[c.paymentMethod] !== undefined) {
      paymentMethodSums[c.paymentMethod] += calculateComandaTotal(c);
    }
  });

  const totalPaidSum = paymentMethodSums.PIX + paymentMethodSums.Cartão + paymentMethodSums.Dinheiro || 1;

  // Render using unified PDF generator utility
  const handleGeneratePDF = () => {
    generateEstablishmentPDF(comandas, paidComandas);
  };

  return (
    <div id="analytics-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white leading-tight">Painel Estatístico & Relatórios</h2>
          <p className="text-sm text-slate-400">Analise o desempenho geral do estabelecimento, produtos mais pedidos do cardápio e fluxo de recebimento.</p>
        </div>
        <div>
          <button
            onClick={handleGeneratePDF}
            className="flex items-center gap-2 px-4.5 py-3 bg-gold-400 hover:bg-gold-300 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-2xl transition duration-200 gold-glow select-none cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileDown className="w-4.5 h-4.5 stroke-[2.5]" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Grid displays */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left widget: Top items bars (7 cols) */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-3xl">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-gold-500" />
            <h3 className="font-display font-semibold text-white">Produtos Mais Vendidos (Consumados)</h3>
          </div>

          <div className="space-y-4">
            {bestSellers.length === 0 ? (
              <div className="text-center py-20 text-xs text-slate-500">Nenhuma venda registrada ainda.</div>
            ) : (
              bestSellers.map((item, idx) => {
                const widthPercent = (item.qty / maxBestSellerQty) * 100;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-slate-950 font-mono font-bold text-slate-400 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="text-slate-200 font-medium">{item.name}</span>
                        <span className="text-[10px] text-slate-500 uppercase">({item.category})</span>
                      </div>
                      <span className="font-mono text-slate-400 font-bold">{item.qty} un sold</span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className="bg-gold-500 h-full rounded-full transition-all duration-1000 gold-glow"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>

                    <div className="text-right text-[10px] text-gold-500/80 font-mono">
                      Receita bruta de R$ {item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right widget: Receivables distribution (5 cols) */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-gold-500" />
              <h3 className="font-display font-semibold text-white">Recebimento por Forma</h3>
            </div>

            <div className="space-y-4 pt-2">
              {[
                { name: 'PIX Bancário', value: paymentMethodSums.PIX, color: 'bg-sky-400' },
                { name: 'Cartões débito/crédito', value: paymentMethodSums.Cartão, color: 'bg-purple-400' },
                { name: 'Dinheiro', value: paymentMethodSums.Dinheiro, color: 'bg-emerald-400' }
              ].map((item, idx) => {
                const percentage = (item.value / totalPaidSum) * 100;
                return (
                  <div key={idx} className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-900">
                    <div className="flex justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className="text-slate-300">{item.name}</span>
                      </div>
                      <span className="font-mono text-white">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-900">
                      <span>Total Faturado</span>
                      <span className="font-bold text-gold-500">
                        R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span>Total Liquidado</span>
              <span className="font-mono text-emerald-400">
                R$ {paidTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
