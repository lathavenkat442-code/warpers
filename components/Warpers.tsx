import { ScanVerificationModal } from './ScanVerificationModal';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { User, Warper, YarnDispatch, WarperReturn, WarpOrder, DenierFormula, Weaver, Supplier, WarpSection, Loom, LoomTransaction } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Plus, User as UserIcon, Trash2, Settings, FileText, ChevronDown, ChevronUp, Search, Printer, Camera, ArrowDownLeft, ArrowUpRight, PieChart, Share2 } from 'lucide-react';
import { YARN_COLORS, YARN_TYPES, PREDEFINED_COLORS } from '../constants';
import { syncColumnToSupabase, fetchAllDataFromSupabase } from '../services/dbService';

interface WarpersProps {
  user: User;
  language: 'ta' | 'en';
  buttonColor?: string;
  setToast?: React.Dispatch<React.SetStateAction<{ msg: string, show: boolean, isError?: boolean }>>;
}

const DetailItem = ({ label, value }: { label: string, value: any }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
    <span className="text-sm font-bold text-gray-400">{label}</span>
    <span className="text-sm font-black text-gray-800">{value}</span>
  </div>
);

const Warpers: React.FC<WarpersProps> = ({ user, language, buttonColor = 'bg-zinc-600 hover:bg-zinc-700', setToast }) => {
  const [warpers, setWarpers] = useState<Warper[]>([]);
  const [dispatches, setDispatches] = useState<YarnDispatch[]>([]);
  const [returns, setReturns] = useState<WarperReturn[]>([]);
  const [warpOrders, setWarpOrders] = useState<WarpOrder[]>([]);
  const [weavers, setWeavers] = useState<Weaver[]>([]);
  const [denierFormulas, setDenierFormulas] = useState<DenierFormula[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [looms, setLooms] = useState<Loom[]>([]);
  
  const [selectedWarper, setSelectedWarper] = useState<Warper | null>(null);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [statementPage, setStatementPage] = useState(1);
  const [ledgerSortOrder, setLedgerSortOrder] = useState<'asc' | 'desc'>('desc');
  const pageSize = 25;

  const [viewType, setViewType] = useState<'received' | 'returned' | 'balance' | 'orders' | 'ledger' | 'all-warps'>('ledger');
  const [selectedDeniers, setSelectedDeniers] = useState<string[]>(['ALL']);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [isAddingReturn, setIsAddingReturn] = useState(false);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnDesignName, setReturnDesignName] = useState('');
  const [returnColor, setReturnColor] = useState('');
  const [returnWeight, setReturnWeight] = useState('');
  const [returnEnds, setReturnEnds] = useState('');
  const [returnLength, setReturnLength] = useState('1000'); // Default to 1000m
  const [returnWeaverId, setReturnWeaverId] = useState('');
  const [returnDenier, setReturnDenier] = useState('');

  const [isAddingDispatch, setIsAddingDispatch] = useState(false);
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [dispatchDenier, setDispatchDenier] = useState('');
  const [dispatchItems, setDispatchItems] = useState<{ id: string, color: string, weight: string }[]>([]);
  const [dispatchSupplierId, setDispatchSupplierId] = useState('');
  const [isAddingNewSupplier, setIsAddingNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [dispatchBillNumber, setDispatchBillNumber] = useState('');

  const openAddDispatchModal = useCallback(() => {
    setDispatchItems([{ id: Date.now().toString(), color: '', weight: '' }]);
    setIsAddingDispatch(true);
  }, []);

  const addDispatchItem = useCallback(() => {
    setDispatchItems(prev => [...prev, { id: Date.now().toString(), color: '', weight: '' }]);
  }, []);

  const removeDispatchItem = useCallback((id: string) => {
    setDispatchItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev);
  }, []);

  const updateDispatchItem = useCallback((id: string, field: 'color' | 'weight', value: string) => {
    setDispatchItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }, []);

  const [isManagingFormulas, setIsManagingFormulas] = useState(false);
  const [showScanOptions, setShowScanOptions] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [newFormulaDenier, setNewFormulaDenier] = useState('');
  const [newFormulaMultiplier, setNewFormulaMultiplier] = useState('');
  const [isCustomDenier, setIsCustomDenier] = useState(false);

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderDesignName, setOrderDesignName] = useState('');
  const [orderSections, setOrderSections] = useState<WarpSection[]>(() => [{ id: Date.now().toString(), name: '', ends: 0, color: '', length: 0, denier: '' }]);
  const [orderTotalSarees, setOrderTotalSarees] = useState('');
  const [orderWarpLength, setOrderWarpLength] = useState('');
  const [orderTotalWeight, setOrderWarpWeight] = useState('');

  const [isAssigningOrder, setIsAssigningOrder] = useState<string | null>(null);
  const [assignWeaverId, setAssignWeaverId] = useState('');
  const [assignWeaverSearch, setAssignWeaverSearch] = useState('');
  const [showWeaverDropdown, setShowWeaverDropdown] = useState(false);
  const [assignLoomId, setAssignLoomId] = useState('');
  const [newLoomNumber, setNewLoomNumber] = useState('1');
  const [newLoomBreak, setNewLoomBreak] = useState('Right Break');
  const [editingWages, setEditingWages] = useState<Record<string, {wage: string, wagePaid: string}>>({});
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [warpSearchQuery, setWarpSearchQuery] = useState('');
  const [warpWageFilter, setWarpWageFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'PARTIAL'>('ALL');

  // Statement filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewStatement, setViewStatement] = useState<string | null>(null);

  const [viewingDetail, setViewingDetail] = useState<{ type: 'dispatch' | 'order' | 'return', data: any } | null>(null);
  const [isViewingColorStatement, setIsViewingColorStatement] = useState(false);

  const warperDispatches = useMemo(() => {
    if (!selectedWarper) return [];
    return dispatches.filter(d => d.recipientType === 'warper' && d.recipientId === selectedWarper.id);
  }, [dispatches, selectedWarper]);

  const warperReturns = useMemo(() => {
    if (!selectedWarper) return [];
    return returns.filter(r => r.warperId === selectedWarper.id);
  }, [returns, selectedWarper]);

  const warperOrders = useMemo(() => {
    if (!selectedWarper) return [];
    return warpOrders.filter(o => o.warperId === selectedWarper.id).sort((a, b) => b.createdAt - a.createdAt);
  }, [warpOrders, selectedWarper]);

  const groupedDispatches = useMemo(() => {
    const groups: Record<string, YarnDispatch[]> = {};
    warperDispatches.forEach(d => {
      const groupKey = `${d.date}_${d.billNumber || 'NO_BILL'}_${d.supplierId || 'NO_SUPPLIER'}`;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(d);
    });
    return Object.values(groups).sort((a, b) => {
      const dateA = new Date(a[0].date).getTime();
      const dateB = new Date(b[0].date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return b[0].createdAt - a[0].createdAt;
    });
  }, [warperDispatches]);

  const isInitialLoad = useRef(true);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isInitialLoad.current) return;
    isInitialLoad.current = false;

    const loadData = async () => {
      try {
        let dataFromDb = null;
        if (user.uid && user.uid !== 'guest') {
          dataFromDb = await fetchAllDataFromSupabase(user.uid);
        }

        const loadLocalOrDb = (key: string, dbKey: string, setter: any, defaultVal: any = []) => {
          if (dataFromDb && dataFromDb[dbKey]) {
            setter(dataFromDb[dbKey]);
            localStorage.setItem(`${key}_${user.uid || 'guest'}`, JSON.stringify(dataFromDb[dbKey]));
            return dataFromDb[dbKey];
          } else {
            const saved = localStorage.getItem(`${key}_${user.uid || 'guest'}`);
            if (saved) {
              const parsed = JSON.parse(saved);
              setter(parsed);
              return parsed;
            } else {
              setter(defaultVal);
              return defaultVal;
            }
          }
        };

        loadLocalOrDb('viyabaari_warpers', 'warpers', setWarpers);
        loadLocalOrDb('viyabaari_yarn_dispatches', 'dispatches', setDispatches);
        loadLocalOrDb('viyabaari_warper_returns', 'returns', setReturns);
        loadLocalOrDb('viyabaari_warp_orders', 'warp_orders', setWarpOrders);
        loadLocalOrDb('viyabaari_weavers', 'weavers', setWeavers);
        loadLocalOrDb('viyabaari_looms', 'looms', setLooms);
        loadLocalOrDb('viyabaari_suppliers', 'suppliers', setSuppliers);
        
        // Also load loom_txns from DB to localStorage even if not in state
        if (dataFromDb && dataFromDb['loom_txns']) {
          localStorage.setItem(`viyabaari_loom_txns_${user.uid || 'guest'}`, JSON.stringify(dataFromDb['loom_txns']));
        }
        
        const formulas = loadLocalOrDb('viyabaari_denier_formulas', 'denier_formulas', setDenierFormulas);
        if (formulas && formulas.length > 0) {
          setSelectedDeniers([formulas[0].denier]);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user.uid]);

  const showToast = useCallback((msg: string, isError = false) => {
    if (setToast) {
      setToast({ msg, show: true, isError });
    } else {
      console.log('Toast:', msg);
    }
  }, [setToast]);

  const saveWarpers = useCallback((newWarpers: Warper[]) => {
    setWarpers(newWarpers);
    localStorage.setItem(`viyabaari_warpers_${user.uid || 'guest'}`, JSON.stringify(newWarpers));
    syncColumnToSupabase(user.uid, 'warpers', newWarpers);
  }, [user.uid]);

  const saveReturns = useCallback((newReturns: WarperReturn[]) => {
    setReturns(newReturns);
    localStorage.setItem(`viyabaari_warper_returns_${user.uid || 'guest'}`, JSON.stringify(newReturns));
    syncColumnToSupabase(user.uid, 'returns', newReturns);
  }, [user.uid]);

  const saveDispatches = useCallback((newDispatches: YarnDispatch[]) => {
    setDispatches(newDispatches);
    localStorage.setItem(`viyabaari_yarn_dispatches_${user.uid || 'guest'}`, JSON.stringify(newDispatches));
    syncColumnToSupabase(user.uid, 'dispatches', newDispatches);
  }, [user.uid]);

  const saveFormulas = useCallback((newFormulas: DenierFormula[]) => {
    setDenierFormulas(newFormulas);
    localStorage.setItem(`viyabaari_denier_formulas_${user.uid || 'guest'}`, JSON.stringify(newFormulas));
    syncColumnToSupabase(user.uid, 'denier_formulas', newFormulas);
  }, [user.uid]);

  const saveWarpOrders = useCallback((newOrders: WarpOrder[]) => {
    setWarpOrders(newOrders);
    localStorage.setItem(`viyabaari_warp_orders_${user.uid || 'guest'}`, JSON.stringify(newOrders));
    syncColumnToSupabase(user.uid, 'warp_orders', newOrders);
  }, [user.uid]);

  const handleAdd = useCallback(() => {
    if (!newName.trim()) return;
    const timestamp = Date.now();
    const newWarper: Warper = {
      id: timestamp.toString(),
      name: newName,
      phone: newPhone,
      createdAt: timestamp
    };
    saveWarpers([...warpers, newWarper]);
    setNewName('');
    setNewPhone('');
    setIsAdding(false);
    showToast(language === 'ta' ? 'வார்ப்பர் வெற்றிகரமாக சேர்க்கப்பட்டார்!' : 'Warper added successfully!');
  }, [newName, newPhone, warpers, saveWarpers, language, showToast]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm(language === 'ta' ? 'நிச்சயமாக நீக்க வேண்டுமா?' : 'Are you sure you want to delete?')) {
      saveWarpers(warpers.filter(w => w.id !== id));
    }
  }, [warpers, saveWarpers, language]);

  const handleAddReturn = useCallback(() => {
    if (!returnDate || !returnColor || !returnDenier || !selectedWarper) return;
    
    let finalWeight = parseFloat(returnWeight);
    const ends = parseInt(returnEnds);
    const length = parseFloat(returnLength) || 1000;
    
    if (!finalWeight && ends) {
      const formula = denierFormulas.find(f => f.denier === returnDenier);
      if (formula) {
        if (formula.gramsPerEnd) {
          // formula.gramsPerEnd is grams per 1000m
          finalWeight = (ends * formula.gramsPerEnd * length) / 1000000;
        } else {
          finalWeight = (ends * formula.multiplier * length) / 1000;
        }
      }
    }

    if (!finalWeight) {
      showToast(language === 'ta' ? 'எடை அல்லது இழை அளவு தேவை' : 'Weight or Ends required', 'error');
      return;
    }

    const weaver = weavers.find(w => w.id === returnWeaverId);
    
    // Calculate next warpNumber (S.No)
    const maxWarpNumber = returns.reduce((max, r) => {
      const num = parseInt(r.warpNumber || '0');
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const nextWarpNumber = (maxWarpNumber + 1).toString();

    const timestamp = Date.now();
    const newReturn: WarperReturn = {
      id: timestamp.toString(),
      warperId: selectedWarper.id,
      date: returnDate,
      warpNumber: nextWarpNumber,
      color: returnColor,
      weightKg: finalWeight,
      yarnType: returnDenier,
      weaverId: returnWeaverId,
      weaverName: weaver?.name,
      ends: ends || undefined,
      length: length,
      createdAt: timestamp
    };
    
    saveReturns([...returns, newReturn]);
    setReturnDate(new Date().toISOString().split('T')[0]);
    setReturnOrderId('');
    setReturnDesignName('');
    setReturnColor('');
    setReturnWeight('');
    setReturnEnds('');
    setReturnLength('1000');
    setReturnWeaverId('');
    setReturnDenier('');
    setIsAddingReturn(false);
    showToast(language === 'ta' ? 'வார்ப்பு வரவு வெற்றிகரமாக சேமிக்கப்பட்டது!' : 'Warp return saved successfully!');
  }, [returnDate, returnColor, returnDenier, selectedWarper, returnWeight, returnEnds, returnLength, denierFormulas, weavers, returnWeaverId, returns, saveReturns, language, showToast]);

  const handleAddDispatch = useCallback(() => {
    if (!dispatchDate || !dispatchDenier || !selectedWarper || dispatchItems.length === 0) return;
    
    const validItems = dispatchItems.filter(item => item.color && item.weight);
    if (validItems.length === 0) {
      showToast(language === 'ta' ? 'குறைந்தது ஒரு கலர் மற்றும் எடை தேவை' : 'At least one color and weight required', 'error');
      return;
    }

    const selectedSupplier = suppliers.find(s => s.id === dispatchSupplierId);
    const timestamp = Date.now();

    const newDispatches: YarnDispatch[] = validItems.map((item, index) => ({
      id: (timestamp + index).toString(),
      date: dispatchDate,
      recipientType: 'warper',
      recipientId: selectedWarper.id,
      yarnCategory: 'warp',
      yarnType: dispatchDenier,
      color: item.color,
      weightKg: parseFloat(item.weight),
      supplierId: dispatchSupplierId || undefined,
      supplierName: selectedSupplier?.name || undefined,
      billNumber: dispatchBillNumber || undefined,
      createdAt: timestamp + index
    }));
    
    saveDispatches([...dispatches, ...newDispatches]);
    setDispatchItems([]);
    setDispatchSupplierId('');
    setDispatchBillNumber('');
    setIsAddingDispatch(false);
    showToast(language === 'ta' ? 'நூல் செலவு வெற்றிகரமாக சேமிக்கப்பட்டது!' : 'Yarn dispatches saved successfully!');
  }, [dispatchDate, dispatchDenier, dispatchItems, selectedWarper, suppliers, dispatchSupplierId, dispatches, saveDispatches, dispatchBillNumber, language, showToast]);

  const handleAddFormula = useCallback(() => {
    if (!newFormulaDenier || !newFormulaMultiplier) return;
    const grams = parseFloat(newFormulaMultiplier);
    const timestamp = Date.now();
    const newFormula: DenierFormula = {
      id: timestamp.toString(),
      denier: newFormulaDenier,
      multiplier: grams / 1000,
      gramsPerEnd: grams
    };
    const updated = [...denierFormulas, newFormula];
    saveFormulas(updated);
    if (!selectedDeniers.length) setSelectedDeniers([newFormulaDenier]);
    setNewFormulaDenier('');
    setNewFormulaMultiplier('');
    setIsCustomDenier(false);
  }, [newFormulaDenier, newFormulaMultiplier, denierFormulas, saveFormulas, selectedDeniers]);

  const handleDeleteReturn = useCallback((id: string) => {
    if (window.confirm(language === 'ta' ? 'நிச்சயமாக நீக்க வேண்டுமா?' : 'Are you sure you want to delete?')) {
      saveReturns(returns.filter(r => r.id !== id));
    }
  }, [returns, saveReturns, language]);

  const handleOrderSectionChange = useCallback((index: number, field: keyof WarpSection, value: string | number) => {
    const newSections = [...orderSections];
    newSections[index] = { ...newSections[index], [field]: value };
    setOrderSections(newSections);
  }, [orderSections]);

  const addOrderSection = useCallback(() => {
    const timestamp = Date.now();
    setOrderSections([
      ...orderSections,
      { id: timestamp.toString(), name: '', ends: 0, color: '', length: 0, denier: '' }
    ]);
  }, [orderSections, language]);

  const removeOrderSection = useCallback((index: number) => {
    setOrderSections(orderSections.filter((_, i) => i !== index));
  }, [orderSections]);

  const totalEnds = orderSections.reduce((sum, sec) => sum + (sec.ends || 0), 0);
  const orderLength = parseFloat(orderWarpLength) || 0;
  
  const calculatedOrderWeight = (() => {
    if (orderLength === 0) return '0.00';
    let totalWeight = 0;
    for (const sec of orderSections) {
      if (!sec.denier || !sec.ends) continue;
      const formula = denierFormulas.find(f => f.denier === sec.denier);
      if (!formula) continue;
      const gramsPerEnd = formula.gramsPerEnd || formula.multiplier;
      totalWeight += (sec.ends * gramsPerEnd * orderLength) / 1000000;
    }
    return totalWeight.toFixed(2);
  })();

  const handleCreateOrder = useCallback(() => {
    console.log("Creating order with:", { orderDesignName, orderTotalSarees, orderTotalWeight, calculatedOrderWeight, orderWarpLength, selectedWarper, orderSections });
    
    if (!orderDesignName) { showToast(language === 'ta' ? 'தயவுசெய்து டிசைன் பெயரை உள்ளிடவும்' : 'Please enter design name', 'error'); return; }
    if (!orderTotalSarees) { showToast(language === 'ta' ? 'தயவுசெய்து மொத்த சேலைகளை உள்ளிடவும்' : 'Please enter total sarees', 'error'); return; }
    if (!(orderTotalWeight || calculatedOrderWeight)) { showToast(language === 'ta' ? 'தயவுசெய்து எடையை உள்ளிடவும்' : 'Please enter weight', 'error'); return; }
    if (!orderWarpLength) { showToast(language === 'ta' ? 'தயவுசெய்து வார்ப்பு நீளத்தை உள்ளிடவும்' : 'Please enter warp length', 'error'); return; }
    if (!selectedWarper) { showToast(language === 'ta' ? 'தயவுசெய்து வார்ப்பரை தேர்ந்தெடுக்கவும்' : 'Please select a warper', 'error'); return; }

    if (orderSections.some(s => !s.color || !s.ends || s.ends <= 0 || !s.denier)) {
      showToast(language === 'ta' ? 'அனைத்து இழைகளும், கலர்களும் மற்றும் டீனியரும் சரியாக உள்ளிடவும்' : 'Please fill all ends, colors and denier correctly', 'error');
      return;
    }

    const currentYear = new Date().getFullYear();
    const ordersThisYear = warpOrders.filter(o => new Date(o.date).getFullYear() === currentYear);
    const maxId = ordersThisYear.reduce((max, order) => {
      const idPart = parseInt(order.orderNumber.replace('ORD-', ''));
      return isNaN(idPart) ? max : Math.max(max, idPart);
    }, 100);
    const newOrderNumber = `ORD-${maxId + 1}`;

    const timestamp = Date.now();
    const newOrder: WarpOrder = {
      id: timestamp.toString() + '_stock_order',
      date: new Date().toISOString().split('T')[0],
      orderNumber: newOrderNumber,
      loomId: 'STOCK',
      weaverId: 'STOCK',
      weaverName: language === 'ta' ? 'ஸ்டாக் (Stock)' : 'Stock',
      loomNumber: '-',
      warperId: selectedWarper.id,
      designName: orderDesignName,
      sections: orderSections,
      totalEnds: orderSections.reduce((sum, sec) => sum + (sec.ends || 0), 0),
      totalLength: parseFloat(orderWarpLength) || 0,
      totalSareesExpected: parseInt(orderTotalSarees),
      warpLengthMeters: parseFloat(orderWarpLength),
      totalYarnWeight: parseFloat(orderTotalWeight || calculatedOrderWeight),
      status: 'pending',
      createdAt: timestamp
    };

    const newOrders = [...warpOrders, newOrder];
    saveWarpOrders(newOrders);

    setIsCreatingOrder(false);
    setOrderDesignName('');
    setOrderSections(() => [{ id: Date.now().toString(), name: '', ends: 0, color: '', length: 0, denier: '' }]);
    setOrderTotalSarees('');
    setOrderWarpLength('');
    setOrderWarpWeight('');
    setViewType('orders');
    
    showToast(language === 'ta' ? 'புதிய வார்ப்பு ஆர்டர் வெற்றிகரமாக உருவாக்கப்பட்டது!' : 'New Warp Order created successfully!');
  }, [orderDesignName, orderTotalSarees, orderTotalWeight, calculatedOrderWeight, orderWarpLength, selectedWarper, orderSections, warpOrders, saveWarpOrders, language, showToast]);

  const handleCompleteOrder = useCallback((orderId: string) => {
    const order = warpOrders.find(o => o.id === orderId);
    if (!order) return;

    // Change status to completed
    const updatedOrders = warpOrders.map(o => o.id === orderId ? { ...o, status: 'completed' as const } : o);
    saveWarpOrders(updatedOrders);

    // Calculate next warpNumber (S.No)
    const maxWarpNumber = returns.reduce((max, r) => {
      const num = parseInt(r.warpNumber || '0');
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const nextWarpNumber = (maxWarpNumber + 1).toString();

    // Create returns for each color section
    const newReturns: WarperReturn[] = [];
    
    // Group sections by denier and color
    const sectionGroups: Record<string, { denier: string, color: string, ends: number, weightKg: number }> = {};
    
    order.sections.forEach(sec => {
      if (sec.color && sec.ends && sec.denier) {
        const key = `${sec.denier}|${sec.color}`;
        if (!sectionGroups[key]) {
          sectionGroups[key] = { denier: sec.denier, color: sec.color, ends: 0, weightKg: 0 };
        }
        sectionGroups[key].ends += sec.ends;
        
        // Calculate weight for this section
        const formula = denierFormulas.find(f => f.denier === sec.denier);
        if (formula) {
          const gramsPerEnd = formula.gramsPerEnd || formula.multiplier;
          const secWeight = (sec.ends * gramsPerEnd * (order.warpLengthMeters || 0)) / 1000000;
          sectionGroups[key].weightKg += secWeight;
        }
      }
    });

    const timestamp = Date.now();

    Object.values(sectionGroups).forEach((group) => {
      const newReturn: WarperReturn = {
        id: timestamp.toString() + '_' + Math.random().toString(36).substr(2, 9),
        warperId: order.warperId,
        warpNumber: nextWarpNumber,
        weaverId: order.weaverId === 'STOCK' ? undefined : order.weaverId,
        weaverName: order.weaverName === 'ஸ்டாக் (Stock)' || order.weaverName === 'Stock' ? undefined : order.weaverName,
        date: new Date().toISOString().split('T')[0],
        yarnType: group.denier,
        color: group.color,
        weightKg: group.weightKg,
        ends: group.ends,
        length: order.warpLengthMeters,
        orderId: order.id,
        createdAt: timestamp
      };
      newReturns.push(newReturn);
    });

    saveReturns([...returns, ...newReturns]);
    showToast(language === 'ta' ? 'வார்ப்பு தயாராகிவிட்டது, லெஜரில் சேர்க்கப்பட்டது!' : 'Warp is ready and added to ledger!');
  }, [warpOrders, saveWarpOrders, returns, saveReturns, denierFormulas, language, showToast]);

  const handleAssignOrder = useCallback(() => {
    if (!isAssigningOrder) return;

    if (!assignWeaverId && !assignWeaverSearch.trim()) {
      showToast(language === 'ta' ? 'தயவுசெய்து தறிக்காரரை தேர்ந்தெடுக்கவும் அல்லது புதிதாக சேர்க்கவும்' : 'Please select or add a weaver', 'error');
      return;
    }

    let finalWeaverId = assignWeaverId;
    let finalWeaverName = '';
    const timestamp = Date.now();

    if (!finalWeaverId && assignWeaverSearch.trim()) {
      // Create new weaver
      const newWeaver: Weaver = {
        id: timestamp.toString(),
        name: assignWeaverSearch.trim(),
        createdAt: timestamp
      };
      const updatedWeavers = [...weavers, newWeaver];
      setWeavers(updatedWeavers);
      localStorage.setItem(`viyabaari_weavers_${user.uid || 'guest'}`, JSON.stringify(updatedWeavers));
      syncColumnToSupabase(user.uid, 'weavers', updatedWeavers);
      finalWeaverId = newWeaver.id;
      finalWeaverName = newWeaver.name;
    } else {
      finalWeaverName = weavers.find(w => w.id === finalWeaverId)?.name || '';
    }

    let finalLoomId = assignLoomId;
    let finalLoomNumber = '-';

    if (assignLoomId === 'ADD_NEW') {
      const breakText = newLoomBreak === 'Right Break' 
        ? (language === 'ta' ? 'ரைட் பிரேக்' : 'Right Break') 
        : (language === 'ta' ? 'லெஃப்ட் பிரேக்' : 'Left Break');
      const numberStr = `${newLoomNumber} - ${breakText}`;
      
      const newLoom: Loom = { 
        id: timestamp.toString(), 
        loomNumber: numberStr, 
        designName: '', 
        weaverId: finalWeaverId, 
        createdAt: timestamp 
      };
      const updatedLooms = [...looms, newLoom];
      setLooms(updatedLooms);
      localStorage.setItem(`viyabaari_looms_${user.uid || 'guest'}`, JSON.stringify(updatedLooms));
      syncColumnToSupabase(user.uid, 'looms', updatedLooms);
      finalLoomId = newLoom.id;
      finalLoomNumber = newLoom.loomNumber || '-';
    } else {
      const loom = looms.find(l => l.id === assignLoomId);
      if (loom) {
        finalLoomNumber = loom.loomNumber || '-';
      } else {
        finalLoomId = 'UNASSIGNED';
      }
    }

    const updatedOrders = warpOrders.map(o => {
      if (o.id === isAssigningOrder) {
        return {
          ...o,
          weaverId: finalWeaverId,
          weaverName: finalWeaverName,
          loomId: finalLoomId,
          loomNumber: finalLoomNumber
        };
      }
      return o;
    });

    saveWarpOrders(updatedOrders);

    // Update warperReturns if the order was already completed
    const orderToUpdate = warpOrders.find(o => o.id === isAssigningOrder);
    if (orderToUpdate && orderToUpdate.status === 'completed') {
      const updatedReturns = returns.map(r => {
        if (r.orderId === isAssigningOrder) {
          return {
            ...r,
            weaverId: finalWeaverId,
            weaverName: finalWeaverName
          };
        }
        return r;
      });
      saveReturns(updatedReturns);

      // Update loom_txns if the order was already completed
      const savedTxns = localStorage.getItem(`viyabaari_loom_txns_${user.uid || 'guest'}`);
      if (savedTxns) {
        const currentTxns: LoomTransaction[] = JSON.parse(savedTxns);
        const updatedTxns = currentTxns.map(txn => {
          if (txn.warpOrderId === isAssigningOrder && txn.type === 'warp_loaded') {
            return {
              ...txn,
              loomId: finalLoomId
            };
          }
          return txn;
        });
        localStorage.setItem(`viyabaari_loom_txns_${user.uid || 'guest'}`, JSON.stringify(updatedTxns));
        syncColumnToSupabase(user.uid, 'loom_txns', updatedTxns);
      }
    }

    setIsAssigningOrder(null);
    setAssignWeaverId('');
    setAssignWeaverSearch('');
    setAssignLoomId('');
    setNewLoomNumber('1');
    setNewLoomBreak('Right Break');
    showToast(language === 'ta' ? 'வார்ப்பு வெற்றிகரமாக தறிக்காரருக்கு மாற்றப்பட்டது!' : 'Warp successfully assigned to weaver!');
  }, [isAssigningOrder, assignWeaverId, assignWeaverSearch, weavers, user.uid, assignLoomId, newLoomBreak, language, newLoomNumber, looms, warpOrders, saveWarpOrders, returns, saveReturns, showToast]);


  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  const handleScan = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedDeniers.includes('ALL') || selectedDeniers.length !== 1) {
      showToast(language === 'ta' ? 'ஸ்கேன் செய்ய ஒரு டீனியரைத் தேர்ந்தெடுக்கவும்' : 'Please select a specific denier to scan', 'error');
      return;
    }
    console.log("handleScan triggered");
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }
    console.log("File selected:", file.name, file.type);

    setIsScanning(true);
    setScanStatus("ஸ்கேன் ஆகிறது... (Scanning...)");

    const reader = new FileReader();
    reader.onloadend = async () => {
      console.log("FileReader onloadend");
      const base64String = reader.result as string;
      
      // Resize image if too large
      const img = new Image();
      img.src = base64String;
      img.onload = async () => {
        console.log("Image loaded, resizing...");
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        
        try {
          console.log("Calling Gemini API...");
          if (!process.env.GEMINI_API_KEY) {
            console.error('Gemini API key is not configured.');
            setScanStatus('Gemini API key is not configured.');
            setIsScanning(false);
            return;
          }
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: resizedBase64,
                  },
                },
                {
                  text: `Extract the ledger entries from this image. Return the data as a JSON array of objects with fields: date (YYYY-MM-DD), weaverName (string), color (string), ends (number), weight (number), orderId (string, optional), length (number, optional). The current denier is ${selectedDeniers[0]}.`,
                },
              ],
            },
            config: {
              responseMimeType: "application/json",
            },
          });
          
          console.log("Gemini Response:", response.text);
          const data = JSON.parse(response.text || '[]');
          console.log("Parsed Data:", data);
          
          const formula = denierFormulas.find(f => f.denier === selectedDeniers[0]);
          const validatedData = data.map((entry: any) => {
            const multiplier = formula ? (formula.gramsPerEnd ? formula.gramsPerEnd / 1000 : formula.multiplier) : 0;
            const expectedWeight = entry.ends * multiplier;
            const isValid = formula ? Math.abs(entry.weight - expectedWeight) < 0.1 : true;
            return { ...entry, isValid, expectedWeight };
          });

          setScannedData(validatedData);
          setIsScanning(false);
          setScanStatus(null);
        } catch (error) {
          console.error("Error scanning:", error);
          setScanStatus('Error scanning: ' + error);
          setIsScanning(false);
        }
      };
      img.onerror = (err) => {
        console.error("Image load error:", err);
        setScanStatus("Image load error");
        setIsScanning(false);
      }
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      setScanStatus("FileReader error");
      setIsScanning(false);
    }
    reader.readAsDataURL(file);
  }, [selectedDeniers, denierFormulas, language, showToast]);

  const handleSaveScannedData = useCallback((data: any[]) => {
    if (selectedDeniers.includes('ALL') || selectedDeniers.length !== 1) {
      showToast(language === 'ta' ? 'ஸ்கேன் செய்ய ஒரு டீனியரைத் தேர்ந்தெடுக்கவும்' : 'Please select a specific denier to scan', 'error');
      return;
    }
    const timestamp = Date.now();
    const newReturns = data.map((entry, index) => {
      const weaver = weavers.find(w => w.name === entry.weaverName);
      return {
        id: (timestamp + index).toString() + Math.random(),
        warperId: selectedWarper?.id || '',
        date: entry.date,
        color: entry.color,
        weightKg: entry.weight,
        yarnType: selectedDeniers[0],
        ends: entry.ends,
        weaverId: weaver?.id,
        weaverName: entry.weaverName,
        orderId: entry.orderId,
        length: entry.length,
        createdAt: timestamp
      };
    });
    saveReturns([...returns, ...newReturns]);
    setScannedData(null);
    showToast(language === 'ta' ? 'அனைத்து பதிவுகளும் வெற்றிகரமாக சேமிக்கப்பட்டன!' : 'All records saved successfully!');
  }, [weavers, selectedWarper?.id, selectedDeniers, returns, saveReturns, language, showToast]);

  const handleDeleteOrder = useCallback((orderId: string) => {
    if (window.confirm(language === 'ta' ? 'இந்த ஆர்டரை நிச்சயமாக நீக்க வேண்டுமா?' : 'Are you sure you want to delete this order?')) {
      saveWarpOrders(warpOrders.filter(o => o.id !== orderId));
      showToast(language === 'ta' ? 'ஆர்டர் நீக்கப்பட்டது' : 'Order deleted');
    }
  }, [language, warpOrders, saveWarpOrders, showToast]);

  const filteredWarperOrders = useMemo(() => {
    const source = viewType === 'all-warps' && !selectedWarper ? warpOrders : warperOrders;
    return source.filter(order => {
      const searchMatch = !warpSearchQuery || 
        order.id.toLowerCase().includes(warpSearchQuery.toLowerCase()) ||
        (order.weaverName || '').toLowerCase().includes(warpSearchQuery.toLowerCase()) ||
        (order.loomNumber || '').toLowerCase().includes(warpSearchQuery.toLowerCase()) ||
        (order.designName || '').toLowerCase().includes(warpSearchQuery.toLowerCase());

      const wage = order.wage || 0;
      const paid = order.wagePaid || 0;
      const balance = wage - paid;

      const wageMatch = warpWageFilter === 'ALL' ||
        (warpWageFilter === 'PAID' && wage > 0 && balance <= 0) ||
        (warpWageFilter === 'UNPAID' && wage > 0 && paid === 0) ||
        (warpWageFilter === 'PARTIAL' && wage > 0 && paid > 0 && balance > 0);

      return searchMatch && wageMatch;
    });
  }, [warpOrders, warperOrders, warpSearchQuery, warpWageFilter, viewType, selectedWarper]);

  const handleUpdateWage = useCallback((orderId: string) => {
    const editState = editingWages[orderId];
    if (!editState) return;

    const updatedOrders = warpOrders.map(o => {
      if (o.id === orderId) {
        const newWagePaid = editState.wagePaid ? parseFloat(editState.wagePaid || '0') : 0;
        return {
          ...o,
          wage: editState.wage ? parseFloat(editState.wage || '0') : undefined,
          wagePaid: newWagePaid > 0 ? newWagePaid : undefined
        };
      }
      return o;
    });
    saveWarpOrders(updatedOrders);
    showToast(language === 'ta' ? 'கூலி விவரங்கள் சேமிக்கப்பட்டன!' : 'Wage details saved!');
  }, [editingWages, warpOrders, saveWarpOrders, showToast, language]);

  const warperBalances = useMemo(() => {
    if (!selectedWarper) return [];
    
    const balances: Record<string, { received: number, returned: number }> = {};
    
    warperDispatches.forEach(dispatch => {
      const color = dispatch.color || 'Unknown';
      const yarnType = dispatch.yarnType || 'Unknown';
      const key = `${yarnType}|${color}`;
      if (!balances[key]) balances[key] = { received: 0, returned: 0 };
      balances[key].received += dispatch.weightKg;
    });
    
    warperReturns.forEach(ret => {
      const color = ret.color || 'Unknown';
      const yarnType = ret.yarnType || 'Unknown';
      const key = `${yarnType}|${color}`;
      if (!balances[key]) balances[key] = { received: 0, returned: 0 };
      balances[key].returned += (ret.weightKg || 0);
    });
    
    return Object.entries(balances).map(([key, data]) => {
      const [yarnType, color] = key.split('|');
      return {
        yarnType,
        color,
        received: data.received,
        returned: data.returned,
        balance: data.received - data.returned
      };
    }).sort((a, b) => {
      if (a.yarnType !== b.yarnType) return a.yarnType.localeCompare(b.yarnType);
      return b.balance - a.balance;
    });
  }, [warperDispatches, warperReturns, selectedWarper]);


  const returnEndsVal = parseInt(returnEnds) || 0;
  const returnLengthVal = parseFloat(returnLength) || 0;
  const returnFormula = denierFormulas.find(f => f.denier === returnDenier);

  const calculatedReturnWeight = (() => {
    if (!returnFormula || returnEndsVal === 0 || returnLengthVal === 0) return '0.00';
    const gramsPerEnd = returnFormula.gramsPerEnd || returnFormula.multiplier;
    const weightKg = (returnEndsVal * gramsPerEnd * returnLengthVal) / 1000000;
    return weightKg.toFixed(2);
  })();

  // Render Warper Account View
  if (viewStatement) {
    const warper = warpers.find(w => w.id === viewStatement);
    if (!warper) return null;

    let statementDispatches = dispatches.filter(d => d.recipientType === 'warper' && d.recipientId === warper.id);
    let statementReturns = returns.filter(r => r.warperId === warper.id);
    
    if (startDate) {
      statementDispatches = statementDispatches.filter(d => d.date >= startDate);
      statementReturns = statementReturns.filter(r => r.date >= startDate);
    }
    if (endDate) {
      statementDispatches = statementDispatches.filter(d => d.date <= endDate);
      statementReturns = statementReturns.filter(r => r.date <= endDate);
    }

    const groupedStatementDispatches = Object.values(statementDispatches.reduce((acc, d) => {
      const key = d.billNumber ? `${d.date}-${d.billNumber}-${d.supplierId}` : d.id;
      if (!acc[key]) {
        acc[key] = {
          ...d,
          isDispatch: true,
          timestamp: new Date(d.date).getTime(),
          colors: { [d.color || 'Unknown']: [d.weightKg || 0] },
          weightKg: d.weightKg
        };
      } else {
        if (acc[key].colors[d.color || 'Unknown']) {
          acc[key].colors[d.color || 'Unknown'].push(d.weightKg || 0);
        } else {
          acc[key].colors[d.color || 'Unknown'] = [d.weightKg || 0];
        }
        acc[key].weightKg += d.weightKg;
      }
      return acc;
    }, {} as Record<string, any>));

    const allTxns = [
      ...groupedStatementDispatches,
      ...statementReturns.map(r => ({ ...r, isDispatch: false, timestamp: new Date(r.date).getTime() }))
    ].sort((a, b) => a.timestamp - b.timestamp);

    const totalPages = Math.ceil(allTxns.length / pageSize);
    const paginatedTxns = allTxns.slice((statementPage - 1) * pageSize, statementPage * pageSize);

    const totalReceived = statementDispatches.reduce((sum, d) => sum + d.weightKg, 0);
    const totalReturned = statementReturns.reduce((sum, r) => sum + (r.weightKg || 0), 0);
    const balance = totalReceived - totalReturned;

    return (
      <div className="bg-white min-h-screen p-4 md:p-8">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewStatement(null)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200 transition">
              {language === 'ta' ? 'மூடு' : 'Close'}
            </button>
            <h2 className="text-xl font-black text-gray-800">{warper.name}</h2>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
              <span className="text-xs font-bold text-gray-500">{language === 'ta' ? 'முதல்:' : 'From:'}</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm font-bold outline-none" />
              <span className="text-xs font-bold text-gray-500 ml-2">{language === 'ta' ? 'வரை:' : 'To:'}</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm font-bold outline-none" />
              {(startDate || endDate) && (
                <button onClick={() => {setStartDate(''); setEndDate('');}} className="ml-2 text-red-500 hover:text-red-700 text-xs font-bold">
                  {language === 'ta' ? 'அழி' : 'Clear'}
                </button>
              )}
            </div>
            <button onClick={() => window.print()} className={`flex items-center gap-2 ${buttonColor} text-white px-4 py-2 rounded-xl font-bold transition`}>
              <Printer size={18} /> {language === 'ta' ? 'பிரிண்ட் / டவுன்லோட்' : 'Print / Download'}
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto border border-gray-200 rounded-2xl p-6 print:border-none print:p-0">
          <div className="text-center mb-8 border-b pb-6">
            <h1 className="text-2xl font-black text-gray-900 mb-2">{language === 'ta' ? 'வார்ப்புகாரர் அறிக்கை' : 'Warper Statement'}</h1>
            <h2 className="text-xl font-bold text-gray-700">{warper.name}</h2>
            {warper.phone && <p className="text-gray-500 mt-1">{warper.phone}</p>}
            {(startDate || endDate) && (
              <p className="text-sm font-bold text-gray-500 mt-2">
                {startDate ? new Date(startDate).toLocaleDateString() : 'Start'} - {endDate ? new Date(endDate).toLocaleDateString() : 'End'}
              </p>
            )}
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden print:border-none print:overflow-visible">
            <div className="overflow-x-auto overflow-y-auto max-h-[60vh] print:max-h-none">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-sm print:static print:shadow-none">
                  <tr className="border-b-2 border-gray-200 text-gray-600">
                    <th className="py-3 px-4 font-bold bg-white">{language === 'ta' ? 'தேதி' : 'Date'}</th>
                    <th className="py-3 px-4 font-bold bg-white">{language === 'ta' ? 'வ.எண்' : 'S.No'}</th>
                    <th className="py-3 px-4 font-bold bg-white">{language === 'ta' ? 'விவரம்' : 'Details'}</th>
                    <th className="py-3 px-4 font-bold text-center bg-white">{language === 'ta' ? 'மீட்டர்' : 'Meter'}</th>
                    <th className="py-3 px-4 font-bold text-right bg-white">{language === 'ta' ? 'வரவு (kg)' : 'Received'}</th>
                    <th className="py-3 px-4 font-bold text-right text-green-600 bg-white">{language === 'ta' ? 'திரும்பியது (kg)' : 'Returned'}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTxns.map((txn: any, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-800">{new Date(txn.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-gray-800 font-medium">{(statementPage - 1) * pageSize + idx + 1}</td>
                      <td className="py-3 px-4 text-gray-800">
                        {txn.isDispatch ? (
                          <span className="flex items-center gap-1">
                            <ArrowDownLeft size={14} className="text-blue-500" /> 
                            {txn.yarnType} {txn.colors ? Object.entries(txn.colors).map(([c, w]) => `${c} (${(w as number[]).reduce((a,b)=>a+b,0).toFixed(2)}kg)`).join(', ') : txn.color}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1"><ArrowUpRight size={14} className="text-emerald-500" /> {txn.yarnType} {txn.color} {txn.ends ? `(${txn.ends} Ends)` : ''} {txn.warpNumber ? `(${language === 'ta' ? 'வ.எண்:' : 'S.No:'} ${txn.warpNumber})` : ''}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">
                        {!txn.isDispatch ? (txn.length || warpOrders.find(o => o.id === txn.orderId || o.orderNumber === txn.orderId)?.warpLengthMeters || '-') : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">{txn.isDispatch ? txn.weightKg.toFixed(2) : '-'}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">{!txn.isDispatch ? txn.weightKg.toFixed(2) : '-'}</td>
                    </tr>
                  ))}
                  {paginatedTxns.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 font-medium">
                        {language === 'ta' ? 'பதிவுகள் இல்லை' : 'No records found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between print:hidden">
                <div className="text-xs font-bold text-gray-500">
                  {language === 'ta' ? `பக்கம் ${statementPage} / ${totalPages}` : `Page ${statementPage} of ${totalPages}`}
                </div>
                <div className="flex gap-2">
                  <button 
                    disabled={statementPage === 1}
                    onClick={() => setStatementPage(prev => Math.max(1, prev - 1))}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-gray-50 transition"
                  >
                    {language === 'ta' ? 'முந்தைய' : 'Prev'}
                  </button>
                  <button 
                    disabled={statementPage === totalPages}
                    onClick={() => setStatementPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-gray-50 transition"
                  >
                    {language === 'ta' ? 'அடுத்த' : 'Next'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-3 bg-gray-50 p-4 rounded-xl">
              <div className="flex justify-between text-blue-600 font-bold">
                <span>{language === 'ta' ? 'மொத்த வரவு' : 'Total Received'}</span>
                <span>{totalReceived.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>{language === 'ta' ? 'மொத்தம் திரும்பியது' : 'Total Returned'}</span>
                <span>{totalReturned.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between text-xl font-black text-gray-900 border-t pt-3">
                <span>{language === 'ta' ? 'பாக்கி' : 'Balance'}</span>
                <span className={balance > 0 ? 'text-red-600' : ''}>{balance.toFixed(2)} kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isViewingColorStatement && selectedWarper) {
    const dDispatches = selectedDeniers.includes('ALL') ? warperDispatches : warperDispatches.filter(d => selectedDeniers.includes(d.yarnType));
    const dReturns = selectedDeniers.includes('ALL') ? warperReturns : warperReturns.filter(r => selectedDeniers.includes(r.yarnType));
    
    const allColors = Array.from(new Set([
      ...dDispatches.map(d => d.color || 'Unknown'),
      ...dReturns.map(r => r.color || 'Unknown')
    ])).filter(Boolean) as string[];

    const groupedDispatches = Object.values(dDispatches.reduce((acc, d) => {
      const key = d.billNumber ? `${d.date}-${d.billNumber}-${d.supplierId}` : d.id;
      if (!acc[key]) {
        acc[key] = {
          ...d,
          isDispatch: true,
          timestamp: new Date(d.date).getTime(),
          colors: { [d.color || 'Unknown']: [d.weightKg || 0] },
          endsTotal: 0
        };
      } else {
        if (acc[key].colors[d.color || 'Unknown']) {
          acc[key].colors[d.color || 'Unknown'].push(d.weightKg || 0);
        } else {
          acc[key].colors[d.color || 'Unknown'] = [d.weightKg || 0];
        }
      }
      return acc;
    }, {} as Record<string, any>));

    const groupedReturns = Object.values(dReturns.reduce((acc, r) => {
      const key = r.orderId || r.id;
      if (!acc[key]) {
        acc[key] = {
          ...r,
          isDispatch: false,
          timestamp: new Date(r.date).getTime(),
          colors: { [r.color || 'Unknown']: [r.weightKg || 0] },
          endsTotal: r.ends || 0
        };
      } else {
        if (acc[key].colors[r.color || 'Unknown']) {
          acc[key].colors[r.color || 'Unknown'].push(r.weightKg || 0);
        } else {
          acc[key].colors[r.color || 'Unknown'] = [r.weightKg || 0];
        }
        acc[key].endsTotal += (r.ends || 0);
      }
      return acc;
    }, {} as Record<string, any>));

    const allTxns = [
      ...groupedDispatches,
      ...groupedReturns
    ].sort((a, b) => a.timestamp - b.timestamp);

    const runningBalances: Record<string, number> = {};
    allColors.forEach(c => runningBalances[c] = 0);
    allTxns.forEach((txn: any) => {
      Object.entries(txn.colors).forEach(([c, weights]) => {
        const totalW = (weights as number[]).reduce((sum, w) => sum + w, 0);
        if (txn.isDispatch) runningBalances[c] += totalW;
        else runningBalances[c] -= totalW;
      });
    });

    return (
      <div className="bg-white min-h-screen p-4 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsViewingColorStatement(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200 transition">
              {language === 'ta' ? 'மூடு' : 'Close'}
            </button>
            <h2 className="text-xl font-black text-gray-800">{selectedWarper.name}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className={`flex items-center gap-2 ${buttonColor} text-white px-4 py-2 rounded-xl font-bold transition`}>
              <Printer size={18} /> {language === 'ta' ? 'பிரிண்ட் / டவுன்லோட்' : 'Print / Download'}
            </button>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto border border-gray-200 rounded-2xl p-6 print:border-none print:p-0">
          <div className="text-center mb-8 border-b pb-6">
            <h1 className="text-2xl font-black text-gray-900 mb-2">{language === 'ta' ? 'வார்ப்பு கணக்கு அறிக்கை' : 'Warp Account Statement'}</h1>
            <h2 className="text-xl font-bold text-gray-700">{selectedWarper.name}</h2>
            <p className="text-sm font-bold text-gray-500 mt-1">
              {selectedDeniers.includes('ALL') ? (language === 'ta' ? 'அனைத்து டீனியர்' : 'All Deniers') : `${selectedDeniers.join(', ')} ${language === 'ta' ? 'டீனியர்' : 'Denier'}`}
            </p>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200 text-gray-600">
                <th className="py-3 px-2 font-bold">{language === 'ta' ? 'தேதி' : 'Date'}</th>
                <th className="py-3 px-2 font-bold">{language === 'ta' ? 'வ.எண்' : 'S.No'}</th>
                <th className="py-3 px-2 font-bold">{language === 'ta' ? 'விவரம்' : 'Details'}</th>
                <th className="py-3 px-2 font-bold text-center">{language === 'ta' ? 'இழை' : 'Ends'}</th>
                <th className="py-3 px-2 font-bold text-center">{language === 'ta' ? 'மீட்டர்' : 'Meter'}</th>
                {allColors.map(c => (
                  <th key={c} className="py-3 px-2 font-bold text-right">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allTxns.map((txn: any, idx) => {
                let particulars = '';
                if (txn.isDispatch) {
                  const defaultText = language === 'ta' ? 'நூல் வரவு' : 'Yarn Given';
                  particulars = (txn.supplierName || defaultText) + (txn.billNumber ? ` (Bill: ${txn.billNumber})` : '');
                } else {
                  const order = warpOrders.find(o => o.id === txn.orderId);
                  if (order) {
                    particulars = `${order.orderNumber || ''} - ${order.weaverName || ''}`;
                  } else {
                    particulars = txn.weaverName || (language === 'ta' ? 'வரவு' : 'Return');
                  }
                  if (txn.warpNumber) particulars += ` (${language === 'ta' ? 'வ.எண்:' : 'S.No:'} ${txn.warpNumber})`;
                }

                return (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-3 px-2 text-gray-800">{new Date(txn.date).toLocaleDateString()}</td>
                    <td className="py-3 px-2 text-gray-800 font-medium">{idx + 1}</td>
                    <td className="py-3 px-2 text-gray-800 font-bold">{particulars}</td>
                    <td className="py-3 px-2 text-center font-bold text-gray-700">{!txn.isDispatch && txn.endsTotal ? txn.endsTotal : '-'}</td>
                    <td className="py-3 px-2 text-center font-bold text-gray-700">
                      {!txn.isDispatch ? (txn.length || warpOrders.find(o => o.id === txn.orderId || o.orderNumber === txn.orderId)?.warpLengthMeters || '-') : '-'}
                    </td>
                    {allColors.map(c => {
                      const weights = txn.colors[c] as number[];
                      if (!weights || weights.length === 0) return <td key={c} className="py-3 px-2 text-right text-gray-300">-</td>;
                      const displayStr = weights.map(w => w.toFixed(2)).join(' + ');
                      return (
                        <td key={c} className={`py-3 px-2 text-right font-bold ${txn.isDispatch ? 'text-blue-600' : 'text-emerald-600'}`}>
                          {txn.isDispatch ? `+${displayStr}` : `-${displayStr}`}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-black">
              <tr>
                <td colSpan={5} className="py-4 px-2 text-right text-gray-900">{language === 'ta' ? 'மீதம் (Bal):' : 'Balance:'}</td>
                {allColors.map(c => (
                  <td key={c} className={`py-4 px-2 text-right ${runningBalances[c] > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {runningBalances[c].toFixed(2)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  if (selectedWarper || viewType === 'all-warps') {
    return (
      <div className="p-4 pb-24 md:pb-4 md:max-w-none mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setSelectedWarper(null);
                setViewType('ledger');
              }}
              className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200 transition"
            >
              {language === 'ta' ? 'மூடு' : 'Close'}
            </button>
            {selectedWarper ? (
              <div>
                <h2 className="text-xl font-black text-gray-800">{selectedWarper.name}</h2>
                {selectedWarper.phone && <p className="text-xs font-bold text-gray-500">{selectedWarper.phone}</p>}
              </div>
            ) : (
              <h2 className="text-xl font-black text-gray-800">{language === 'ta' ? 'அனைத்து வார்ப்புகள்' : 'All Warps'}</h2>
            )}
          </div>
          {selectedWarper && (
            <button 
              onClick={() => setViewStatement(selectedWarper.id)}
              className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 flex items-center gap-1"
            >
              <FileText size={14} /> {language === 'ta' ? 'அறிக்கை' : 'Statement'}
            </button>
          )}
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl mb-6 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setViewType('ledger')}
            className={`flex-none px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewType === 'ledger' ? 'bg-white text-zinc-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {language === 'ta' ? 'கணக்கு நோட்டு' : 'Ledger'}
          </button>
          <button 
            onClick={() => setViewType('balance')}
            className={`flex-none px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewType === 'balance' ? 'bg-white text-zinc-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {language === 'ta' ? 'இருப்பு' : 'Balance'}
          </button>
          <button 
            onClick={() => setViewType('received')}
            className={`flex-none px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewType === 'received' ? 'bg-white text-zinc-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {language === 'ta' ? 'கொடுத்தது' : 'Given'}
          </button>
          <button 
            onClick={() => setViewType('returned')}
            className={`flex-none px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewType === 'returned' ? 'bg-white text-zinc-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {language === 'ta' ? 'வந்தது' : 'Returned'}
          </button>
          <button 
            onClick={() => setViewType('orders')}
            className={`flex-none px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewType === 'orders' ? 'bg-white text-zinc-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {language === 'ta' ? 'வார்ப்பு ஆர்டர்' : 'Warp Orders'}
          </button>
          <button 
            onClick={() => setViewType('all-warps')}
            className={`flex-none px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewType === 'all-warps' ? 'bg-white text-zinc-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {language === 'ta' ? 'அனைத்து வார்ப்புகள்' : 'All Warps'}
          </button>
        </div>

        {selectedWarper && viewType === 'ledger' && (
          <div className="space-y-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 mr-2 flex flex-wrap gap-2">
                <button 
                  onClick={() => { setSelectedDeniers(['ALL']); setLedgerPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${selectedDeniers.includes('ALL') ? 'bg-zinc-800 text-white border-zinc-800 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                  {language === 'ta' ? 'அனைத்து டீனியர்' : 'All Deniers'}
                </button>
                {denierFormulas.map(f => (
                  <button 
                    key={f.id}
                    onClick={() => {
                      if (selectedDeniers.includes(f.denier)) {
                        const newSelection = selectedDeniers.filter(d => d !== f.denier).filter(d => d !== 'ALL');
                        setSelectedDeniers(newSelection.length === 0 ? ['ALL'] : newSelection);
                      } else {
                        setSelectedDeniers([...selectedDeniers.filter(d => d !== 'ALL'), f.denier]);
                      }
                      setLedgerPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${selectedDeniers.includes(f.denier) ? 'bg-zinc-800 text-white border-zinc-800 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  >
                    {f.denier}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsManagingFormulas(true)}
                className="p-2 bg-white text-gray-500 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 flex-shrink-0"
                title={language === 'ta' ? 'ஃபார்முலா செட்டிங்ஸ்' : 'Formula Settings'}
              >
                <Settings size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <button 
                onClick={openAddDispatchModal}
                className="flex-1 py-2 bg-zinc-50 text-zinc-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-zinc-100 transition"
              >
                <ArrowDownLeft size={16} /> {language === 'ta' ? 'நூல் வரவு' : 'Yarn Given'}
              </button>
              <button
                onClick={() => setShowScanOptions(true)}
                className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-100 transition cursor-pointer"
              >
                <Camera size={16} /> {language === 'ta' ? 'ஸ்கேன் செய்' : 'Scan'}
              </button>
              <button
                onClick={() => setIsViewingColorStatement(true)}
                className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-emerald-100 transition cursor-pointer"
              >
                <FileText size={16} /> {language === 'ta' ? 'அறிக்கை' : 'Statement'}
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    const text = `Warper Report: ${selectedWarper?.name || 'All'}\nDeniers: ${selectedDeniers.join(', ')}\nBalance: Check app for details.`;
                    navigator.share({
                      title: 'Warper Report',
                      text: text,
                      url: window.location.href
                    }).catch(console.error);
                  } else {
                    alert('Sharing not supported on this browser');
                  }
                }}
                className="flex-1 py-2 bg-zinc-50 text-zinc-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-zinc-100 transition cursor-pointer"
              >
                <Share2 size={16} /> {language === 'ta' ? 'பகிர்' : 'Share'}
              </button>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={cameraInputRef}
                onChange={handleScan}
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={galleryInputRef}
                onChange={handleScan}
              />
              {showScanOptions && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowScanOptions(false)}>
                  <div className="bg-white p-4 rounded-2xl shadow-xl w-64 space-y-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setShowScanOptions(false); cameraInputRef.current?.click(); }} className="w-full py-3 bg-zinc-100 rounded-xl font-bold">{language === 'ta' ? 'கேமரா' : 'Camera'}</button>
                    <button onClick={() => { setShowScanOptions(false); galleryInputRef.current?.click(); }} className="w-full py-3 bg-zinc-100 rounded-xl font-bold">{language === 'ta' ? 'கேலரி' : 'Gallery'}</button>
                    <button onClick={() => setShowScanOptions(false)} className="w-full py-3 bg-gray-200 rounded-xl font-bold">{language === 'ta' ? 'ரத்து' : 'Cancel'}</button>
                  </div>
                </div>
              )}
            </div>

            {scannedData && (
              <ScanVerificationModal 
                data={scannedData} 
                onClose={() => setScannedData(null)} 
                onSave={handleSaveScannedData}
                language={language}
              />
            )}

            {selectedDeniers.length > 0 ? (
              (() => {
                const renderLedgerTable = (deniers: string[]) => {
                  const dDispatches = warperDispatches.filter(d => deniers.includes('ALL') || deniers.includes(d.yarnType));
                  const dReturns = warperReturns.filter(r => deniers.includes('ALL') || deniers.includes(r.yarnType));
                  
                  if (dDispatches.length === 0 && dReturns.length === 0) return null;
                  
                  const allColorDeniers = Array.from(new Set([
                    ...dDispatches.map(d => `${d.color || 'Unknown'}|${d.yarnType}`),
                    ...dReturns.map(r => `${r.color || 'Unknown'}|${r.yarnType}`)
                  ])).filter(Boolean) as string[];

                  const groupedDispatches = Object.values(dDispatches.reduce((acc, d) => {
                    const key = d.billNumber ? `${d.date}-${d.billNumber}-${d.supplierId}` : d.id;
                    const colorKey = `${d.color || 'Unknown'}|${d.yarnType}`;
                    if (!acc[key]) {
                      acc[key] = {
                        ...d,
                        isDispatch: true,
                        timestamp: new Date(d.date).getTime(),
                        colors: { [colorKey]: [d.weightKg || 0] },
                        endsTotal: 0
                      };
                    } else {
                      if (acc[key].colors[colorKey]) {
                        acc[key].colors[colorKey].push(d.weightKg || 0);
                      } else {
                        acc[key].colors[colorKey] = [d.weightKg || 0];
                      }
                    }
                    return acc;
                  }, {} as Record<string, any>));

                  const groupedReturns = Object.values(dReturns.reduce((acc, r) => {
                    const key = r.orderId || r.id;
                    const colorKey = `${r.color || 'Unknown'}|${r.yarnType}`;
                    if (!acc[key]) {
                      acc[key] = {
                        ...r,
                        isDispatch: false,
                        timestamp: new Date(r.date).getTime(),
                        colors: { [colorKey]: [r.weightKg || 0] },
                        endsTotal: r.ends || 0
                      };
                    } else {
                      if (acc[key].colors[colorKey]) {
                        acc[key].colors[colorKey].push(r.weightKg || 0);
                      } else {
                        acc[key].colors[colorKey] = [r.weightKg || 0];
                      }
                      acc[key].endsTotal = Math.max(acc[key].endsTotal, r.ends || 0);
                    }
                    return acc;
                  }, {} as Record<string, any>));

                  const allTxns = [
                    ...groupedDispatches,
                    ...groupedReturns
                  ].sort((a, b) => ledgerSortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);

                  const totalPages = Math.ceil(allTxns.length / pageSize);
                  const paginatedTxns = allTxns.slice((ledgerPage - 1) * pageSize, ledgerPage * pageSize);

                  const runningBalances: Record<string, number> = {};
                  allColorDeniers.forEach(cd => runningBalances[cd] = 0);
                  
                  allTxns.forEach((txn: any) => {
                    Object.entries(txn.colors).forEach(([cd, weights]) => {
                      const totalW = (weights as number[]).reduce((sum, w) => sum + w, 0);
                      if (txn.isDispatch) {
                        runningBalances[cd] += totalW;
                      } else {
                        runningBalances[cd] -= totalW;
                      }
                    });
                  });

                  return (
                    <div key={deniers.join(',')} className="mb-12">
                      <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-lg font-black text-gray-800 uppercase tracking-wider flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-zinc-600"></div>
                          {deniers.includes('ALL') ? (language === 'ta' ? 'அனைத்து டீனியர்' : 'All Deniers') : deniers.join(', ')} {language === 'ta' ? 'டீனியர்' : 'Denier'}
                        </h3>
                        {totalPages > 1 && (
                          <div className="text-xs font-bold text-gray-400">
                            {language === 'ta' ? `பக்கம் ${ledgerPage} / ${totalPages}` : `Page ${ledgerPage} of ${totalPages}`}
                          </div>
                        )}
                      </div>
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] scrollbar-thin">
                          <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                            <thead className="sticky top-0 z-10 bg-gray-50 text-gray-500 font-bold border-b border-gray-100 shadow-sm">
                              <tr>
                                <th 
                                  className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition flex items-center gap-1"
                                  onClick={() => setLedgerSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                >
                                  {language === 'ta' ? 'தேதி' : 'Date'}
                                  <div className="flex flex-col">
                                    <ChevronUp size={10} className={ledgerSortOrder === 'asc' ? 'text-zinc-600' : 'text-gray-300'} />
                                    <ChevronDown size={10} className={ledgerSortOrder === 'desc' ? 'text-zinc-600' : 'text-gray-300'} />
                                  </div>
                                </th>
                                <th className="p-3 bg-gray-50">{language === 'ta' ? 'வ.எண்' : 'S.No'}</th>
                                <th className="p-3 bg-gray-50">{language === 'ta' ? 'விவரம்' : 'Particulars'}</th>
                                <th className="p-3 text-center bg-gray-50">{language === 'ta' ? 'இழை' : 'Ends'}</th>
                                <th className="p-3 text-center bg-gray-50">{language === 'ta' ? 'மீட்டர்' : 'Meter'}</th>
                                {allColorDeniers.map(cd => {
                                  const [color, denier] = cd.split('|');
                                  return (
                                    <th key={cd} className="p-3 text-right text-zinc-600 bg-gray-50">
                                      <div className="flex flex-col items-end">
                                        <span className="text-[10px]">{color}</span>
                                        <span className="text-[8px] opacity-50 font-medium">{denier}</span>
                                      </div>
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {paginatedTxns.map((txn: any, idx: number) => {
                                let particulars = '';
                                if (txn.isDispatch) {
                                  const defaultText = language === 'ta' ? 'நூல் வரவு' : 'Yarn Given';
                                  particulars = (txn.supplierName || defaultText) + (txn.billNumber ? ` (Bill: ${txn.billNumber})` : '');
                                } else {
                                  const order = warpOrders.find(o => o.id === txn.orderId);
                                  let baseParticulars = '';
                                  if (order) {
                                    const orderNum = order.orderNumber || '';
                                    if (order.weaverId === 'STOCK') {
                                      baseParticulars = `Stock - ${orderNum}`;
                                    } else {
                                      baseParticulars = `${orderNum} - ${order.weaverName || ''}`;
                                    }
                                  } else {
                                    baseParticulars = txn.weaverName || (language === 'ta' ? 'வரவு' : 'Return');
                                  }
                                  
                                  if (txn.warpNumber) {
                                    particulars = `${baseParticulars} (${language === 'ta' ? 'வ.எண்:' : 'S.No:'} ${txn.warpNumber})`;
                                  } else {
                                    particulars = baseParticulars;
                                  }
                                }

                                return (
                                  <tr key={txn.id} className="hover:bg-gray-50/50 transition">
                                    <td className="p-3 text-gray-500">{new Date(txn.date).toLocaleDateString()}</td>
                                    <td className="p-3 text-gray-500 font-medium">{(ledgerPage - 1) * pageSize + idx + 1}</td>
                                    <td className="p-3 font-medium text-gray-800">
                                      <button 
                                        onClick={() => {
                                          if (txn.isDispatch) {
                                            setViewingDetail({ type: 'dispatch', data: txn });
                                          } else {
                                            const order = warpOrders.find(o => o.id === txn.orderId || o.orderNumber === txn.orderId);
                                            if (order) {
                                              setViewingDetail({ type: 'order', data: order });
                                            } else {
                                              setViewingDetail({ type: 'return', data: txn });
                                            }
                                          }
                                        }}
                                        className="text-left hover:text-blue-600 transition-colors"
                                      >
                                        {particulars}
                                      </button>
                                    </td>
                                    <td className="p-3 text-center font-bold text-gray-600">{!txn.isDispatch && txn.endsTotal ? txn.endsTotal : '-'}</td>
                                    <td className="p-3 text-center font-bold text-gray-600">
                                      {!txn.isDispatch ? (txn.length || warpOrders.find(o => o.id === txn.orderId || o.orderNumber === txn.orderId)?.warpLengthMeters || '-') : '-'}
                                    </td>
                                    {allColorDeniers.map(cd => {
                                      const weights = txn.colors[cd] as number[];
                                      if (!weights || weights.length === 0) {
                                        return <td key={cd} className="p-3 text-right text-gray-300"></td>;
                                      }
                                      const displayStr = weights.map(w => w.toFixed(2)).join(' + ');
                                      return (
                                        <td key={cd} className={`p-3 text-right font-bold ${txn.isDispatch ? 'text-zinc-600' : 'text-emerald-600'}`}>
                                          {txn.isDispatch ? `+${displayStr}` : `-${displayStr}`}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="sticky bottom-0 z-10 bg-gray-50 border-t-2 border-gray-100 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                              <tr>
                                <td colSpan={5} className="p-3 font-black text-right text-gray-600 bg-gray-50">{language === 'ta' ? 'மீதம் (Bal):' : 'Balance:'}</td>
                                {allColorDeniers.map(cd => (
                                  <td key={cd} className={`p-3 text-right font-black bg-gray-50 ${runningBalances[cd] > 0 ? 'text-red-500' : runningBalances[cd] < 0 ? 'text-emerald-500' : 'text-gray-800'}`}>
                                    {runningBalances[cd].toFixed(2)}
                                  </td>
                                ))}
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                        
                        {totalPages > 1 && (
                          <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <div className="text-[10px] font-bold text-gray-500">
                              {language === 'ta' ? `பக்கம் ${ledgerPage} / ${totalPages}` : `Page ${ledgerPage} of ${totalPages}`}
                            </div>
                            <div className="flex gap-2">
                              <button 
                                disabled={ledgerPage === 1}
                                onClick={() => setLedgerPage(prev => Math.max(1, prev - 1))}
                                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-50"
                              >
                                {language === 'ta' ? 'முந்தைய' : 'Prev'}
                              </button>
                              <button 
                                disabled={ledgerPage === totalPages}
                                onClick={() => setLedgerPage(prev => Math.min(totalPages, prev + 1))}
                                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-50"
                              >
                                {language === 'ta' ? 'அடுத்த' : 'Next'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                };

                const deniersWithActivity = Array.from(new Set([
                  ...warperDispatches.map(d => d.yarnType),
                  ...warperReturns.map(r => r.yarnType)
                ])).filter(Boolean).sort();
                
                const deniersToRender = selectedDeniers.includes('ALL') 
                  ? deniersWithActivity
                  : selectedDeniers;
                
                if (deniersToRender.length === 0 && selectedDeniers.includes('ALL')) {
                  return (
                    <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
                      <p className="text-gray-500 font-bold tamil-font text-lg">
                        {language === 'ta' ? 'பதிவுகள் எதுவும் இல்லை' : 'No records found'}
                      </p>
                    </div>
                  );
                }

                return renderLedgerTable(deniersToRender);
              })()
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 font-bold tamil-font text-sm">
                  {language === 'ta' ? 'டீனியரை தேர்ந்தெடுக்கவும்' : 'Select a Denier'}
                </p>
              </div>
            )}
          </div>
        )}

        {selectedWarper && viewType === 'orders' && (
          <div className="space-y-4">
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => setIsCreatingOrder(true)}
                className={`${buttonColor} text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition`}
              >
                <Plus size={16} /> {language === 'ta' ? 'புதிய வார்ப்பு ஆர்டர் உருவாக்கு' : 'Create New Warp Order'}
              </button>
            </div>
            
            {warperOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
                <p className="text-gray-500 font-bold tamil-font text-lg">
                  {language === 'ta' ? 'ஆர்டர்கள் எதுவும் இல்லை' : 'No orders available'}
                </p>
              </div>
            ) : (
              warperOrders.map(order => (
                <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {order.orderNumber && (
                          <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded-lg">
                            {order.orderNumber}
                          </span>
                        )}
                        <span className="bg-zinc-100 text-zinc-800 text-xs font-bold px-2 py-1 rounded-lg">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-black text-gray-800 text-lg">{order.designName}</h4>
                      <p className="text-sm text-gray-500 font-medium">
                        {language === 'ta' ? 'தறிகாரர்:' : 'Weaver:'} {order.weaverName} 
                        {order.loomNumber !== '-' && ` (தறி ${order.loomNumber})`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => handleCompleteOrder(order.id)}
                          className="bg-emerald-100 text-emerald-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-emerald-200 transition"
                        >
                          {language === 'ta' ? 'ஓகே (தயார்)' : 'OK (Ready)'}
                        </button>
                      )}
                      {(order.loomId === 'STOCK' || order.loomId === 'UNASSIGNED') && (
                        <button 
                          onClick={() => {
                            setIsAssigningOrder(order.id);
                            const wId = order.weaverId === 'STOCK' ? '' : (order.weaverId || '');
                            setAssignWeaverId(wId);
                            setAssignWeaverSearch(wId ? (weavers.find(w => w.id === wId)?.name || '') : '');
                            setAssignLoomId('');
                          }}
                          className="bg-zinc-100 text-zinc-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-zinc-200 transition"
                        >
                          {language === 'ta' ? 'தறிக்கு மாற்று' : 'Assign to Loom'}
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'வார்ப்பு நூல்' : 'Warp Yarn'}</p>
                      <p className="font-bold text-gray-800">{order.warpYarnType}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'ஊடை நூல்' : 'Weft Yarn'}</p>
                      <p className="font-bold text-gray-800">{order.weftYarnType}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl col-span-2">
                      <p className="text-xs text-gray-500 font-medium mb-1">{language === 'ta' ? 'அமைப்பு' : 'Structure'}</p>
                      <div className="flex flex-wrap gap-2">
                        {order.sections.map((sec, idx) => (
                          <div key={idx} className="bg-white border border-gray-200 px-2 py-1 rounded text-xs flex items-center gap-1">
                            <span className="text-gray-500">{sec.name}{sec.denier ? ` (${sec.denier})` : ''}:</span>
                            <span className="font-bold">{sec.ends}</span>
                            {sec.color && <span className="text-xs text-zinc-600 ml-1">({sec.color})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'மொத்த சேலை' : 'Total Sarees'}</p>
                      <p className="font-bold text-gray-800">{order.totalSareesExpected}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'வார்ப்பு (மீட்டர்)' : 'Warp (Meters)'}</p>
                      <p className="font-bold text-gray-800">{order.warpLengthMeters || '-'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {viewType === 'all-warps' && (
          <div className="space-y-4">
            {warperOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
                <p className="text-gray-500 font-bold tamil-font text-lg">
                  {language === 'ta' ? 'ஆர்டர்கள் எதுவும் இல்லை' : 'No orders available'}
                </p>
              </div>
            ) : (
              <>
                {/* Search and Filter */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder={language === 'ta' ? 'ஐடி, தறிகாரர் பெயர் தேட...' : 'Search ID, Weaver...'}
                      value={warpSearchQuery}
                      onChange={(e) => setWarpSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-zinc-400"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                    <button
                      onClick={() => setWarpWageFilter('ALL')}
                      className={`flex-none px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${warpWageFilter === 'ALL' ? `${buttonColor} text-white` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {language === 'ta' ? 'அனைத்தும்' : 'All'}
                    </button>
                    <button
                      onClick={() => setWarpWageFilter('PAID')}
                      className={`flex-none px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${warpWageFilter === 'PAID' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                    >
                      {language === 'ta' ? 'கூலி கொடுத்தது' : 'Fully Paid'}
                    </button>
                    <button
                      onClick={() => setWarpWageFilter('UNPAID')}
                      className={`flex-none px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${warpWageFilter === 'UNPAID' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                    >
                      {language === 'ta' ? 'கூலி கொடுக்க வேண்டியது' : 'Unpaid'}
                    </button>
                    <button
                      onClick={() => setWarpWageFilter('PARTIAL')}
                      className={`flex-none px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${warpWageFilter === 'PARTIAL' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                    >
                      {language === 'ta' ? 'பாதி கூலி கொடுத்தது' : 'Partially Paid'}
                    </button>
                  </div>
                </div>

                {/* Summary Section - Moved to Top */}
                <div className={`${buttonColor} text-white p-5 rounded-2xl shadow-lg mb-6`}>
                  <h4 className="font-bold mb-4 opacity-90">{language === 'ta' ? 'மொத்த கணக்குகள்' : 'Total Accounts'}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs opacity-70 mb-1">{language === 'ta' ? 'மொத்த கூலி' : 'Total Wage'}</p>
                      <p className="text-xl font-black">₹{filteredWarperOrders.reduce((sum, o) => sum + (o.wage || 0), 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 mb-1">{language === 'ta' ? 'கொடுத்தது' : 'Total Paid'}</p>
                      <p className="text-xl font-black text-emerald-400">₹{filteredWarperOrders.reduce((sum, o) => sum + (o.wagePaid || 0), 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 mb-1">{language === 'ta' ? 'மீதமுள்ள பாக்கி' : 'Total Balance'}</p>
                      <p className="text-xl font-black text-red-400">₹{filteredWarperOrders.reduce((sum, o) => sum + ((o.wage || 0) - (o.wagePaid || 0)), 0)}</p>
                    </div>
                  </div>
                </div>

                {filteredWarperOrders.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500 font-bold text-sm">
                      {language === 'ta' ? 'தேடலுக்கு ஏற்ற முடிவுகள் இல்லை' : 'No results found'}
                    </p>
                  </div>
                ) : (
                  filteredWarperOrders.map(order => {
                  const isEditingWage = editingWages[order.id] !== undefined;
                  const wageState = editingWages[order.id] || { wage: order.wage?.toString() || '', wagePaid: order.wagePaid?.toString() || '' };
                  const balance = (order.wage || 0) - (order.wagePaid || 0);
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      {/* Summary View */}
                      <div 
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-zinc-100 text-zinc-800 text-xs font-bold px-2 py-1 rounded-lg">
                              {language === 'ta' ? 'ஐடி:' : 'ID:'} {order.orderNumber || order.id.slice(-4)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                              <p className="text-xs text-gray-500">{language === 'ta' ? 'தறிகாரர்' : 'Weaver'}</p>
                              <p className="font-bold text-gray-800 text-sm">{order.weaverName || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">{language === 'ta' ? 'தறி எண்' : 'Loom No'}</p>
                              <p className="font-bold text-gray-800 text-sm">{order.loomNumber || '-'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 text-gray-400">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                          <div className="mb-4">
                            <h4 className="font-black text-gray-800 text-lg mb-1">{order.designName}</h4>
                            <span className="text-gray-500 text-xs">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="bg-gray-50 p-2 rounded-xl">
                              <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'மொத்த சேலை' : 'Total Sarees'}</p>
                              <p className="font-bold text-gray-800">{order.totalSareesExpected}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-xl">
                              <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'வார்ப்பு (மீட்டர்)' : 'Warp (Meters)'}</p>
                              <p className="font-bold text-gray-800">{order.warpLengthMeters || '-'}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-xl">
                              <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'மொத்த இழைகள்' : 'Total Ends'}</p>
                              <p className="font-bold text-gray-800">{order.totalEnds}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-xl">
                              <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'மொத்த எடை' : 'Total Weight'}</p>
                              <p className="font-bold text-gray-800">{(order.totalWeight || 0).toFixed(3)} kg</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h5 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">{language === 'ta' ? 'நூல் விவரங்கள்' : 'Yarn Details'}</h5>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><span className="text-gray-500">{language === 'ta' ? 'பாவு:' : 'Warp:'}</span> <span className="font-bold">{order.warpYarnType}</span></div>
                              <div><span className="text-gray-500">{language === 'ta' ? 'ஊடை:' : 'Weft:'}</span> <span className="font-bold">{order.weftYarnType}</span></div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h5 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">{language === 'ta' ? 'பிரிவுகள்' : 'Sections'}</h5>
                            <div className="space-y-2">
                              {order.sections.map((section, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PREDEFINED_COLORS.find(c => c.name === section.color)?.code || '#ccc' }} />
                                    <span className="font-bold">{section.color}</span>
                                  </div>
                                  <div className="text-gray-600">
                                    {section.ends} {language === 'ta' ? 'இழைகள்' : 'Ends'} • {(section.weight || 0).toFixed(3)} kg
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-gray-100 pt-4 mt-2">
                            <h5 className="text-sm font-bold text-gray-700 mb-3">{language === 'ta' ? 'கூலி விவரங்கள்' : 'Wage Details'}</h5>
                            
                            {isEditingWage ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">{language === 'ta' ? 'மொத்த கூலி (₹)' : 'Total Wage (₹)'}</label>
                                    <input 
                                      type="number" 
                                      value={wageState.wage}
                                      onChange={e => setEditingWages({...editingWages, [order.id]: {...wageState, wage: e.target.value}})}
                                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-zinc-400"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">{language === 'ta' ? 'கொடுத்த கூலி (₹)' : 'Wage Paid (₹)'}</label>
                                    <input 
                                      type="number" 
                                      value={wageState.wagePaid}
                                      onChange={e => setEditingWages({...editingWages, [order.id]: {...wageState, wagePaid: e.target.value}})}
                                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-zinc-400"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      const newEditing = {...editingWages};
                                      delete newEditing[order.id];
                                      setEditingWages(newEditing);
                                    }}
                                    className="flex-1 py-2 border border-gray-200 text-gray-600 font-bold rounded-lg text-sm hover:bg-gray-50"
                                  >
                                    {language === 'ta' ? 'ரத்து' : 'Cancel'}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      handleUpdateWage(order.id);
                                      const newEditing = {...editingWages};
                                      delete newEditing[order.id];
                                      setEditingWages(newEditing);
                                    }}
                                    className={`flex-1 py-2 ${buttonColor} text-white font-bold rounded-lg text-sm`}
                                  >
                                    {language === 'ta' ? 'சேமி' : 'Save'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                                    <p className="text-[10px] text-gray-500">{language === 'ta' ? 'மொத்த கூலி' : 'Total Wage'}</p>
                                    <p className="font-bold text-gray-700">₹{order.wage || 0}</p>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                                    <p className="text-[10px] text-gray-500">{language === 'ta' ? 'கொடுத்தது' : 'Paid'}</p>
                                    <p className="font-bold text-green-600">₹{order.wagePaid || 0}</p>
                                  </div>
                                  <div className={`p-2 rounded-lg text-center ${balance > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                                    <p className={`text-[10px] ${balance > 0 ? 'text-red-500' : 'text-gray-500'}`}>{language === 'ta' ? 'பாக்கி' : 'Balance'}</p>
                                    <p className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-gray-700'}`}>₹{balance}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setEditingWages({...editingWages, [order.id]: { wage: order.wage?.toString() || '', wagePaid: order.wagePaid?.toString() || '' }})}
                                  className="w-full py-2 border border-zinc-200 text-zinc-600 font-bold rounded-lg text-sm hover:bg-zinc-50 transition"
                                >
                                  {language === 'ta' ? 'கூலியை திருத்து' : 'Edit Wage'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }))}
              </>
            )}
          </div>
        )}

        {selectedWarper && viewType === 'balance' && (
          <div className="space-y-4">
            {warperBalances.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PieChart size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-bold tamil-font text-lg">
                  {language === 'ta' ? 'கணக்குகள் எதுவும் இல்லை' : 'No balances available'}
                </p>
              </div>
            ) : (
              Object.entries(
                warperBalances.reduce((acc, item) => {
                  if (!acc[item.yarnType]) acc[item.yarnType] = [];
                  acc[item.yarnType].push(item);
                  return acc;
                }, {} as Record<string, typeof warperBalances>)
              ).map(([yarnType, items]) => (
                <div key={yarnType} className="mb-8">
                  <h3 className="text-sm font-black text-gray-500 mb-3 uppercase tracking-wider">
                    {yarnType !== 'Unknown' ? yarnType : (language === 'ta' ? 'டீனியர் இல்லை' : 'No Denier')}
                  </h3>
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-zinc-500"></div>
                            <h4 className="font-black text-gray-800 text-lg">{item.color}</h4>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${item.balance > 0 ? 'bg-emerald-100 text-emerald-700' : item.balance < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                            {language === 'ta' ? 'மீதம்: ' : 'Bal: '}{item.balance.toFixed(2)} kg
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-zinc-50 p-3 rounded-xl">
                            <p className="text-xs text-zinc-600 font-bold mb-1">{language === 'ta' ? 'கொடுத்தது' : 'Given'}</p>
                            <p className="font-black text-zinc-900 text-lg">{item.received.toFixed(2)} kg</p>
                          </div>
                          <div className="bg-emerald-50 p-3 rounded-xl">
                            <p className="text-xs text-emerald-600 font-bold mb-1">{language === 'ta' ? 'வந்தது' : 'Returned'}</p>
                            <p className="font-black text-emerald-900 text-lg">{item.returned.toFixed(2)} kg</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedWarper && viewType === 'received' && (
          <div className="space-y-4">
            {groupedDispatches.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowDownLeft size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-bold tamil-font text-lg">
                  {language === 'ta' ? 'நூல் எதுவும் கொடுக்கவில்லை' : 'No yarn given yet'}
                </p>
              </div>
            ) : (
              groupedDispatches.map((group, gIdx) => {
                const first = group[0];
                const totalWeight = group.reduce((sum, d) => sum + d.weightKg, 0);
                
                return (
                  <div key={gIdx} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-zinc-100 text-zinc-800 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                          {new Date(first.date).toLocaleDateString()}
                        </div>
                        {first.billNumber && (
                          <div className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                            {language === 'ta' ? 'பில்: ' : 'Bill: '}{first.billNumber}
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-black text-zinc-400">
                        {first.yarnType}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {group.map((dispatch) => (
                        <div key={dispatch.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
                            <span className="text-sm font-bold text-gray-700">{dispatch.color}</span>
                          </div>
                          <span className="text-sm font-black text-zinc-900">{dispatch.weightKg.toFixed(2)} kg</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-end">
                      <div>
                        {first.supplierName && (
                          <>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">{language === 'ta' ? 'சப்ளையர்' : 'Supplier'}</p>
                            <p className="text-sm font-bold text-gray-800">{first.supplierName}</p>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">{language === 'ta' ? 'மொத்த எடை' : 'Total Weight'}</p>
                        <p className="text-lg font-black text-zinc-900">{totalWeight.toFixed(2)} kg</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {selectedWarper && viewType === 'returned' && (
          <>
            {warperReturns.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowUpRight size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-bold tamil-font text-lg">
                  {language === 'ta' ? 'வரவுகள் எதுவும் இல்லை' : 'No returns yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {warperReturns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(ret => (
                  <div key={ret.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-lg">
                          {new Date(ret.date).toLocaleDateString()}
                        </div>
                        {ret.warpNumber && (
                          <div className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-lg">
                            {language === 'ta' ? 'வ.எண்:' : 'S.No:'} {ret.warpNumber}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => handleDeleteReturn(ret.id)} 
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'கலர்' : 'Color'}</p>
                        <p className="font-bold text-gray-800">{ret.color}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'கிலோ' : 'Weight'}</p>
                        <p className="font-bold text-gray-800">{ret.weightKg} kg</p>
                      </div>
                      {ret.yarnType && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'டீனியர்' : 'Denier'}</p>
                          <p className="font-bold text-gray-800">{ret.yarnType}</p>
                        </div>
                      )}
                      {ret.ends && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'இழை' : 'Ends'}</p>
                          <p className="font-bold text-gray-800">{ret.ends}</p>
                        </div>
                      )}
                      {ret.weaverName && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 font-medium">{language === 'ta' ? 'தறிகாரர்' : 'Weaver'}</p>
                          <p className="font-bold text-gray-800">{ret.weaverName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      {isAssigningOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h3 className="font-black text-gray-800 mb-6 text-xl tamil-font">{language === 'ta' ? 'தறிக்கு மாற்று' : 'Assign to Loom'}</h3>
            
            <div className="space-y-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={assignWeaverSearch}
                  onChange={(e) => {
                    setAssignWeaverSearch(e.target.value);
                    const existing = weavers.find(w => w.name.toLowerCase() === e.target.value.toLowerCase());
                    if (existing) {
                      setAssignWeaverId(existing.id);
                    } else {
                      setAssignWeaverId('');
                    }
                    setAssignLoomId('');
                  }}
                  onFocus={() => setShowWeaverDropdown(true)}
                  onBlur={() => setTimeout(() => setShowWeaverDropdown(false), 200)}
                  placeholder={language === 'ta' ? 'தறிக்காரர் பெயர் (தேட அல்லது புதிதாக சேர்க்க)' : 'Weaver Name (Search or Add New)'}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                />
                {showWeaverDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg max-h-48 overflow-y-auto">
                    {weavers.filter(w => w.name.toLowerCase().includes(assignWeaverSearch.toLowerCase())).map(w => (
                      <div
                        key={w.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer font-bold text-sm"
                        onClick={() => {
                          setAssignWeaverId(w.id);
                          setAssignWeaverSearch(w.name);
                          setShowWeaverDropdown(false);
                        }}
                      >
                        {w.name}
                      </div>
                    ))}
                    {assignWeaverSearch.trim() && !weavers.some(w => w.name.toLowerCase() === assignWeaverSearch.trim().toLowerCase()) && (
                      <div
                        className="p-3 hover:bg-gray-50 cursor-pointer font-bold text-sm text-blue-600"
                        onClick={() => {
                          setAssignWeaverId('');
                          setShowWeaverDropdown(false);
                        }}
                      >
                        + {language === 'ta' ? `புதிய தறிக்காரர்: "${assignWeaverSearch}"` : `Add New: "${assignWeaverSearch}"`}
                      </div>
                    )}
                    {!assignWeaverSearch.trim() && weavers.length === 0 && (
                      <div className="p-3 text-gray-400 text-sm text-center">
                        {language === 'ta' ? 'தறிக்காரர்கள் இல்லை' : 'No weavers found'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <select 
                value={assignLoomId}
                onChange={e => setAssignLoomId(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                disabled={!assignWeaverId && !assignWeaverSearch.trim()}
              >
                <option value="">{language === 'ta' ? '-- தறியை தேர்ந்தெடுக்கவும் (விருப்பப்பட்டால்) --' : '-- Select Loom (Optional) --'}</option>
                {looms.filter(l => l.weaverId === assignWeaverId).map(l => (
                  <option key={l.id} value={l.id}>{language === 'ta' ? 'தறி' : 'Loom'} {l.loomNumber} {l.designName ? `- ${l.designName}` : ''}</option>
                ))}
                <option value="ADD_NEW" className="text-zinc-600 font-black">+ {language === 'ta' ? 'புதிய தறி' : 'Add New Loom'}</option>
              </select>

              {assignLoomId === 'ADD_NEW' && (
                <div className="flex gap-3 mt-3 animate-in fade-in slide-in-from-top-2">
                  <select
                    value={newLoomNumber}
                    onChange={(e) => setNewLoomNumber(e.target.value)}
                    className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                  >
                    <option value="" disabled>{language === 'ta' ? 'எண்' : 'Number'}</option>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                  
                  <select
                    value={newLoomBreak}
                    onChange={(e) => setNewLoomBreak(e.target.value)}
                    className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                  >
                    <option value="Right Break">{language === 'ta' ? 'ரைட் பிரேக்' : 'Right Break'}</option>
                    <option value="Left Break">{language === 'ta' ? 'லெஃப்ட் பிரேக்' : 'Left Break'}</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setIsAssigningOrder(null);
                  setAssignWeaverId('');
                  setAssignWeaverSearch('');
                  setAssignLoomId('');
                  setNewLoomNumber('1');
                  setNewLoomBreak('Right Break');
                }} 
                className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm"
              >
                {language === 'ta' ? 'ரத்து' : 'Cancel'}
              </button>
              <button 
                onClick={handleAssignOrder} 
                className={`flex-1 py-4 ${buttonColor} text-white rounded-2xl font-bold text-sm shadow-lg shadow-zinc-200`}
              >
                {language === 'ta' ? 'மாற்று' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreatingOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-gray-800 mb-6 text-xl tamil-font">{language === 'ta' ? 'புதிய வார்ப்பு ஆர்டர்' : 'New Warp Order'}</h3>
            
            <div className="space-y-4 mb-6">
              <input 
                type="text" 
                placeholder={language === 'ta' ? 'டிசைன் பெயர்' : 'Design Name'}
                value={orderDesignName}
                onChange={e => setOrderDesignName(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
              />
              
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-500 mb-3">{language === 'ta' ? 'வார்ப்பு அமைப்பு' : 'Warp Structure'}</p>
                <div className="space-y-2">
                  {orderSections.map((section, index) => (
                    <div key={index} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-gray-100 flex-wrap sm:flex-nowrap">
                      <select 
                        value={section.denier || ''}
                        onChange={e => handleOrderSectionChange(index, 'denier', e.target.value)}
                        className="w-full sm:w-24 flex-none p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-zinc-400 font-bold"
                      >
                        <option value="">{language === 'ta' ? 'டீனியர்' : 'Denier'}</option>
                        {YARN_TYPES.map((type, idx) => (
                          <option key={`denier-${idx}`} value={type}>{type}</option>
                        ))}
                      </select>
                      
                      {section.denier && (
                        <select 
                          value={section.name}
                          onChange={e => handleOrderSectionChange(index, 'name', e.target.value)}
                          className="w-full sm:w-24 flex-none p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-zinc-400 font-bold"
                        >
                          <option value="">{language === 'ta' ? 'பகுதி' : 'Section'}</option>
                          <option value={language === 'ta' ? 'உடல்' : 'Body'}>{language === 'ta' ? 'உடல்' : 'Body'}</option>
                          <option value={language === 'ta' ? 'ரைட் பார்டர்' : 'Right Border'}>{language === 'ta' ? 'ரைட் பார்டர்' : 'Right Border'}</option>
                          <option value={language === 'ta' ? 'லெப்ட் பார்டர்' : 'Left Border'}>{language === 'ta' ? 'லெப்ட் பார்டர்' : 'Left Border'}</option>
                          <option value={language === 'ta' ? 'பிளைன் வார்ப்பு' : 'Plain Warp'}>{language === 'ta' ? 'பிளைன் வார்ப்பு' : 'Plain Warp'}</option>
                        </select>
                      )}

                      {section.denier && section.name && (
                        <>
                          <input 
                            type="number" 
                            placeholder={language === 'ta' ? 'இழை' : 'Ends'}
                            value={section.ends || ''}
                            onChange={e => handleOrderSectionChange(index, 'ends', parseInt(e.target.value) || 0)}
                            className="w-16 flex-none p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-zinc-400 font-bold"
                          />
                          <select 
                            value={section.color || ''}
                            onChange={e => handleOrderSectionChange(index, 'color', e.target.value)}
                            className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-zinc-400 font-bold"
                          >
                            <option value="">{language === 'ta' ? 'கலர்' : 'Color'}</option>
                            {YARN_COLORS.map((color, idx) => (
                              <option key={`color-${idx}`} value={color}>{color}</option>
                            ))}
                          </select>
                        </>
                      )}
                      
                      {orderSections.length > 1 && (
                        <button onClick={() => removeOrderSection(index)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button 
                    onClick={addOrderSection}
                    className="w-full py-2 mt-2 border border-dashed border-zinc-300 text-zinc-600 rounded-lg text-xs font-bold hover:bg-zinc-50 transition"
                  >
                    + {language === 'ta' ? 'மேலும் சேர்க்க' : 'Add More'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="number" 
                  placeholder={language === 'ta' ? 'மொத்த சேலை' : 'Total Sarees'}
                  value={orderTotalSarees}
                  onChange={e => setOrderTotalSarees(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                />
                <input 
                  type="number" 
                  placeholder={language === 'ta' ? 'வார்ப்பு (மீட்டர்)' : 'Warp Length (m)'}
                  value={orderWarpLength}
                  onChange={e => setOrderWarpLength(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                />
              </div>
              
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-800 mb-1">
                  {language === 'ta' ? 'கணக்கிடப்பட்ட எடை (Kg)' : 'Calculated Weight (Kg)'}
                </p>
                <p className="text-2xl font-black text-emerald-900">
                  {calculatedOrderWeight}
                </p>
              </div>
              
              <input 
                type="number" 
                placeholder={language === 'ta' ? 'மொத்த நூல் எடை (kg)' : 'Total Yarn Weight (kg)'}
                value={orderTotalWeight || calculatedOrderWeight}
                onChange={e => setOrderWarpWeight(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
              />
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setIsCreatingOrder(false)} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm">
                {language === 'ta' ? 'ரத்து' : 'Cancel'}
              </button>
              <button onClick={handleCreateOrder} className={`flex-1 py-4 ${buttonColor} text-white rounded-2xl font-bold text-sm shadow-lg shadow-zinc-200`}>
                {language === 'ta' ? 'உருவாக்கு' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingReturn && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-gray-800 mb-6 text-xl tamil-font">{language === 'ta' ? 'வரவு' : 'Return'}</h3>
            <div className="space-y-4 mb-6">
              <input 
                type="text" 
                placeholder={language === 'ta' ? 'ஆர்டர் ஐடி' : 'Order ID'}
                value={returnOrderId}
                onChange={e => {
                  const val = e.target.value;
                  setReturnOrderId(val);
                  const order = warpOrders.find(o => o.id === val || o.orderNumber === val);
                  if (order) {
                    setReturnDesignName(order.designName || '');
                    setReturnEnds(order.totalEnds.toString());
                    setReturnLength(order.warpLengthMeters?.toString() || '1000');
                    if (order.weaverId && order.weaverId !== 'STOCK') {
                      setReturnWeaverId(order.weaverId);
                    }
                    if (order.warpYarnType) {
                      setReturnDenier(order.warpYarnType);
                    }
                  }
                }}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-emerald-400 font-bold"
              />
              <input 
                type="text" 
                placeholder={language === 'ta' ? 'டிசைன் பெயர்' : 'Design Name'}
                value={returnDesignName}
                onChange={e => setReturnDesignName(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-emerald-400 font-bold"
              />
              <select 
                value={returnDenier}
                onChange={e => setReturnDenier(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-emerald-400 font-bold"
              >
                <option value="">{language === 'ta' ? '-- டீனியர் --' : '-- Denier --'}</option>
                {denierFormulas.map(f => (
                  <option key={f.id} value={f.denier}>{f.denier}</option>
                ))}
              </select>
              <select 
                value={returnWeaverId}
                onChange={e => {
                  if (e.target.value === 'ADD_NEW') {
                    const name = window.prompt(language === 'ta' ? 'புதிய தறிகாரர் பெயர்:' : 'New Weaver Name:');
                    if (name) {
                      const timestamp = Date.now();
                      const newWeaver: Weaver = { id: timestamp.toString(), name, createdAt: timestamp };
                      const updated = [...weavers, newWeaver];
                      setWeavers(updated);
                      localStorage.setItem(`viyabaari_weavers_${user.uid || 'guest'}`, JSON.stringify(updated));
                      syncColumnToSupabase(user.uid, 'weavers', updated);
                      setReturnWeaverId(newWeaver.id);
                    }
                  } else {
                    setReturnWeaverId(e.target.value);
                  }
                }}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-emerald-400 font-bold"
              >
                <option value="">{language === 'ta' ? '-- தறிகாரர் --' : '-- Weaver --'}</option>
                {weavers.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
                <option value="ADD_NEW" className="text-zinc-600 font-black">+ {language === 'ta' ? 'புதிய தறிகாரர்' : 'Add New Weaver'}</option>
              </select>
              <div className="grid grid-cols-3 gap-3">
                <input 
                  type="number" 
                  placeholder={language === 'ta' ? 'இழை (Ends)' : 'Ends'}
                  value={returnEnds}
                  onChange={e => setReturnEnds(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-emerald-400 font-bold"
                />
                <input 
                  type="number" 
                  placeholder={language === 'ta' ? 'நீளம் (m)' : 'Length (m)'}
                  value={returnLength}
                  onChange={e => setReturnLength(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-emerald-400 font-bold"
                />
                <input 
                  type="number" 
                  step="0.01"
                  placeholder={language === 'ta' ? 'எடை (Kg)' : 'Weight (Kg)'}
                  value={returnWeight}
                  onChange={e => setReturnWeight(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-emerald-400 font-bold"
                />
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-800 mb-1">
                  {language === 'ta' ? 'கணக்கிடப்பட்ட எடை (Kg)' : 'Calculated Weight (Kg)'}
                </p>
                <p className="text-2xl font-black text-emerald-900">
                  {calculatedReturnWeight}
                </p>
              </div>
              <p className="text-[10px] text-gray-400 text-center">
                {language === 'ta' ? 'இழை கொடுத்தால் எடை தானாக கணக்கிடப்படும் (ஃபார்முலா இருந்தால்)' : 'Weight auto-calculated from ends if formula exists'}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsAddingReturn(false)} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm">
                {language === 'ta' ? 'ரத்து' : 'Cancel'}
              </button>
              <button onClick={handleAddReturn} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200">
                {language === 'ta' ? 'சேமி' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingDetail && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-gray-800 text-xl tamil-font">
                {viewingDetail.type === 'dispatch' ? (language === 'ta' ? 'நூல் வரவு விவரம்' : 'Yarn Given Details') : 
                 viewingDetail.type === 'order' ? (language === 'ta' ? 'வார்ப்பு ஆர்டர் விவரம்' : 'Warp Order Details') :
                 (language === 'ta' ? 'வரவு விவரம்' : 'Return Details')}
              </h3>
              <button 
                onClick={() => setViewingDetail(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <Plus size={24} className="rotate-45 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {viewingDetail.type === 'dispatch' && (
                <>
                  <DetailItem label={language === 'ta' ? 'தேதி' : 'Date'} value={new Date(viewingDetail.data.date).toLocaleDateString()} />
                  <DetailItem label={language === 'ta' ? 'நூல் வகை' : 'Yarn Type'} value={viewingDetail.data.yarnType} />
                  {viewingDetail.data.colors ? (
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-gray-500 mb-2">{language === 'ta' ? 'கலர்கள்' : 'Colors'}</p>
                      {Object.entries(viewingDetail.data.colors).map(([c, w]) => (
                        <div key={c} className="flex justify-between items-center">
                          <span className="font-bold text-gray-700">{c}</span>
                          <span className="font-black text-blue-600">{(w as number[]).reduce((a, b) => a + b, 0).toFixed(2)} kg</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <DetailItem label={language === 'ta' ? 'கலர்' : 'Color'} value={viewingDetail.data.color} />
                      <DetailItem label={language === 'ta' ? 'எடை (kg)' : 'Weight (kg)'} value={viewingDetail.data.weightKg.toFixed(2)} />
                    </>
                  )}
                  <DetailItem label={language === 'ta' ? 'சப்ளையர்' : 'Supplier'} value={suppliers.find(s => s.id === viewingDetail.data.supplierId)?.name || '-'} />
                  <DetailItem label={language === 'ta' ? 'பில் எண்' : 'Bill No'} value={viewingDetail.data.billNumber || '-'} />
                </>
              )}

              {viewingDetail.type === 'order' && (
                <>
                  <DetailItem label={language === 'ta' ? 'ஆர்டர் எண்' : 'Order No'} value={viewingDetail.data.orderNumber} />
                  <DetailItem label={language === 'ta' ? 'தேதி' : 'Date'} value={new Date(viewingDetail.data.date).toLocaleDateString()} />
                  <DetailItem label={language === 'ta' ? 'டிசைன்' : 'Design'} value={viewingDetail.data.designName} />
                  <DetailItem label={language === 'ta' ? 'மொத்த இழை' : 'Total Ends'} value={viewingDetail.data.totalEnds} />
                  <DetailItem label={language === 'ta' ? 'மொத்த நீளம்' : 'Total Length'} value={viewingDetail.data.totalLength} />
                  <DetailItem label={language === 'ta' ? 'எதிர்பார்க்கும் சேலைகள்' : 'Expected Sarees'} value={viewingDetail.data.totalSareesExpected} />
                  <DetailItem label={language === 'ta' ? 'தறிகாரர்' : 'Weaver'} value={viewingDetail.data.weaverName} />
                  <DetailItem label={language === 'ta' ? 'தறி எண்' : 'Loom No'} value={viewingDetail.data.loomNumber} />
                  
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      {language === 'ta' ? 'பிரிவுகள்' : 'Sections'}
                    </p>
                    <div className="space-y-2">
                      {viewingDetail.data.sections.map((s: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded-lg">
                          <span className="font-medium">{s.denier ? `${s.denier} - ` : ''}{s.name} ({s.color})</span>
                          <span className="font-bold">{s.ends} {language === 'ta' ? 'இழை' : 'Ends'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {viewingDetail.type === 'return' && (
                <>
                  <DetailItem label={language === 'ta' ? 'தேதி' : 'Date'} value={new Date(viewingDetail.data.date).toLocaleDateString()} />
                  <DetailItem label={language === 'ta' ? 'நூல் வகை' : 'Yarn Type'} value={viewingDetail.data.yarnType} />
                  {viewingDetail.data.colors ? (
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-gray-500 mb-2">{language === 'ta' ? 'கலர்கள்' : 'Colors'}</p>
                      {Object.entries(viewingDetail.data.colors).map(([c, w]) => (
                        <div key={c} className="flex justify-between items-center">
                          <span className="font-bold text-gray-700">{c}</span>
                          <span className="font-black text-emerald-600">{(w as number[]).reduce((a, b) => a + b, 0).toFixed(2)} kg</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <DetailItem label={language === 'ta' ? 'கலர்' : 'Color'} value={viewingDetail.data.color} />
                      <DetailItem label={language === 'ta' ? 'எடை (kg)' : 'Weight (kg)'} value={viewingDetail.data.weightKg.toFixed(2)} />
                    </>
                  )}
                  <DetailItem label={language === 'ta' ? 'தறிகாரர்' : 'Weaver'} value={viewingDetail.data.weaverName || '-'} />
                  <DetailItem label={language === 'ta' ? 'இழை' : 'Ends'} value={viewingDetail.data.endsTotal ? viewingDetail.data.endsTotal.toString() : (viewingDetail.data.ends || '-')} />
                  <DetailItem label={language === 'ta' ? 'நீளம்' : 'Length'} value={viewingDetail.data.length || '-'} />
                </>
              )}
            </div>

            <button 
              onClick={() => setViewingDetail(null)}
              className="w-full mt-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition"
            >
              {language === 'ta' ? 'மூடு' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {isAddingDispatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-gray-800 mb-6 text-xl tamil-font">{language === 'ta' ? 'நூல் வரவு' : 'Yarn Given'}</h3>
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="date" 
                  value={dispatchDate}
                  onChange={e => setDispatchDate(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                />
                <select 
                  value={dispatchDenier}
                  onChange={e => setDispatchDenier(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                >
                  <option value="">{language === 'ta' ? '-- டீனியர் --' : '-- Denier --'}</option>
                  {denierFormulas.map(f => (
                    <option key={f.id} value={f.denier}>{f.denier}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {isAddingNewSupplier ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={language === 'ta' ? 'சப்ளையர் பெயர்' : 'Supplier Name'}
                      value={newSupplierName}
                      onChange={e => setNewSupplierName(e.target.value)}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (newSupplierName.trim()) {
                          const timestamp = Date.now();
                          const newSupplier: Supplier = { id: timestamp.toString(), name: newSupplierName.trim(), createdAt: timestamp };
                          const updated = [...suppliers, newSupplier];
                          setSuppliers(updated);
                          localStorage.setItem(`viyabaari_suppliers_${user.uid || 'guest'}`, JSON.stringify(updated));
                          syncColumnToSupabase(user.uid, 'suppliers', updated);
                          setDispatchSupplierId(newSupplier.id);
                          setIsAddingNewSupplier(false);
                          setNewSupplierName('');
                        } else {
                          setIsAddingNewSupplier(false);
                        }
                      }}
                      className="px-4 bg-zinc-800 text-white rounded-2xl font-bold"
                    >
                      {language === 'ta' ? 'சேர்' : 'Add'}
                    </button>
                  </div>
                ) : (
                  <select 
                    value={dispatchSupplierId}
                    onChange={e => {
                      if (e.target.value === 'ADD_NEW') {
                        setIsAddingNewSupplier(true);
                      } else {
                        setDispatchSupplierId(e.target.value);
                      }
                    }}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                  >
                    <option value="">{language === 'ta' ? '-- சப்ளையர் --' : '-- Supplier --'}</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    <option value="ADD_NEW" className="text-zinc-600 font-black">+ {language === 'ta' ? 'புதிய சப்ளையர்' : 'Add New Supplier'}</option>
                  </select>
                )}
                <input 
                  type="text" 
                  placeholder={language === 'ta' ? 'பில் நம்பர்' : 'Bill Number'}
                  value={dispatchBillNumber}
                  onChange={e => setDispatchBillNumber(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-zinc-400 font-bold"
                />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">{language === 'ta' ? 'நூல் விவரங்கள்' : 'Yarn Details'}</h4>
                  <button 
                    onClick={addDispatchItem}
                    className="p-2 bg-zinc-50 text-zinc-600 rounded-lg hover:bg-zinc-100 transition flex items-center gap-1 text-xs font-bold"
                  >
                    <Plus size={14} /> {language === 'ta' ? 'சேர்' : 'Add'}
                  </button>
                </div>
                
                <div className="space-y-3">
                  {dispatchItems.map((item) => (
                    <div key={item.id} className="flex gap-2 items-start animate-in slide-in-from-top-2 duration-200">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <select 
                          value={item.color}
                          onChange={e => updateDispatchItem(item.id, 'color', e.target.value)}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-zinc-400 font-bold"
                        >
                          <option value="">{language === 'ta' ? '-- கலர் --' : '-- Color --'}</option>
                          {YARN_COLORS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder={language === 'ta' ? 'எடை (Kg)' : 'Weight (Kg)'}
                          value={item.weight}
                          onChange={e => updateDispatchItem(item.id, 'weight', e.target.value)}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-zinc-400 font-bold"
                        />
                      </div>
                      {dispatchItems.length > 1 && (
                        <button 
                          onClick={() => removeDispatchItem(item.id)}
                          className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsAddingDispatch(false)} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm">
                {language === 'ta' ? 'ரத்து' : 'Cancel'}
              </button>
              <button onClick={handleAddDispatch} className={`flex-1 py-4 ${buttonColor} text-white rounded-2xl font-bold text-sm shadow-lg shadow-zinc-200`}>
                {language === 'ta' ? 'சேமி' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isManagingFormulas && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-gray-800 mb-6 text-xl tamil-font">{language === 'ta' ? 'டீனியர் ஃபார்முலா' : 'Denier Formulas'}</h3>
            
            <div className="space-y-3 mb-6">
              {denierFormulas.map(f => (
                <div key={f.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div>
                    <p className="font-bold text-gray-800">{f.denier}</p>
                    <p className="text-xs text-gray-500">1 {language === 'ta' ? 'இழை' : 'End'} = {f.gramsPerEnd ? `${f.gramsPerEnd} g` : `${f.multiplier} kg`}</p>
                  </div>
                  <button 
                    onClick={() => saveFormulas(denierFormulas.filter(df => df.id !== f.id))}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {denierFormulas.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-4">{language === 'ta' ? 'ஃபார்முலா எதுவும் இல்லை' : 'No formulas added'}</p>
              )}
            </div>

            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 mb-6">
              <h4 className="text-xs font-bold text-zinc-800 mb-3">{language === 'ta' ? 'புதிய ஃபார்முலா சேர்' : 'Add New Formula'}</h4>
              <div className="space-y-3">
                <select
                  value={isCustomDenier ? 'other' : (YARN_TYPES.includes(newFormulaDenier) ? newFormulaDenier : (newFormulaDenier ? 'other' : ''))}
                  onChange={e => {
                    if (e.target.value === 'other') {
                      setIsCustomDenier(true);
                      setNewFormulaDenier('');
                    } else {
                      setIsCustomDenier(false);
                      setNewFormulaDenier(e.target.value);
                    }
                  }}
                  className="w-full p-3 bg-white border border-zinc-100 rounded-xl text-sm outline-none focus:border-zinc-400 font-medium"
                >
                  <option value="">{language === 'ta' ? '-- டீனியர் தேர்ந்தெடுக்கவும் --' : '-- Select Denier --'}</option>
                  {YARN_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                  <option value="other">{language === 'ta' ? 'மற்றவை (Type Custom)' : 'Other (Type Custom)'}</option>
                </select>
                
                {isCustomDenier && (
                  <input 
                    type="text" 
                    placeholder={language === 'ta' ? 'டீனியர் பெயர் (உ.ம்: 50 Denier)' : 'Denier Name (e.g., 50 Denier)'}
                    value={newFormulaDenier}
                    onChange={e => setNewFormulaDenier(e.target.value)}
                    className="w-full p-3 bg-white border border-zinc-100 rounded-xl text-sm outline-none focus:border-zinc-400 animate-in fade-in slide-in-from-top-2"
                  />
                )}
                <input 
                  type="number" 
                  step="0.000001"
                  placeholder={language === 'ta' ? '1 இழைக்கு எத்தனை கிராம்?' : 'Grams per 1 End?'}
                  value={newFormulaMultiplier}
                  onChange={e => setNewFormulaMultiplier(e.target.value)}
                  className="w-full p-3 bg-white border border-zinc-100 rounded-xl text-sm outline-none focus:border-zinc-400"
                />
                <button 
                  onClick={handleAddFormula}
                  className={`w-full py-3 ${buttonColor} text-white rounded-xl font-bold text-sm shadow-md`}
                >
                  {language === 'ta' ? 'சேர்' : 'Add'}
                </button>
              </div>
            </div>

            <button onClick={() => setIsManagingFormulas(false)} className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm">
              {language === 'ta' ? 'மூடு' : 'Close'}
            </button>
          </div>
        </div>
      )}

      </div>
    );
  }

  // Render Warpers List View
  return (
    <div className="p-4 pb-24 md:pb-4 md:max-w-none mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      {viewType !== 'all-warps' && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black tamil-font text-gray-800">
              {language === 'ta' ? 'வார்ப்பு கணக்குகள்' : 'Warp Accounts'}
            </h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewType('all-warps')}
              className="bg-zinc-100 text-zinc-600 px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm transition"
            >
              <FileText size={14} /> {language === 'ta' ? 'அனைத்து வார்ப்புகள்' : 'All Warps'}
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              className={`${buttonColor} text-white px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1 shadow-md transition`}
            >
              <Plus size={14} /> {language === 'ta' ? 'புதிய கடையை சேர்+' : 'Add New Shop+'}
            </button>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-5 rounded-3xl shadow-lg border border-zinc-100 mb-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-black text-gray-800 mb-4 tamil-font text-lg">{language === 'ta' ? 'புதிய கடை' : 'New Shop'}</h3>
          <input 
            type="text" 
            placeholder={language === 'ta' ? 'பெயர்' : 'Name'}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-2xl mb-3 outline-none border border-gray-200 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition font-medium"
          />
          <input 
            type="text" 
            placeholder={language === 'ta' ? 'போன் நம்பர் (விருப்பப்பட்டால்)' : 'Phone (Optional)'}
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-2xl mb-5 outline-none border border-gray-200 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition font-medium"
          />
          <div className="flex gap-3">
            <button onClick={handleAdd} className={`flex-1 ${buttonColor} text-white py-3.5 rounded-2xl font-black shadow-md shadow-zinc-200 hover:shadow-lg transition`}>
              {language === 'ta' ? 'சேமி' : 'Save'}
            </button>
            <button onClick={() => setIsAdding(false)} className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-black hover:bg-gray-200 transition">
              {language === 'ta' ? 'ரத்து' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {warpers.length === 0 && !isAdding ? (
        <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
          <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon size={32} className="text-zinc-300" />
          </div>
          <p className="text-gray-500 font-bold tamil-font text-lg">
            {language === 'ta' ? 'கடைகள் யாரும் இல்லை' : 'No shops added yet'}
          </p>
          <p className="text-gray-400 text-sm mt-2 max-w-[200px] mx-auto">
            {language === 'ta' ? 'மேலே உள்ள பட்டனை தட்டி கடையை சேர்க்கவும்' : 'Tap the button above to add a new shop'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {warpers.map((warper, index) => {
            const WARPER_COLORS = [
              'bg-blue-600 hover:bg-blue-700',
              'bg-emerald-600 hover:bg-emerald-700',
              'bg-purple-600 hover:bg-purple-700',
              'bg-amber-600 hover:bg-amber-700',
              'bg-rose-600 hover:bg-rose-700',
              'bg-cyan-600 hover:bg-cyan-700',
              'bg-indigo-600 hover:bg-indigo-700',
              'bg-teal-600 hover:bg-teal-700',
            ];
            const colorClass = WARPER_COLORS[index % WARPER_COLORS.length];
            return (
            <div 
              key={warper.id} 
              onClick={() => { setSelectedWarper(warper); setLedgerPage(1); setStatementPage(1); }}
              className={`${colorClass} p-4 rounded-2xl shadow-sm flex items-center justify-between transition cursor-pointer`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center font-black text-xl shadow-inner">
                  {warper.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-black text-white text-lg">{warper.name}</h4>
                  {warper.phone && <p className="text-xs font-bold text-white/80 mt-0.5">{warper.phone}</p>}
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(warper.id); }} 
                className="p-2.5 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )})}
        </div>
      )}
      {isScanning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <p className="text-lg font-bold">{scanStatus}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warpers;
