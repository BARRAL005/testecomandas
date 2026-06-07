import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_COMANDAS, 
  INITIAL_PAID_COMANDAS, 
  INITIAL_LOGS,
  INITIAL_CONSIGNMENTS
} from './initialData';
import { Product, Comanda, ActivityLog, Customer, ComandaItem, ConsignmentOrder, RegisterTransaction } from './types';
import Sidebar from './components/Sidebar';
import PitStopLogo from './components/PitStopLogo';








import LoginView from './components/LoginView';
import { auth, db, signOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { 
  X, 
  Receipt, 
  Users, 
  Plus, 
  Hash, 
  Clipboard, 
  CalendarClock, 
  Check, 
  Bell,
  CheckCircle2,
  Loader2,
  Menu,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DashboardView = lazy(() => import('./components/DashboardView'));
const ComandasView = lazy(() => import('./components/ComandasView'));
const ProductsView = lazy(() => import('./components/ProductsView'));
const CustomersView = lazy(() => import('./components/CustomersView'));
const HistoryView = lazy(() => import('./components/HistoryView'));
const CaixaView = lazy(() => import('./components/CaixaView'));
const RelatoriosView = lazy(() => import('./components/RelatoriosView'));
const ConsignacoesView = lazy(() => import('./components/ConsignacoesView'));

export default function App() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Firestore realtime sync controls
  const syncReadyRef = useRef(false);
  const readyDocsRef = useRef<Record<string, boolean>>({});
  const applyingRemoteRef = useRef<Record<string, boolean>>({});
  const writeTimersRef = useRef<Record<string, number | null>>({});
  const [syncStatus, setSyncStatus] = useState<'local' | 'connecting' | 'online' | 'error'>('local');

  // Mobile responsiveness menu drawer toggle state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core Tabs Navigation State ('dashboard', 'comandas', 'produtos', 'clientes', 'historico', 'caixa', 'relatorios')
  const [currentTab, setTab] = useState<string>('dashboard');

  // Load from localStorage or fall back to mock data
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pitstop_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Product[];
        const normalize = (value: string) => value.trim().toLowerCase();
        const merged = [
          ...parsed,
          ...INITIAL_PRODUCTS.filter((catalogItem) => !parsed.some((existing) => normalize(existing.name) === normalize(catalogItem.name)))
        ];
        localStorage.setItem('pitstop_products', JSON.stringify(merged));
        return merged;
      } catch {
        return INITIAL_PRODUCTS;
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('pitstop_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [comandas, setComandas] = useState<Comanda[]>(() => {
    const saved = localStorage.getItem('pitstop_comandas');
    return saved ? JSON.parse(saved) : INITIAL_COMANDAS;
  });

  const [paidComandas, setPaidComandas] = useState<Comanda[]>(() => {
    const saved = localStorage.getItem('pitstop_paid_comandas');
    return saved ? JSON.parse(saved) : INITIAL_PAID_COMANDAS;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('pitstop_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [consignments, setConsignments] = useState<ConsignmentOrder[]>(() => {
    const saved = localStorage.getItem('pitstop_consignments');
    return saved ? JSON.parse(saved) : INITIAL_CONSIGNMENTS;
  });

  const [cashTransactions, setCashTransactions] = useState<RegisterTransaction[]>(() => {
    const saved = localStorage.getItem('pitstop_cash_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Selected comanda inspector state
  const [selectedComandaId, setSelectedComandaId] = useState<string | null>(null);

  // Modal displays state
  const [openNewComandaModal, setOpenNewComandaModal] = useState(false);
  const [showResetMovementsConfirm, setShowResetMovementsConfirm] = useState(false);
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);

  // Global notification micro-toast state
  const [notification, setNotification] = useState<{ id: string, message: string } | null>(null);

  // New Comanda entry fields
  const [comandaNumInput, setComandaNumInput] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomerIdForNewComanda, setSelectedCustomerIdForNewComanda] = useState<string | null>(null);
  const [newComandaCustomerName, setNewComandaCustomerName] = useState('');
  const [newComandaCustomerPhone, setNewComandaCustomerPhone] = useState('');
  const [newComandaServiceCharge, setNewComandaServiceCharge] = useState(true);

  // Write backups list
  useEffect(() => {
    localStorage.setItem('pitstop_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pitstop_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('pitstop_comandas', JSON.stringify(comandas));
  }, [comandas]);

  useEffect(() => {
    localStorage.setItem('pitstop_paid_comandas', JSON.stringify(paidComandas));
  }, [paidComandas]);

  useEffect(() => {
    localStorage.setItem('pitstop_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('pitstop_consignments', JSON.stringify(consignments));
  }, [consignments]);

  useEffect(() => {
    localStorage.setItem('pitstop_cash_transactions', JSON.stringify(cashTransactions));
  }, [cashTransactions]);


  // Sincronização em tempo real no Firebase Firestore
  // Salva por módulos separados para evitar documento gigante e sobrescrita de alterações.
  useEffect(() => {
    if (!currentUser) {
      syncReadyRef.current = false;
      readyDocsRef.current = {};
      applyingRemoteRef.current = {};
      setSyncStatus('local');
      return;
    }

    setSyncStatus('connecting');

    const subscribeModule = <T,>(
      key: string,
      legacyKey: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
      const moduleRef = doc(db, 'pitstop_data', key);

      return onSnapshot(
        moduleRef,
        async (snapshot) => {
          applyingRemoteRef.current[key] = true;

          try {
            if (snapshot.exists()) {
              const data = snapshot.data();
              if (Array.isArray(data.items)) {
                setter(data.items as T[]);
              }
            } else {
              // Migração segura: se o banco antigo existir, copia apenas o módulo necessário.
              const legacySnap = await getDoc(doc(db, 'pitstop_shared', 'main'));
              const legacyData = legacySnap.exists() ? legacySnap.data() : null;
              const legacyItems = legacyData?.[legacyKey];

              if (Array.isArray(legacyItems)) {
                setter(legacyItems as T[]);
                await setDoc(moduleRef, {
                  items: JSON.parse(JSON.stringify(legacyItems)),
                  migratedFrom: 'pitstop_shared/main',
                  updatedAt: serverTimestamp(),
                  updatedBy: currentUser.displayName || currentUser.email || 'Operador',
                  updatedByUid: currentUser.uid
                }, { merge: true });
              }
            }

            readyDocsRef.current[key] = true;
            syncReadyRef.current = true;
            setSyncStatus('online');
          } catch (error) {
            console.error(`Erro ao sincronizar módulo ${key}:`, error);
            setSyncStatus('error');
          } finally {
            window.setTimeout(() => {
              applyingRemoteRef.current[key] = false;
            }, 250);
          }
        },
        (error) => {
          console.error(`Erro ao ouvir módulo ${key}:`, error);
          readyDocsRef.current[key] = false;
          applyingRemoteRef.current[key] = false;
          setSyncStatus('error');
        }
      );
    };

    const unsubscribers = [
      subscribeModule<Product>('products', 'products', setProducts),
      subscribeModule<Customer>('customers', 'customers', setCustomers),
      subscribeModule<Comanda>('comandas', 'comandas', setComandas),
      subscribeModule<Comanda>('paidComandas', 'paidComandas', setPaidComandas),
      subscribeModule<ActivityLog>('logs', 'logs', setLogs),
      subscribeModule<ConsignmentOrder>('consignments', 'consignments', setConsignments),
      subscribeModule<RegisterTransaction>('cashTransactions', 'cashTransactions', setCashTransactions)
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      syncReadyRef.current = false;
      readyDocsRef.current = {};
    };
  }, [currentUser]);

  const saveModuleToFirestore = async <T,>(key: string, items: T[]) => {
    if (!currentUser || !readyDocsRef.current[key] || applyingRemoteRef.current[key]) return;

    if (writeTimersRef.current[key]) {
      window.clearTimeout(writeTimersRef.current[key] as number);
    }

    writeTimersRef.current[key] = window.setTimeout(async () => {
      try {
        const operatorName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Operador';
        await setDoc(doc(db, 'pitstop_data', key), {
          items: JSON.parse(JSON.stringify(items)),
          updatedAt: serverTimestamp(),
          updatedBy: operatorName,
          updatedByUid: currentUser.uid
        }, { merge: true });

        setSyncStatus('online');
      } catch (error) {
        console.error(`Erro ao salvar módulo ${key}:`, error);
        setSyncStatus('error');
      }
    }, 350);
  };

  useEffect(() => { void saveModuleToFirestore('products', products); }, [currentUser, products]);
  useEffect(() => { void saveModuleToFirestore('customers', customers); }, [currentUser, customers]);
  useEffect(() => { void saveModuleToFirestore('comandas', comandas); }, [currentUser, comandas]);
  useEffect(() => { void saveModuleToFirestore('paidComandas', paidComandas); }, [currentUser, paidComandas]);
  useEffect(() => { void saveModuleToFirestore('logs', logs); }, [currentUser, logs]);
  useEffect(() => { void saveModuleToFirestore('consignments', consignments); }, [currentUser, consignments]);
  useEffect(() => { void saveModuleToFirestore('cashTransactions', cashTransactions); }, [currentUser, cashTransactions]);

  // Helper trigger notifications
  const pushNotification = (message: string) => {
    const newId = Date.now().toString();
    setNotification({ id: newId, message });
    setTimeout(() => {
      setNotification((curr) => curr?.id === newId ? null : curr);
    }, 4000);
  };

  // Listen for Authentication state changes securely
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      pushNotification('Sessão encerrada com sucesso!');
    } catch (err) {
      console.warn('Erro ao encerrar sessão:', err);
    }
  };

  // Helper log operations
  const addActivityLog = (type: ActivityLog['type'], title: string, details: string, value?: number) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const operatorName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Operador';
    const newLog: ActivityLog = {
      id: `log_${Date.now()}`,
      type,
      title,
      details,
      value,
      timestamp,
      operator: operatorName
    };
    setLogs((curr) => [newLog, ...curr]);
  };

  // Dynamically calculate NEXT comanda number recomendation
  useEffect(() => {
    if (openNewComandaModal) {
      const highestNum = Math.max(0, ...comandas.map(c => c.number), ...paidComandas.map(c => c.number));
      setComandaNumInput((highestNum + 1).toString());
      
      // Clear inputs
      setCustomerSearchQuery('');
      setSelectedCustomerIdForNewComanda(null);
      setNewComandaCustomerName('');
      setNewComandaCustomerPhone('');
      setNewComandaServiceCharge(true);
    }
  }, [openNewComandaModal, comandas, paidComandas]);

  // Create Product
  const handleCreateProduct = (newP: Omit<Product, 'id'>) => {
    const prod: Product = {
      ...newP,
      id: `p_${Date.now()}`
    };
    setProducts((curr) => [...curr, prod]);
    pushNotification(`Produto "${newP.name}" registrado!`);
  };

  // Update Product
  const handleUpdateProduct = (updated: Product) => {
    setProducts((curr) => curr.map(p => p.id === updated.id ? updated : p));
    pushNotification(`Produto "${updated.name}" modificado!`);
  };

  // Delete Product
  const handleDeleteProduct = (id: string) => {
    setProducts((curr) => curr.filter(p => p.id !== id));
    pushNotification(`Produto excluído do menu.`);
  };

  // Create Client
  const handleCreateCustomer = (newC: Omit<Customer, 'id' | 'totalSpent' | 'visits'>) => {
    const client: Customer = {
      ...newC,
      id: `c_${Date.now()}`,
      totalSpent: 0,
      visits: 0
    };
    setCustomers((curr) => [...curr, client]);
    pushNotification(`Freguês "${newC.name}" cadastrado!`);
  };

  // Create / Register Comanda Action
  const handleCreateComandaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedNum = parseInt(comandaNumInput);
    
    // Choose customer name
    let clientName = newComandaCustomerName.trim();
    if (selectedCustomerIdForNewComanda) {
      const match = customers.find(c => c.id === selectedCustomerIdForNewComanda);
      if (match) {
        clientName = match.name;
      }
    }

    if (!clientName) {
      alert("Por favor, selecione um cliente cadastrado ou digite o nome de identificação!");
      return;
    }

    if (isNaN(parsedNum) || parsedNum <= 0) {
      alert("Por favor insira um código numérico de comanda adequado!");
      return;
    }

    // Safety check check duplicate open comanda
    const hasDuplicate = comandas.some(c => c.status === 'open' && c.number === parsedNum);
    if (hasDuplicate) {
      alert(`A comanda número #${parsedNum} já possui mesa ou consumo aberto! Por favor escolha outro ID.`);
      return;
    }

    const padNum = parsedNum.toString().padStart(4, '0');
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const operatorName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Operador';

    const newCom: Comanda = {
      id: padNum,
      number: parsedNum,
      customerName: clientName,
      phone: newComandaCustomerPhone.trim() || undefined,
      items: [],
      status: 'open',
      openedAt: timestamp,
      serviceCharge: newComandaServiceCharge,
      createdBy: operatorName,
      updatedBy: operatorName
    };

    setComandas((curr) => [newCom, ...curr]);
    
    // Increment visit statistic for recognized customers
    if (selectedCustomerIdForNewComanda) {
      setCustomers((old) => old.map(c => c.id === selectedCustomerIdForNewComanda ? { ...c, visits: c.visits + 1 } : c));
    }

    addActivityLog('open', `Comanda #${padNum} aberta`, `Freguês: ${clientName}`);
    pushNotification(`Mesa #${parsedNum} aberta com sucesso!`);

    // Reset modals and navigate straight inside editable mode.
    setOpenNewComandaModal(false);
    setSelectedComandaId(padNum);
    setTab('comandas');
  };

  // Update consumption items inside a comanda
  const handleUpdateComanda = (updated: Comanda) => {
    const operatorName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Operador';
    const updatedWithOperator: Comanda = {
      ...updated,
      updatedBy: operatorName
    };
    setComandas((curr) => curr.map(c => c.id === updated.id ? updatedWithOperator : c));
  };

  // Pay / Settlement complete comanda
  const handlePayComanda = (
    comandaId: string, 
    paymentMethod: 'PIX' | 'Cartão' | 'Dinheiro', 
    finalValue: number, 
    discount: number,
    serviceApplied: boolean
  ) => {
    const match = comandas.find(c => c.id === comandaId);
    if (!match) return;

    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const paidRecord: Comanda = {
      ...match,
      status: 'paid',
      closedAt: timestamp,
      paymentMethod,
      discount,
      serviceCharge: serviceApplied
    };

    // Close and transfer active list to paid list
    setComandas((curr) => curr.filter(c => c.id !== comandaId));
    setPaidComandas((curr) => [paidRecord, ...curr]);

    // Update customer's totalSpent in database if they exist on initial lists
    setCustomers((old) => old.map(c => {
      if (c.name.toLowerCase() === match.customerName.toLowerCase()) {
        return {
          ...c,
          totalSpent: c.totalSpent + finalValue
        };
      }
      return c;
    }));

    addActivityLog('pay', 'Pagamento recebido', `Comanda #${comandaId} paga via ${paymentMethod}`, finalValue);
    pushNotification(`Comanda #${comandaId} finalizada no método ${paymentMethod}!`);
  };

  // Cancel / Delete a comanda completely (open)
  const handleCancelComanda = (comandaId: string) => {
    const target = comandas.find(c => c.id === comandaId);
    if (!target) return;
    
    setComandas((curr) => curr.filter(c => c.id !== comandaId));
    setSelectedComandaId(null);
    addActivityLog('pay', 'Comanda excluída', `Comanda #${comandaId} de ${target.customerName} foi apagada.`);
    pushNotification(`Comanda #${comandaId} excluída com sucesso.`);
  };

  // Clear only active open and closed (paid) comandas + customers and transaction logs
  const handleClearMovements = () => {
    setComandas([]);
    setPaidComandas([]);
    setCustomers([]);
    setConsignments([]);
    setCashTransactions([]);
    setLogs([]);
    setSelectedComandaId(null);
    pushNotification("Toda a movimentação de comandas, consignados e caixa foi zerada!");
  };

  // Clear everything completely including catalog of products (the ultimate clean/empty slate)
  const handleClearAllData = () => {
    setProducts([]);
    setComandas([]);
    setPaidComandas([]);
    setCustomers([]);
    setConsignments([]);
    setCashTransactions([]);
    setLogs([]);
    setSelectedComandaId(null);
    pushNotification("Sistema totalmente zerado e limpo com sucesso!");
  };

  const handleAddConsignment = (newOrder: ConsignmentOrder) => {
    setConsignments((curr) => [newOrder, ...curr]);
    pushNotification(`Pedido consignado ${newOrder.id} cadastrado com sucesso!`);
  };

  const handleUpdateConsignment = (updated: ConsignmentOrder) => {
    setConsignments((curr) => curr.map(item => item.id === updated.id ? updated : item));
    if (updated.status === 'finalizado') {
      pushNotification(`Consignado ${updated.id} finalizado e pago.`);
    } else {
      pushNotification(`Consignado ${updated.id} modificado.`);
    }
  };

  const handleDeleteConsignment = (id: string) => {
    setConsignments((curr) => curr.filter(item => item.id !== id));
    pushNotification(`Consignado excluído com sucesso.`);
  };

  // Choose sub-rendering pages
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            comandas={comandas}
            paidComandas={paidComandas}
            products={products}
            logs={logs}
            setTab={setTab}
            setSelectedComandaId={setSelectedComandaId}
            setOpenNewComandaModal={setOpenNewComandaModal}
            onClearDemoData={handleClearAllData}
          />
        );
      case 'comandas':
        return (
          <ComandasView
            comandas={comandas}
            products={products}
            selectedComandaId={selectedComandaId}
            setSelectedComandaId={setSelectedComandaId}
            onUpdateComanda={handleUpdateComanda}
            onPayComanda={handlePayComanda}
            onCancelComanda={handleCancelComanda}
            setOpenNewComandaModal={setOpenNewComandaModal}
            addActivityLog={addActivityLog}
          />
        );
      case 'consignacoes':
        return (
          <ConsignacoesView
            consignments={consignments}
            products={products}
            onAddConsignment={handleAddConsignment}
            onUpdateConsignment={handleUpdateConsignment}
            onDeleteConsignment={handleDeleteConsignment}
            addActivityLog={addActivityLog}
          />
        );
      case 'produtos':
        return (
          <ProductsView
            products={products}
            onCreateProduct={handleCreateProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            addActivityLog={addActivityLog}
          />
        );
      case 'clientes':
        return (
          <CustomersView
            customers={customers}
            onCreateCustomer={handleCreateCustomer}
            addActivityLog={addActivityLog}
          />
        );
      case 'historico':
        return (
          <HistoryView
            paidComandas={paidComandas}
          />
        );
      case 'caixa':
        return (
          <CaixaView
            comandas={comandas}
            paidComandas={paidComandas}
            addActivityLog={addActivityLog}
            cashTransactions={cashTransactions}
            setCashTransactions={setCashTransactions}
          />
        );
      case 'relatorios':
        return (
          <RelatoriosView
            comandas={comandas}
            paidComandas={paidComandas}
            products={products}
          />
        );
      case 'configuracoes':
        return (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
            <div>
              <h3 className="font-display font-semibold text-white text-base">Configurações Operacionais</h3>
              <p className="text-xs text-slate-400 mt-1">Personalize parâmetros de alíquotas de serviço padrão do seu aplicativo em tempo de execução.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-900">
                <div>
                  <span className="text-xs font-bold text-white block">Taxa de Serviço Padrão 10%</span>
                  <span className="text-[10px] text-slate-500">Aplica 10% adicionais na cobrança das comandas automaticamente</span>
                </div>
                <input type="checkbox" defaultChecked className="accent-gold-500 rounded text-gold-500 w-4 h-4 cursor-pointer" />
              </div>

              <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-900">
                <div>
                  <span className="text-xs font-bold text-white block">Salvar em Cache Durável do Navegador</span>
                  <span className="text-[10px] text-slate-500">Garante persistência de comandas mesmo se o editor de visualização reiniciar</span>
                </div>
                <span className="text-xs text-emerald-400 font-mono font-bold">ATIVADO</span>
              </div>
            </div>

            {/* Zero/Reset Database Section */}
            <div className="border-t border-slate-800/80 pt-6 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                  ⚠️ Limpeza e Inicialização de Dados
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Utilize as opções abaixo caso queira limpar os lançamentos de teste integrados e de demonstração para colocar o sistema em produção no seu estabelecimento.
                </p>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Reset Movements Option */}
                <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between gap-3 relative overflow-hidden">
                  <div>
                    <span className="text-xs font-extrabold text-white">Limpar Lançamentos</span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Apaga todas as comandas abertas, quitadas, clientes cadastrados e logs do caixa diário. Mantém o cardápio de produtos intacto.</p>
                  </div>

                  {!showResetMovementsConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowResetMovementsConfirm(true)}
                      className="w-full py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer text-center"
                    >
                      Zerar Comandas e Caixa
                    </button>
                  ) : (
                    <div className="bg-red-950/20 border border-red-500/20 p-2.5 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-red-400 block text-center">Confirmar exclusão de comandas?</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowResetMovementsConfirm(false)}
                          className="flex-1 py-1 px-1 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg text-[10px] font-bold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleClearMovements();
                            setShowResetMovementsConfirm(false);
                          }}
                          className="flex-1 py-1 px-1 bg-red-650 hover:bg-red-650 text-white rounded-lg text-[10px] font-bold"
                        >
                          Sim, Limpar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reset All Option */}
                <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between gap-3 relative overflow-hidden">
                  <div>
                    <span className="text-xs font-extrabold text-white">Zerar Tudo (Banco Limpo)</span>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Apaga absolutamente todos os dados simulados, incluindo o cardápio inteiro de bebidas e petiscos. O aplicativo voltará 100% limpo.</p>
                  </div>

                  {!showResetAllConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowResetAllConfirm(true)}
                      className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer text-center active:scale-95 shadow-md"
                    >
                      Limpar Todo o Sistema
                    </button>
                  ) : (
                    <div className="bg-red-950/30 border border-red-500/30 p-2.5 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-red-400 block text-center">TEM CERTEZA? APAGARÁ CARDÁPIO TAMBÉM</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowResetAllConfirm(false)}
                          className="flex-1 py-1 px-1 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg text-[10px] font-bold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleClearAllData();
                            setShowResetAllConfirm(false);
                          }}
                          className="flex-1 py-1 px-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold"
                        >
                          Apagar Tudo
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      default:
        return <div className="text-white">Em Desenvolvimento</div>;
    }
  };

  // Match suggestions from customers listing during comanda opening select
  const filteredCustomersForPicker = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    c.phone.includes(customerSearchQuery)
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden select-none">
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
          <div className="beer-bubble w-6 h-6 left-12" style={{ animationDelay: '0s', bottom: '0%' }} />
          <div className="beer-bubble w-4 h-4 left-1/4" style={{ animationDelay: '2s', bottom: '0%' }} />
          <div className="beer-bubble w-8 h-8 left-2/4" style={{ animationDelay: '4s', bottom: '0%' }} />
        </div>
        <div className="flex flex-col items-center gap-4 z-10">
          <PitStopLogo size="md" showText={false} />
          <div className="flex items-center gap-2 mt-4 text-xs font-semibold uppercase tracking-wider text-gold-500">
            <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
            <span>Inicializando Sistema...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={() => {}} />;
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans overflow-hidden antialiased">
      
      <div className={`fixed top-3 right-3 z-[60] px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider shadow-xl ${
        syncStatus === 'online' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
        syncStatus === 'connecting' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
        syncStatus === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
        'bg-slate-900 border-slate-700 text-slate-400'
      }`}>
        {syncStatus === 'online' ? 'Firebase online' : syncStatus === 'connecting' ? 'Sincronizando...' : syncStatus === 'error' ? 'Erro Firebase' : 'Modo local'}
      </div>

      {/* Dynamic drifting background bubbles to deliver "beer tavern" vibe */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <div className="beer-bubble w-6 h-6 left-12" style={{ animationDelay: '0s', bottom: '0%' }} />
        <div className="beer-bubble w-4 h-4 left-1/4" style={{ animationDelay: '2s', bottom: '0%' }} />
        <div className="beer-bubble w-8 h-8 left-2/4" style={{ animationDelay: '4s', bottom: '0%' }} />
        <div className="beer-bubble w-3 h-3 left-3/4" style={{ animationDelay: '1s', bottom: '0%' }} />
        <div className="beer-bubble w-5 h-5 left-11/12" style={{ animationDelay: '3s', bottom: '0%' }} />
      </div>

      {/* Mobile Sticky Navbar Header */}
      <header className="md:hidden h-16 shrink-0 bg-slate-950/90 border-b border-slate-900 flex items-center justify-between px-4 sticky top-0 z-30 backdrop-blur-md select-none">
        <div className="flex items-center gap-3">
          {/* Menu Hamburger Toggle Trigger */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 bg-slate-900 hover:bg-slate-850 text-gold-500 rounded-xl border border-slate-800 cursor-pointer active:scale-95 transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <PitStopLogo size="sm" showText={false} />
        </div>
        
        {/* Profile badge & open comandas counter on top right corner */}
        <div className="flex items-center gap-2">
          {comandas.filter(c => c.status === 'open').length > 0 && (
            <span className="text-[10px] bg-gold-500/10 border border-gold-500/25 text-gold-500 font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-ping" />
              {comandas.filter(c => c.status === 'open').length} com.
            </span>
          )}
          {currentUser.photoURL ? (
            <img 
              src={currentUser.photoURL} 
              alt="Operador" 
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover border border-slate-800" 
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-gold-500">
              <UserCheck className="w-4 h-4" />
            </div>
          )}
        </div>
      </header>

      {/* Main Left-side Sidebar Control */}
      <Sidebar 
        currentTab={currentTab} 
        setTab={setTab} 
        adminName={currentUser.displayName || currentUser.email?.split('@')[0] || 'Operador'}
        userPhoto={currentUser.photoURL || undefined}
        onLogout={handleLogout}
        totalOpenComandas={comandas.filter(c => c.status === 'open').length}
        isOpenOnMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Primary viewport content */}
      <main className={`flex-1 min-h-0 ${currentTab === 'comandas' ? 'overflow-hidden' : 'overflow-y-auto'} p-3 md:p-8 relative z-10 pb-4 md:pb-8`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="w-full h-full max-w-7xl mx-auto flex flex-col"
          >
            <Suspense fallback={
              <div className="flex flex-1 min-h-[320px] items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-gold-500" />
                <span className="text-sm font-semibold">Carregando módulo...</span>
              </div>
            }>
              {renderTabContent()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 1. Micro Toast Notification Overlays */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-gold-500/25 px-4.5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl gold-glow-strong"
          >
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 text-gold-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-100 pr-2">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Global Open New Comanda Overlay Form */}
      <AnimatePresence>
        {openNewComandaModal && (
          <div id="new-comanda-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-lg relative shadow-2xl overflow-y-auto max-h-[90vh] gold-glow"
            >
              {/* Overlay Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-gold-500/10 text-gold-500 flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-white text-base">Abrir Comanda Operacional</h3>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Registre o consumo de um novo cliente ou mesa</span>
                  </div>
                </div>
                <button 
                  onClick={() => setOpenNewComandaModal(false)}
                  className="p-1 px-2.5 bg-slate-100/10 text-slate-400 hover:text-white border border-slate-800 rounded-lg text-xs hover:bg-slate-950 cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Entry */}
              <form onSubmit={handleCreateComandaSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Comanda ID Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-gold-500" />
                      Número da Comanda / Mesa
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="ex: 13"
                      value={comandaNumInput}
                      onChange={(e) => setComandaNumInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3 text-xs font-mono outline-none focus:border-gold-500"
                    />
                  </div>

                  {/* Customer Search pick */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gold-500" />
                      Vincular Freguês Cadastrado
                    </label>
                    <input
                      type="text"
                      placeholder="Pesquisar cliente do bar..."
                      value={customerSearchQuery}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        setSelectedCustomerIdForNewComanda(null); // Unlink if manual editing starts
                      }}
                      className="w-full bg-slate-950 border border-slate-850 text-white rounded-xl py-2 px-3 text-xs outline-none focus:border-gold-500"
                    />
                    
                    {/* Floating Match box dropdown list */}
                    {customerSearchQuery.trim().length > 0 && !selectedCustomerIdForNewComanda && (
                      <div className="absolute left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-36 overflow-y-auto z-50 shadow-2xl">
                        {filteredCustomersForPicker.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomerIdForNewComanda(c.id);
                              setCustomerSearchQuery(c.name);
                              setNewComandaCustomerPhone(c.phone);
                            }}
                            className="p-2 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-900 flex items-center justify-between cursor-pointer border-b border-slate-900/60"
                          >
                            <span>{c.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono italic">{c.phone}</span>
                          </div>
                        ))}
                        {filteredCustomersForPicker.length === 0 && (
                          <div className="p-3 text-[10px] text-slate-500 text-center">Nenhum cliente localizado.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Split fields for manual customer inputs if not match selected */}
                {!selectedCustomerIdForNewComanda && (
                  <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Manual Guest Name */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Ou Nome Manual Cliente</label>
                      <input
                        type="text"
                        placeholder="ex: João Silva"
                        value={newComandaCustomerName}
                        onChange={(e) => setNewComandaCustomerName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3 text-xs outline-none focus:border-gold-500"
                      />
                    </div>

                    {/* Manual Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Telefone de Contato</label>
                      <input
                        type="tel"
                        placeholder="ex: (11) 98888-8888"
                        value={newComandaCustomerPhone}
                        onChange={(e) => setNewComandaCustomerPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3 text-xs outline-none focus:border-gold-500"
                      />
                    </div>
                  </div>
                )}

                {/* Default Service charge setting toggler */}
                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-slate-200 block">Cobrar Taxa Adicional 10% (Garçom)?</span>
                    <span className="text-[10px] text-slate-500">Pode ser desativado posteriormente em tempo real</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={newComandaServiceCharge}
                    onChange={(e) => setNewComandaServiceCharge(e.target.checked)}
                    className="accent-gold-500 rounded text-gold-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                {/* Form submit buttons */}
                <div className="grid grid-cols-2 gap-3.5 pt-4">
                  <button
                    type="button"
                    onClick={() => setOpenNewComandaModal(false)}
                    className="py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="py-3 bg-gold-500 hover:bg-gold-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer shadow-lg gold-glow flex items-center justify-center gap-1 active:scale-95"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" strokeWidth={2.5} />
                    Confirmar Abertura
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
