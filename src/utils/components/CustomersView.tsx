import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  UserCheck, 
  X,
  Check
} from 'lucide-react';
import { Customer, ActivityLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CustomersViewProps {
  customers: Customer[];
  onCreateCustomer: (customer: Omit<Customer, 'id' | 'totalSpent' | 'visits'>) => void;
  addActivityLog: (type: ActivityLog['type'], title: string, details: string) => void;
}

export default function CustomersView({
  customers,
  onCreateCustomer,
  addActivityLog
}: CustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Search filter
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Nome do cliente é obrigatório!");
      return;
    }
    onCreateCustomer({
      name: name.trim(),
      phone: phone.trim() || '(Não informado)',
      email: email.trim() || '(Não informado)'
    });
    addActivityLog('add_product', 'Cliente cadastrado', `Administrador adicionou: ${name.trim()}`);
    setName('');
    setPhone('');
    setEmail('');
    setShowModal(false);
  };

  return (
    <div id="customers-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white leading-tight">Clientes Cadastrados</h2>
          <p className="text-sm text-slate-400">Gerencie a carteira de fregueses do bar, verifique quantidade de visitas e consumações totais.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-lg gold-glow cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
          Novo Freguês
        </button>
      </div>

      {/* Search Input bar */}
      <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl">
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="search-customers"
            type="text"
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-gold-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => (
          <div 
            key={c.id}
            className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-gold-500/10 group transition-all"
          >
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 bg-gold-500/10 text-gold-500 border border-gold-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-sm font-bold text-slate-100 group-hover:text-gold-500 truncate transition-colors leading-tight">
                  {c.name}
                </h4>
                <div className="flex flex-col gap-1 text-[11px] text-slate-400 mt-2">
                  <span className="flex items-center gap-1.5 truncate">
                    <Phone className="w-3 h-3 text-slate-500" />
                    {c.phone}
                  </span>
                  <span className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 text-slate-500" />
                    {c.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick dashboard metrics of this customer */}
            <div className="grid grid-cols-2 gap-2 border-t border-slate-800/40 pt-4 mt-1">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900/60 text-center">
                <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wide">Frequência</span>
                <span className="text-xs font-mono font-bold text-slate-200 mt-1 block">
                  {c.visits} visita(s)
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900/60 text-center">
                <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wide">Total Pago</span>
                <span className="text-xs font-mono font-bold text-gold-500 mt-1 block">
                  R$ {c.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty panel */}
      {filteredCustomers.length === 0 && (
        <div className="text-center py-20 bg-slate-900 border border-slate-800/80 rounded-3xl flex flex-col items-center justify-center gap-2">
          <Users className="w-12 h-12 text-slate-800 stroke-[1.5]" />
          <h4 className="text-slate-400 font-display font-semibold mt-2">Freguês não encontrado</h4>
          <p className="text-xs text-slate-500 max-w-xs px-6">Verifique se buscou corretamente ou cadastre o novo cliente no painel superior.</p>
        </div>
      )}

      {/* Modal Creator */}
      <AnimatePresence>
        {showModal && (
          <div id="customer-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md relative gold-glow"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
                <div>
                  <h3 className="font-display font-extrabold text-white text-base">Novo Freguês</h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Registre as informações de contato para faturamentos rápidos</span>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1 px-2.5 bg-slate-950 text-slate-400 hover:text-white border border-slate-800 rounded-lg text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form elements */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Roberto Carlos"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3.5 text-xs outline-none focus:border-gold-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">DDD + Celular</label>
                  <input
                    type="tel"
                    placeholder="ex: (11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3.5 text-xs outline-none focus:border-gold-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Correio Eletrônico (E-mail)</label>
                  <input
                    type="email"
                    placeholder="ex: roberto@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3.5 text-xs outline-none focus:border-gold-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 bg-gold-500 hover:bg-gold-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer shadow-md gold-glow flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    Salvar Cliente
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
