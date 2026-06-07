import React, { useState } from 'react';
import { 
  Wine, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  Check, 
  ShoppingBag, 
  DollarSign, 
  Tag, 
  AlertCircle 
} from 'lucide-react';
import { Product, ActivityLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ProductsViewProps {
  products: Product[];
  onCreateProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  addActivityLog: (type: ActivityLog['type'], title: string, details: string, value?: number) => void;
}

export default function ProductsView({
  products,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  addActivityLog
}: ProductsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Create / Edit Product Drawer states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Product['category']>('Bebidas');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formInStock, setFormInStock] = useState(true);

  // Categories
  const categoriesList = ['all', 'Bebidas', 'Cervejas', 'Destilados', 'Petiscos', 'Outros', 'Consignados'];

  // Filter listings
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Open Form for creating product
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Bebidas');
    setFormPrice('');
    setFormDescription('');
    setFormInStock(true);
    setShowFormModal(true);
  };

  // Open Form for editing
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormPrice(product.price.toString());
    setFormDescription(product.description || '');
    setFormInStock(product.inStock !== false);
    setShowFormModal(true);
  };

  // Delete product action safeguard
  const handleDelete = (product: Product) => {
    if (confirm(`Tem certeza que deseja deletar o produto "${product.name}" do cardápio?`)) {
      onDeleteProduct(product.id);
      addActivityLog('add_product', 'Produto excluído', `Administrador removeu: ${product.name}`);
    }
  };

  // Handle submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(formPrice);
    
    if (!formName.trim()) {
      alert("O nome do produto é obrigatório!");
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Por favor, digite um preço de venda válido e maior que zero!");
      return;
    }

    if (editingProduct) {
      // Edit mode
      onUpdateProduct({
        ...editingProduct,
        name: formName.trim(),
        category: formCategory,
        price: priceNum,
        description: formDescription.trim() || undefined,
        inStock: formInStock
      });
      addActivityLog('add_product', 'Produto atualizado', `Alterações salvas para: ${formName.trim()}`, priceNum);
    } else {
      // Create mode
      onCreateProduct({
        name: formName.trim(),
        category: formCategory,
        price: priceNum,
        description: formDescription.trim() || undefined,
        inStock: formInStock
      });
      addActivityLog('add_product', 'Coleção incrementada', `Novo produto cadastrado: ${formName.trim()}`, priceNum);
    }

    setShowFormModal(false);
  };

  return (
    <div id="products-page" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white leading-tight">Cardápio & Produtos</h2>
          <p className="text-sm text-slate-400">Gerencie todos os insumos, bebidas e porções cadastrados em sua carteira.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-lg gold-glow cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
          Cadastrar Produto
        </button>
      </div>

      {/* Grid of utility categories & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900 border border-slate-800/80 p-4 rounded-2xl">
        {/* Category togglers */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs px-3.5 py-2 font-bold rounded-xl transition cursor-pointer ${
                activeCategory === cat
                  ? 'bg-gold-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-900/60'
              }`}
            >
              {cat === 'all' ? 'TODOS OS PRODUTOS' : cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="search-products-catalog"
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-gold-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Actual Product Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {filteredProducts.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4.5 flex flex-col justify-between h-42 relative overflow-hidden group hover:border-gold-500/25 transition-all duration-300"
            >
              <div>
                {/* Header Tag and Stock check */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 bg-slate-950 border border-slate-850 text-gold-500 rounded-md uppercase">
                    {p.category}
                  </span>
                  
                  {/* Stock flag */}
                  {p.inStock !== false ? (
                    <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      em estoque
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-red-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      esgotado
                    </span>
                  )}
                </div>

                <h3 className="font-display font-extrabold text-sm text-slate-100 group-hover:text-gold-500 transition-colors leading-snug line-clamp-1">
                  {p.name}
                </h3>
                
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed italic pr-4">
                  {p.description || 'Sem descrição cadastrada do item.'}
                </p>
              </div>

              {/* Price and actions bar */}
              <div className="flex items-center justify-between border-t border-slate-800/40 pt-3 mt-3">
                <span className="text-sm font-mono font-black text-white">
                  R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 text-slate-400 hover:text-gold-500 bg-slate-950 hover:bg-slate-850 rounded-lg cursor-pointer border border-slate-850 hover:border-gold-500/10 transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-950 hover:bg-slate-850 rounded-lg cursor-pointer border border-slate-850 hover:border-red-500/10 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty Slate if zero elements */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-24 bg-slate-900 border border-slate-800/80 rounded-3xl flex flex-col items-center justify-center gap-2">
          <Wine className="w-12 h-12 text-slate-800 animate-pulse stroke-[1.5]" />
          <h4 className="font-display font-semibold text-slate-400 mt-2">Nenhum produto localizado</h4>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed px-6">Modifique os termos da busca ou clique no botão acima para registrar uma nova iguaria ao seu menu.</p>
        </div>
      )}

      {/* Editor / Creator Modal Drawer */}
      <AnimatePresence>
        {showFormModal && (
          <div id="product-form-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md relative shadow-2xl gold-glow-strong"
            >
              {/* Form Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
                <div>
                  <h3 className="font-display font-extrabold text-white text-lg">
                    {editingProduct ? 'Editar Produto' : 'Cadastrar Produto'}
                  </h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {editingProduct ? 'Modifique os detalhes da oferta cadastrada' : 'Adicione uma nova comida ou bebida ao seu PitStop'}
                  </span>
                </div>
                <button 
                  onClick={() => setShowFormModal(false)}
                  className="p-1 px-2.5 bg-slate-950 text-slate-400 hover:text-white border border-slate-800 rounded-lg text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Entry */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Product Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Nome do Produto</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Cerveja Heineken 600ml"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3.5 text-xs outline-none focus:border-gold-500"
                  />
                </div>

                {/* Categories & Price split */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Categoria</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl py-2 px-3 text-xs outline-none focus:border-gold-500 cursor-pointer"
                    >
                      <option value="Bebidas">Bebidas</option>
                      <option value="Cervejas">Cervejas</option>
                      <option value="Destilados">Destilados</option>
                      <option value="Petiscos">Petiscos</option>
                      <option value="Outros">Outros</option>
                      <option value="Consignados">Consignados</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Preço de Venda</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 font-mono text-xs">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0,00"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 pl-9 pr-3 text-xs font-mono outline-none focus:border-gold-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Descrição do Item</label>
                  <textarea
                    rows={3}
                    placeholder="ex: Cerveja gelada de garrafa puro malte"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3.5 text-xs outline-none focus:border-gold-500 resize-none"
                  />
                </div>

                {/* Stock Toggler Flag */}
                <div className="flex items-center justify-between bg-slate-950 border border-slate-850 p-3 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 block">Disponível em Estoque?</span>
                    <span className="text-[10px] text-slate-400">Ative para permitir o lançamento nas comandas</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setFormInStock(!formInStock)}
                    className={`w-12 h-6.5 rounded-full p-1 transition-all ${
                      formInStock ? 'bg-gold-500' : 'bg-slate-800'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 bg-slate-900 rounded-full transition-all ${
                      formInStock ? 'translate-x-5.5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Submit panel */}
                <div className="grid grid-cols-2 gap-3.5 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 bg-gold-500 hover:bg-gold-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer gold-glow flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    Salvar Produto
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
