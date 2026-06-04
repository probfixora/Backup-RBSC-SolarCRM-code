import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AddInventoryItemModal from '../components/AddInventoryItemModal';
import B2BDispatchModal from '../components/B2BDispatchModal';
import toast from 'react-hot-toast';
import {
  Package, TrendingDown, TrendingUp, AlertTriangle,
  Plus, Minus, History, ClipboardList, BarChart3,
  RefreshCw, Search, CheckCircle, Edit, Eye, Folder,
  DollarSign, Briefcase, Truck, Building, X
} from 'lucide-react';

const LOW_STOCK_THRESHOLD = 0.3;

const tabStyle = (active) => ({
  padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none',
  cursor: 'pointer', fontWeight: active ? 700 : 500, fontSize: 13,
  background: active ? 'var(--color-primary)' : 'var(--surface-2)',
  color: active ? '#fff' : 'var(--text-2)', transition: 'all 0.2s ease',
});

const cardStyle = {
  background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--shadow-sm)',
};

export default function ProcurementPortal({ onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showB2BModal, setShowB2BModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'
  
  // Stock Adjustment States
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [adjustType, setAdjustType] = useState('add'); // 'add' | 'deduct'
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustSaving, setAdjustSaving] = useState(false);

  const userRole = localStorage.getItem('role') || 'admin';
  const userName = localStorage.getItem('name') || 'Admin';

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setModalMode('view');
    setShowAddModal(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setModalMode('edit');
    setShowAddModal(true);
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    if (!adjustingItem || !adjustQty || Number(adjustQty) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    setAdjustSaving(true);
    try {
      const qty = Number(adjustQty);
      const isAdd = adjustType === 'add';
      const change = isAdd ? qty : -qty;
      const newStock = adjustingItem.stock + change;

      if (newStock < 0) {
        throw new Error('Stock quantity cannot be less than 0');
      }

      // Update database
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ stock: newStock })
        .eq('id', adjustingItem.id);

      if (updateError) throw updateError;

      // Log transaction
      const { error: txError } = await supabase
        .from('inventory_transactions')
        .insert({
          inventory_id: adjustingItem.id,
          inventory_name: adjustingItem.name,
          transaction_type: isAdd ? 'stock_in' : 'stock_out',
          quantity: change,
          stock_before: adjustingItem.stock,
          stock_after: newStock,
          notes: adjustNotes || (isAdd ? 'Manual Stock Addition' : 'Manual Stock Deduction'),
          created_by: userName
        });

      if (txError) throw txError;

      toast.success(`Stock ${isAdd ? 'added' : 'deducted'} successfully!`);
      setAdjustingItem(null);
      setAdjustQty('');
      setAdjustNotes('');
      fetchInventory();
      fetchTransactions();
    } catch (err) {
      toast.error('Adjustment failed: ' + err.message);
    } finally {
      setAdjustSaving(false);
    }
  };

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setInventory(data || []);
    } catch (err) {
      toast.error('Failed to load inventory: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setTransactions(data || []);
    } catch {
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);
  useEffect(() => {
    if (tab === 'history') fetchTransactions();
  }, [tab, fetchTransactions]);

  const getPct = (item) => {
    if (!item.initial_stock || item.initial_stock === 0) return 100;
    return Math.min(100, Math.round((item.stock / item.initial_stock) * 100));
  };

  const isLow = (item) => {
    if (item.low_stock_threshold) return item.stock <= item.low_stock_threshold;
    return getPct(item) <= LOW_STOCK_THRESHOLD * 100;
  };

  const isOut = (item) => item.stock === 0;

  const filtered = inventory.filter(item =>
    item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.toLowerCase().includes(search.toLowerCase()) ||
    item.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = inventory.filter(i => isLow(i) && !isOut(i));
  const outOfStockItems = inventory.filter(isOut);
  
  const totalItems = inventory.length;
  const totalStockValue = inventory.reduce((s, i) => s + (i.stock * (i.unit_price || i.purchase_price || 0)), 0);
  
  // Calculate dispatches from transactions
  const b2bDispatches = transactions.filter(t => t.dispatch_type === 'b2b').length;
  const b2cDispatches = transactions.filter(t => t.dispatch_type === 'b2c' || (!t.dispatch_type && t.transaction_type === 'stock_out')).length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
      <Sidebar onLogout={onLogout} />
      <main style={{ flex: 1, marginLeft: 'var(--main-offset)', padding: '28px 32px', boxSizing: 'border-box', maxWidth: '1400px', overflowX: 'hidden' }}>
        <Header title="Procurement & Master Inventory" subtitle="Overarching stock control and B2B/B2C dispatch management" onLogout={onLogout} />

        {/* Low Stock Alert Banner */}
        {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
          <div style={{
            background: outOfStockItems.length > 0 ? '#fef2f2' : '#fef3c7',
            border: `1px solid ${outOfStockItems.length > 0 ? '#fecaca' : '#fcd34d'}`,
            borderRadius: 'var(--radius-lg)', padding: '14px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <AlertTriangle style={{ color: outOfStockItems.length > 0 ? '#dc2626' : '#b45309', flexShrink: 0 }} size={20} />
            <div>
              <p style={{ fontWeight: 700, color: outOfStockItems.length > 0 ? '#991b1b' : '#92400e', fontSize: 14 }}>
                ⚠ Warning: {outOfStockItems.length > 0 ? `${outOfStockItems.length} items OUT OF STOCK. ` : ''}
                {lowStockItems.length > 0 ? `${lowStockItems.length} items below minimum safety threshold.` : ''}
              </p>
              <p style={{ color: outOfStockItems.length > 0 ? '#dc2626' : '#b45309', fontSize: 12, marginTop: 2 }}>
                Please restock these items to avoid project delays.
              </p>
            </div>
          </div>
        )}

        {/* Top Cards Dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Items', value: totalItems, icon: Package, color: '#2563EB' },
            { label: 'Stock Value', value: `₹${totalStockValue.toLocaleString()}`, icon: DollarSign, color: '#10b981' },
            { label: 'Low Stock', value: lowStockItems.length, icon: TrendingDown, color: '#f59e0b' },
            { label: 'Out of Stock', value: outOfStockItems.length, icon: AlertTriangle, color: '#ef4444' },
            { label: 'B2C Dispatches', value: b2cDispatches, icon: Truck, color: '#8b5cf6' },
            { label: 'B2B Dispatches', value: b2bDispatches, icon: Building, color: '#0ea5e9' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ ...cardStyle, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>{value}</p>
                <p style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={tabStyle(tab === 'dashboard')} onClick={() => setTab('dashboard')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={14} /> Inventory Table</span>
            </button>
            <button style={tabStyle(tab === 'history')} onClick={() => setTab('history')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><History size={14} /> Transaction History</span>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setShowB2BModal(true)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--surface-2)', border: '1px solid var(--border-color)', color: 'var(--text-1)' }}>
              <Building size={16} /> B2B Dispatch
            </button>
            <button onClick={() => { setModalMode('create'); setSelectedItem(null); setShowAddModal(true); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px' }}>
              <Plus size={16} /> Add New Item
            </button>
          </div>
        </div>

        {/* Tab: Dashboard (Table) */}
        {tab === 'dashboard' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Inventory Catalog</h3>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} size={14} />
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, SKU, category..."
                    className="input" style={{ paddingLeft: 32, width: 280, fontSize: 13 }}
                  />
                </div>
                <button onClick={fetchInventory} className="btn btn-ghost btn-sm" title="Refresh">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="animate-spin" style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-4)', fontSize: 13 }}>Loading inventory…</p>
              </div>
            ) : (
              <>
              <div className="table-wrap hide-on-mobile" style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: 1200 }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category / Brand</th>
                      <th>SKU / Model</th>
                      <th>Capacity</th>
                      <th>Available</th>
                      <th>Reserved</th>
                      <th>Safety / WH</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(item => {
                      const low = isLow(item);
                      const out = isOut(item);
                      return (
                        <tr key={item.id} style={{ background: out ? '#fef2f2' : low ? '#fffbeb' : 'transparent' }}>
                          <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>{item.name}</td>
                          <td>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{item.category}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{item.brand || 'N/A'}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: 12, fontFamily: 'monospace', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>{item.sku || 'N/A'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>{item.model_number || 'N/A'}</div>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.capacity || '—'}</td>
                          <td style={{ fontWeight: 700, color: out ? '#ef4444' : low ? '#f59e0b' : '#10b981', fontSize: 14 }}>
                            {item.stock} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)' }}>{item.unit}</span>
                          </td>
                          <td style={{ fontWeight: 600, color: '#8b5cf6', fontSize: 13 }}>{item.reserved_quantity || 0}</td>
                          <td>
                            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Min: {item.low_stock_threshold || 0}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>WH: {item.warehouse_location || '—'}</div>
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                              background: out ? '#fecaca' : low ? '#fde68a' : '#d1fae5',
                              color: out ? '#991b1b' : low ? '#92400e' : '#065f46'
                            }}>
                              {out ? 'Out of Stock' : low ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button onClick={() => handleViewItem(item)} className="btn btn-ghost btn-sm" title="View"><Eye size={14} /></button>
                              <button onClick={() => handleEditItem(item)} className="btn btn-ghost btn-sm" title="Edit"><Edit size={14} /></button>
                              <button onClick={() => { setAdjustingItem(item); setAdjustType('add'); }} className="btn btn-ghost btn-sm" style={{ color: '#10b981' }} title="Add Stock"><Plus size={14} /></button>
                              <button onClick={() => { setAdjustingItem(item); setAdjustType('deduct'); }} className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} title="Deduct Stock"><Minus size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-4)' }}>No matching inventory items found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── MOBILE CARDS (Inventory) ── */}
              <div className="mobile-only" style={{ flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {filtered.map(item => {
                  const low = isLow(item);
                  const out = isOut(item);
                  return (
                    <div
                      key={`mob-${item.id}`}
                      style={{
                        background: out ? '#fef2f2' : low ? '#fffbeb' : 'var(--surface)',
                        borderRadius: 'var(--radius-lg)',
                        border: `1px solid ${out ? '#fecaca' : low ? '#fde68a' : 'var(--border)'}`,
                        boxShadow: 'var(--shadow-card)',
                        padding: '16px',
                        display: 'flex', flexDirection: 'column', gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '10px', color: 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase' }}>SKU: {item.sku || 'N/A'}</span>
                          <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '15px' }}>{item.name}</div>
                        </div>
                        <span style={{
                          padding: '4px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                          background: out ? '#fecaca' : low ? '#fde68a' : '#d1fae5',
                          color: out ? '#991b1b' : low ? '#92400e' : '#065f46'
                        }}>
                          {out ? 'Out of Stock' : low ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' }}>{item.category}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{item.brand || 'N/A'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: out ? '#ef4444' : low ? '#f59e0b' : '#10b981', fontSize: '16px' }}>
                            {item.stock} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-4)' }}>{item.unit}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Reserved: {item.reserved_quantity || 0}</div>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-2)', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button onClick={() => handleViewItem(item)} className="btn btn-ghost btn-sm" title="View"><Eye size={14} /></button>
                        <button onClick={() => handleEditItem(item)} className="btn btn-ghost btn-sm" title="Edit"><Edit size={14} /></button>
                        <button onClick={() => { setAdjustingItem(item); setAdjustType('add'); }} className="btn btn-ghost btn-sm" style={{ color: '#10b981' }} title="Add Stock"><Plus size={14} /></button>
                        <button onClick={() => { setAdjustingItem(item); setAdjustType('deduct'); }} className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} title="Deduct Stock"><Minus size={14} /></button>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-4)', padding: '24px 0' }}>No matching inventory items found</p>
                )}
              </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Transaction History */}
        {tab === 'history' && (
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 20 }}>
              <History size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Complete Transaction Log
            </h3>
            {txLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div className="animate-spin" style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', margin: '0 auto 12px' }} />
              </div>
            ) : (
              <>
              <div className="table-wrap hide-on-mobile">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Action</th>
                      <th>Quantity</th>
                      <th>Before → After</th>
                      <th>User</th>
                      <th>Notes / Reference</th>
                      <th>Date &amp; Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const isPos = tx.quantity > 0;
                      const typeColor = tx.transaction_type === 'stock_in' || (tx.transaction_type === 'release') || (tx.transaction_type === 'adjustment' && isPos) ? '#10b981' :
                                        tx.transaction_type === 'reservation' ? '#8b5cf6' : '#ef4444';
                      return (
                        <tr key={tx.id}>
                          <td style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{tx.inventory_name || '—'}</td>
                          <td>
                            <span style={{ padding: '4px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: `${typeColor}15`, color: typeColor }}>
                              {tx.transaction_type?.replace('_', ' ')}
                            </span>
                            {tx.dispatch_type && (
                              <span style={{ marginLeft: 6, padding: '4px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: '#e0e7ff', color: '#4338ca' }}>
                                {tx.dispatch_type}
                              </span>
                            )}
                          </td>
                          <td style={{ fontWeight: 800, color: typeColor, fontSize: 14 }}>{isPos ? '+' : ''}{tx.quantity}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-4)', fontWeight: 600 }}>{tx.stock_before} <span style={{color: 'var(--border)'}}>→</span> {tx.stock_after}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{tx.created_by || '—'}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.notes || tx.case_id || '—'}
                          </td>
                          <td style={{ fontSize: 11, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>
                            {tx.created_at ? new Date(tx.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                    {transactions.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-4)' }}>No transactions found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── MOBILE CARDS (Transactions) ── */}
              <div className="mobile-only" style={{ flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {transactions.map((tx) => {
                  const isPos = tx.quantity > 0;
                  const typeColor = tx.transaction_type === 'stock_in' || (tx.transaction_type === 'release') || (tx.transaction_type === 'adjustment' && isPos) ? '#10b981' :
                                    tx.transaction_type === 'reservation' ? '#8b5cf6' : '#ef4444';
                  return (
                    <div
                      key={`mob-tx-${tx.id}`}
                      style={{
                        background: 'var(--surface)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-card)',
                        padding: '16px',
                        display: 'flex', flexDirection: 'column', gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-1)' }}>{tx.inventory_name || '—'}</div>
                        <div style={{ fontWeight: 800, color: typeColor, fontSize: '15px' }}>{isPos ? '+' : ''}{tx.quantity}</div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ padding: '4px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: `${typeColor}15`, color: typeColor }}>
                            {tx.transaction_type?.replace('_', ' ')}
                          </span>
                          {tx.dispatch_type && (
                            <span style={{ marginLeft: 6, padding: '4px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: '#e0e7ff', color: '#4338ca' }}>
                              {tx.dispatch_type}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-4)', fontWeight: 600 }}>{tx.stock_before} <span style={{color: 'var(--border)'}}>→</span> {tx.stock_after}</div>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-3)', background: 'var(--surface-2)', padding: '8px', borderRadius: '6px', marginTop: '4px' }}>
                        {tx.notes || tx.case_id || '—'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 500 }}><span style={{ color: 'var(--text-4)' }}>By:</span> {tx.created_by || '—'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{tx.created_at ? new Date(tx.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</div>
                      </div>
                    </div>
                  );
                })}
                {transactions.length === 0 && (
                  <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-4)', padding: '24px 0' }}>No transactions found</p>
                )}
              </div>
              </>
            )}
          </div>
        )}

        <Footer />
      </main>

      {/* Add / Edit / View Item Modal */}
      {showAddModal && (
        <AddInventoryItemModal 
          onClose={() => {
            setShowAddModal(false);
            setSelectedItem(null);
          }}
          onAdded={fetchInventory}
          item={selectedItem}
          mode={modalMode}
        />
      )}

      {/* B2B Dispatch Modal */}
      {showB2BModal && (
        <B2BDispatchModal
          onClose={() => setShowB2BModal(false)}
          onSave={() => {
            setShowB2BModal(false);
            fetchInventory();
            fetchTransactions();
          }}
          items={inventory}
        />
      )}

      {/* Stock Adjustment Modal */}
      {adjustingItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '450px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {adjustType === 'add' ? 'Add Stock' : 'Deduct Stock'}
              </h2>
              <button onClick={() => setAdjustingItem(null)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'}}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAdjustmentSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#475569' }}>
                  Item: <strong style={{ color: '#0f172a' }}>{adjustingItem.name}</strong>
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Current Stock: <strong>{adjustingItem.stock} {adjustingItem.unit}</strong>
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Quantity to {adjustType === 'add' ? 'Add' : 'Deduct'} *
                </label>
                <input 
                  type="number"
                  required
                  min="1"
                  value={adjustQty}
                  onChange={e => setAdjustQty(e.target.value)}
                  placeholder={`e.g. 10`}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', background: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Notes / Reference
                </label>
                <textarea 
                  value={adjustNotes}
                  onChange={e => setAdjustNotes(e.target.value)}
                  placeholder={adjustType === 'add' ? 'e.g. Received new shipment' : 'e.g. Broken or misplaced stock'}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', background: '#fff',
                    boxSizing: 'border-box', minHeight: '60px', resize: 'vertical'
                  }}
                />
              </div>

              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px'
              }}>
                <button type="button" onClick={() => setAdjustingItem(null)} style={{
                  padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer'
                }} disabled={adjustSaving}>Cancel</button>
                <button type="submit" style={{
                  padding: '10px 24px', borderRadius: '8px', border: 'none',
                  background: adjustType === 'add' ? '#10b981' : '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer'
                }} disabled={adjustSaving}>
                  {adjustSaving ? 'Saving...' : adjustType === 'add' ? 'Confirm Addition' : 'Confirm Deduction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
