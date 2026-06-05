import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  Package, TrendingDown, AlertTriangle, DollarSign,
  Building, Truck, ShoppingCart, ClipboardList,
  ArrowRight, RefreshCw, CheckCircle, BarChart3,
  Plus, Box, Users, PieChart, ChevronDown, ChevronUp, X
} from 'lucide-react';

/* ─── Styles ─────────────────────────────────────────────── */
const card = {
  background: 'var(--surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  padding: '20px',
  boxShadow: 'var(--shadow-sm)',
};

const PALETTE = [
  '#2563EB','#10b981','#f59e0b','#8b5cf6','#ef4444',
  '#0ea5e9','#ec4899','#14b8a6','#f97316','#6366f1',
  '#84cc16','#a78bfa',
];

/* ─── SVG Pie Chart (pure, no library) ───────────────────── */
function PieChart2({ slices, size = 160, label }) {
  const [hovered, setHovered] = useState(null);
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return (
    <div style={{ textAlign: 'center', padding: 16 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: '#f1f5f9', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--text-4)' }}>No data</p>
      </div>
    </div>
  );

  let cumAngle = -90;
  const cx = size / 2, cy = size / 2, r = size / 2 - 4;

  const toXY = (angle, radius) => {
    const rad = (angle * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  };

  const paths = slices.map((sl, i) => {
    const deg = (sl.value / total) * 360;
    const startAngle = cumAngle;
    cumAngle += deg;
    const endAngle = cumAngle;
    const large = deg > 180 ? 1 : 0;
    const [x1, y1] = toXY(startAngle, r);
    const [x2, y2] = toXY(endAngle, r);
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    return { d, color: sl.color || PALETTE[i % PALETTE.length], label: sl.label, value: sl.value, pct: Math.round((sl.value / total) * 100) };
  });


  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size} style={{ display: 'block' }}>
          {paths.map((p, i) => (
            <path
              key={i} d={p.d} fill={p.color}
              stroke="#fff" strokeWidth={2}
              style={{ transition: 'opacity 0.2s', opacity: hovered !== null && hovered !== i ? 0.5 : 1, cursor: 'pointer' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* Center hole */}
          <circle cx={cx} cy={cy} r={r * 0.42} fill="var(--surface)" />
          {label && (
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text-2)">{label}</text>
          )}
        </svg>
        {/* Tooltip */}
        {hovered !== null && (
          <div style={{
            position: 'absolute', top: '50%', left: '110%', transform: 'translateY(-50%)',
            background: '#0f172a', color: '#fff', borderRadius: 8, padding: '8px 12px',
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
          }}>
            {paths[hovered].label}: {paths[hovered].value} ({paths[hovered].pct}%)
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 120 }}>
        {paths.map((p, i) => (
          <div key={i} 
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'default', opacity: hovered !== null && hovered !== i ? 0.5 : 1, transition: 'opacity 0.2s' }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{p.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{p.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Item Drill-Down Pie Modal ───────────────────────────── */
function ItemDrillModal({ item, transactions, onClose }) {
  const itemTxns = transactions.filter(t => t.inventory_id === item.id || t.inventory_name === item.name);
  const b2bQty = itemTxns.filter(t => t.dispatch_type === 'b2b').reduce((s, t) => s + Math.abs(t.quantity), 0);
  const b2cQty = itemTxns.filter(t => t.dispatch_type === 'b2c' || (t.transaction_type === 'stock_out' && !t.dispatch_type)).reduce((s, t) => s + Math.abs(t.quantity), 0);
  const stockInQty = itemTxns.filter(t => t.transaction_type === 'stock_in').reduce((s, t) => s + Math.abs(t.quantity), 0);

  const slices = [
    { label: 'B2B Dispatch', value: b2bQty, color: '#8b5cf6' },
    { label: 'B2C Dispatch', value: b2cQty, color: '#0ea5e9' },
    { label: 'Remaining Stock', value: item.stock, color: '#10b981' },
  ].filter(s => s.value > 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>{item.name}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>{item.category} · SKU: {item.sku || 'N/A'}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 6 }}><X size={18} /></button>
        </div>
        <div style={{ padding: 24 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dispatch Breakdown</h4>
          <PieChart2 slices={slices} size={150} label="Stock" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 24 }}>
            {[
              { label: 'Total Received', value: stockInQty, color: '#10b981' },
              { label: 'B2B Dispatched', value: b2bQty, color: '#8b5cf6' },
              { label: 'B2C Dispatched', value: b2cQty, color: '#0ea5e9' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color }}>{value}</p>
                <p style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Recent transactions for this item */}
          {itemTxns.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', marginBottom: 10 }}>Recent Activity</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                {itemTxns.slice(0, 8).map(tx => {
                  const isIn = tx.transaction_type === 'stock_in';
                  const color = isIn ? '#10b981' : tx.dispatch_type === 'b2b' ? '#8b5cf6' : '#0ea5e9';
                  return (
                    <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--surface-2)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{tx.transaction_type?.replace('_', ' ')}</span>
                        {tx.b2b_client_name && <span style={{ fontSize: 11, color: 'var(--text-4)', marginLeft: 6 }}>→ {tx.b2b_client_name}</span>}
                        {tx.notes && !tx.b2b_client_name && <span style={{ fontSize: 11, color: 'var(--text-4)', marginLeft: 6 }}>{tx.notes}</span>}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color }}>{tx.quantity > 0 ? '+' : ''}{tx.quantity}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-4)' }}>{tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-IN') : ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ──────────────────────────────────────── */
export default function ProcurementDashboard({ onLogout }) {
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatchFilter, setDispatchFilter] = useState('all'); // 'all' | 'b2b' | 'b2c'
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const navigate = useNavigate();

  const userName = localStorage.getItem('name') || 'Procurement';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: inv }, { data: txns }] = await Promise.all([
        supabase.from('inventory').select('*').order('name', { ascending: true }),
        supabase.from('inventory_transactions').select('*').order('created_at', { ascending: false }).limit(200),
      ]);
      setInventory(inv || []);
      setTransactions(txns || []);
    } catch (err) {
      toast.error('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Computed stats ── */
  const totalItems = inventory.length;
  const totalValue = inventory.reduce((s, i) => s + (i.stock * (i.unit_price || i.purchase_price || 0)), 0);
  const lowStockItems = inventory.filter(i => i.low_stock_threshold && i.stock <= i.low_stock_threshold && i.stock > 0);
  const outOfStockItems = inventory.filter(i => i.stock === 0);
  const inStockItems = inventory.filter(i => i.stock > 0 && !lowStockItems.includes(i));

  const b2bTxns = transactions.filter(t => t.dispatch_type === 'b2b');
  const b2cTxns = transactions.filter(t => t.dispatch_type === 'b2c' || (t.transaction_type === 'stock_out' && !t.dispatch_type));
  const b2bTotal = b2bTxns.reduce((s, t) => s + Math.abs(t.quantity), 0);
  const b2cTotal = b2cTxns.reduce((s, t) => s + Math.abs(t.quantity), 0);

  /* ── Pie slices: Stock Status ── */
  const stockSlices = [
    { label: 'In Stock', value: inStockItems.length, color: '#10b981' },
    { label: 'Low Stock', value: lowStockItems.length, color: '#f59e0b' },
    { label: 'Out of Stock', value: outOfStockItems.length, color: '#ef4444' },
  ].filter(s => s.value > 0);

  /* ── Pie slices: Dispatch Type ── */
  const dispatchSlices = [
    { label: 'B2B Dispatches', value: b2bTotal, color: '#8b5cf6' },
    { label: 'B2C Dispatches', value: b2cTotal, color: '#0ea5e9' },
  ].filter(s => s.value > 0);

  /* ── Category pie ── */
  const catMap = {};
  inventory.forEach((item, i) => {
    const cat = item.category || 'Other';
    if (!catMap[cat]) catMap[cat] = { count: 0, color: PALETTE[Object.keys(catMap).length % PALETTE.length] };
    catMap[cat].count++;
  });
  const categorySlices = Object.entries(catMap).map(([label, { count, color }]) => ({ label, value: count, color }));

  /* ── B2B Customers group ── */
  const b2bCustomers = {};
  b2bTxns.forEach(tx => {
    const name = tx.b2b_client_name || 'Unknown Client';
    if (!b2bCustomers[name]) b2bCustomers[name] = { txns: [], totalQty: 0 };
    b2bCustomers[name].txns.push(tx);
    b2bCustomers[name].totalQty += Math.abs(tx.quantity);
  });

  /* ── B2C Customers group (from notes / cases) ── */
  const b2cCustomers = {};
  b2cTxns.forEach(tx => {
    const name = tx.notes?.replace('B2C dispatch for ', '').split(' - ')[0] || tx.case_id || 'Residential Customer';
    if (!b2cCustomers[name]) b2cCustomers[name] = { txns: [], totalQty: 0 };
    b2cCustomers[name].txns.push(tx);
    b2cCustomers[name].totalQty += Math.abs(tx.quantity);
  });

  /* ── Filtered customer list for display ── */
  const customerData = dispatchFilter === 'b2b'
    ? Object.entries(b2bCustomers).map(([name, d]) => ({ name, ...d, type: 'B2B' }))
    : dispatchFilter === 'b2c'
    ? Object.entries(b2cCustomers).map(([name, d]) => ({ name, ...d, type: 'B2C' }))
    : [
        ...Object.entries(b2bCustomers).map(([name, d]) => ({ name, ...d, type: 'B2B' })),
        ...Object.entries(b2cCustomers).map(([name, d]) => ({ name, ...d, type: 'B2C' })),
      ].sort((a, b) => b.totalQty - a.totalQty);

  const stats = [
    { label: 'Total Items', value: totalItems, icon: Package, color: '#2563EB', bg: '#eff6ff' },
    { label: 'Stock Value', value: `₹${totalValue.toLocaleString('en-IN')}`, icon: DollarSign, color: '#10b981', bg: '#ecfdf5' },
    { label: 'In Stock', value: inStockItems.length, icon: CheckCircle, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Low Stock', value: lowStockItems.length, icon: TrendingDown, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Out of Stock', value: outOfStockItems.length, icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2' },
    { label: 'B2B Dispatched', value: b2bTotal, icon: Building, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'B2C Dispatched', value: b2cTotal, icon: Truck, color: '#0ea5e9', bg: '#f0f9ff' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
      <Sidebar onLogout={onLogout} />
      <main style={{ flex: 1, marginLeft: 'var(--main-offset)', padding: '28px 32px', boxSizing: 'border-box', maxWidth: '1400px' }}>
        <Header
          title={`Welcome back, ${userName.split(' ')[0]} 👋`}
          subtitle="Procurement Dashboard — Full inventory & dispatch analytics"
          onLogout={onLogout}
        />

        {/* Alert Banner */}
        {!loading && (outOfStockItems.length > 0 || lowStockItems.length > 0) && (
          <div style={{
            background: outOfStockItems.length > 0 ? '#fef2f2' : '#fef3c7',
            border: `1px solid ${outOfStockItems.length > 0 ? '#fecaca' : '#fcd34d'}`,
            borderRadius: 'var(--radius-lg)', padding: '12px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={18} color={outOfStockItems.length > 0 ? '#dc2626' : '#b45309'} />
              <p style={{ fontWeight: 700, color: outOfStockItems.length > 0 ? '#991b1b' : '#92400e', fontSize: 13 }}>
                {outOfStockItems.length > 0 ? `${outOfStockItems.length} items out of stock. ` : ''}
                {lowStockItems.length > 0 ? `${lowStockItems.length} items low on stock.` : ''}
              </p>
            </div>
            <button onClick={() => navigate('/procurement-portal')} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, background: outOfStockItems.length > 0 ? '#dc2626' : '#b45309', color: '#fff', display: 'flex', alignItems: 'center', gap: 5 }}>
              Manage <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} style={{ ...card, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{loading ? '—' : value}</p>
                <p style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.4px' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── PIE CHARTS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>

          {/* Stock Status Pie */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PieChart size={15} color="#10b981" /> Stock Status
            </h3>
            {loading ? <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: '#10b981', borderRadius: '50%' }} /></div>
              : <PieChart2 slices={stockSlices} size={130} label="Items" />}
          </div>

          {/* B2B vs B2C Dispatch Pie */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building size={15} color="#8b5cf6" /> B2B vs B2C Dispatch
            </h3>
            {loading ? <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: '#8b5cf6', borderRadius: '50%' }} /></div>
              : dispatchSlices.length === 0
                ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-4)', fontSize: 13 }}>No dispatches yet</div>
                : <PieChart2 slices={dispatchSlices} size={130} label="Units" />}
          </div>

          {/* Category Pie */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={15} color="#2563EB" /> By Category
            </h3>
            {loading ? <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: '#2563EB', borderRadius: '50%' }} /></div>
              : <PieChart2 slices={categorySlices} size={130} label="Items" />}
          </div>
        </div>

        {/* ── PER-ITEM PIE CHART DRILL DOWN ── */}
        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={15} color="#f59e0b" /> Item-wise Dispatch Breakdown
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', background: 'var(--surface-2)', padding: '3px 8px', borderRadius: 20, marginLeft: 4 }}>
                Click any item to see Pie Chart
              </span>
            </h3>
            <button onClick={fetchData} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)' }}><RefreshCw size={14} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {loading ? (
              <p style={{ color: 'var(--text-4)', fontSize: 13 }}>Loading...</p>
            ) : inventory.map((item, idx) => {
              const itemTxns = transactions.filter(t => t.inventory_id === item.id || t.inventory_name === item.name);
              const b2bQ = itemTxns.filter(t => t.dispatch_type === 'b2b').reduce((s, t) => s + Math.abs(t.quantity), 0);
              const b2cQ = itemTxns.filter(t => t.dispatch_type === 'b2c' || (t.transaction_type === 'stock_out' && !t.dispatch_type)).reduce((s, t) => s + Math.abs(t.quantity), 0);
              const isOut = item.stock === 0;
              const isLow = !isOut && item.low_stock_threshold && item.stock <= item.low_stock_threshold;
              return (
                <div key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    padding: '14px', borderRadius: 12, cursor: 'pointer',
                    border: `1px solid ${isOut ? '#fecaca' : isLow ? '#fde68a' : 'var(--border)'}`,
                    background: isOut ? '#fef2f2' : isLow ? '#fffbeb' : 'var(--surface-2)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${PALETTE[idx % PALETTE.length]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Box size={16} color={PALETTE[idx % PALETTE.length]} />
                    </div>
                    <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', background: isOut ? '#fecaca' : isLow ? '#fde68a' : '#d1fae5', color: isOut ? '#dc2626' : isLow ? '#b45309' : '#065f46' }}>
                      {isOut ? 'Out' : isLow ? 'Low' : 'OK'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 8 }}>{item.category}</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: '#f5f3ff', color: '#8b5cf6', fontWeight: 700 }}>B2B: {b2bQ}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: '#f0f9ff', color: '#0ea5e9', fontWeight: 700 }}>B2C: {b2cQ}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: '#ecfdf5', color: '#10b981', fontWeight: 700 }}>Stock: {item.stock}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CUSTOMER SECTION ── */}
        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={15} color="#2563EB" /> Dispatch Customers
            </h3>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 10, padding: 4, gap: 2 }}>
              {[
                { key: 'all', label: 'All', count: Object.keys(b2bCustomers).length + Object.keys(b2cCustomers).length },
                { key: 'b2b', label: 'B2B', count: Object.keys(b2bCustomers).length },
                { key: 'b2c', label: 'B2C', count: Object.keys(b2cCustomers).length },
              ].map(({ key, label, count }) => (
                <button key={key} onClick={() => setDispatchFilter(key)} style={{
                  padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 13,
                  background: dispatchFilter === key ? (key === 'b2b' ? '#8b5cf6' : key === 'b2c' ? '#0ea5e9' : 'var(--color-primary)') : 'transparent',
                  color: dispatchFilter === key ? '#fff' : 'var(--text-3)',
                  transition: 'all 0.2s',
                }}>
                  {label} <span style={{ fontSize: 10, opacity: 0.8 }}>({count})</span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: '#2563EB', borderRadius: '50%', margin: '0 auto' }} />
            </div>
          ) : customerData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Users size={32} color="var(--text-4)" style={{ margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: 'var(--text-4)', fontSize: 13 }}>No {dispatchFilter === 'all' ? '' : dispatchFilter.toUpperCase() + ' '}dispatches found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {customerData.map((customer, idx) => {
                const isB2B = customer.type === 'B2B';
                const color = isB2B ? '#8b5cf6' : '#0ea5e9';
                const bg = isB2B ? '#f5f3ff' : '#f0f9ff';
                const border = isB2B ? '#ddd6fe' : '#bae6fd';
                const isExpanded = expandedCustomer === `${customer.type}-${customer.name}`;

                // Group dispatched items for this customer
                const itemsDispatched = {};
                customer.txns.forEach(tx => {
                  const name = tx.inventory_name || 'Unknown Item';
                  if (!itemsDispatched[name]) itemsDispatched[name] = 0;
                  itemsDispatched[name] += Math.abs(tx.quantity);
                });

                return (
                  <div key={`${customer.type}-${customer.name}-${idx}`} style={{ borderRadius: 12, border: `1px solid ${border}`, overflow: 'hidden' }}>
                    {/* Customer Row */}
                    <div
                      onClick={() => setExpandedCustomer(isExpanded ? null : `${customer.type}-${customer.name}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                        background: bg, cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.97)'}
                      onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isB2B ? <Building size={18} color={color} /> : <Truck size={18} color={color} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.name}</p>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: color, color: '#fff' }}>{customer.type}</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>
                          {customer.txns.length} dispatch{customer.txns.length !== 1 ? 'es' : ''} · {Object.keys(itemsDispatched).length} item type{Object.keys(itemsDispatched).length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color }}>{customer.totalQty}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600 }}>units</p>
                      </div>
                      {isExpanded ? <ChevronUp size={16} color="var(--text-4)" /> : <ChevronDown size={16} color="var(--text-4)" />}
                    </div>

                    {/* Expanded: Items dispatched */}
                    {isExpanded && (
                      <div style={{ padding: '12px 16px', background: 'var(--surface)', borderTop: `1px solid ${border}` }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.5px' }}>Items Dispatched</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 14 }}>
                          {Object.entries(itemsDispatched).map(([itemName, qty], i) => (
                            <div key={itemName} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${PALETTE[i % PALETTE.length]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Package size={14} color={PALETTE[i % PALETTE.length]} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemName}</p>
                                <p style={{ fontSize: 11, color, fontWeight: 700 }}>{qty} units</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Dispatch history */}
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', marginBottom: 8 }}>Dispatch History</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {customer.txns.map(tx => (
                            <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--surface-2)', fontSize: 12 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                              <span style={{ fontWeight: 600, color: 'var(--text-1)', flex: 1 }}>{tx.inventory_name}</span>
                              <span style={{ fontWeight: 800, color }}>{Math.abs(tx.quantity)} units</span>
                              <span style={{ color: 'var(--text-4)', whiteSpace: 'nowrap' }}>
                                {tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ ...card, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={14} color="#2563EB" /> Quick Actions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            {[
              { label: 'Add New Item', icon: Plus, color: '#2563EB', bg: '#eff6ff', path: '/procurement-portal', desc: 'Add inventory item' },
              { label: 'View Inventory', icon: Package, color: '#10b981', bg: '#ecfdf5', path: '/procurement-portal', desc: 'Manage all stock' },
              { label: 'B2B Dispatch', icon: Building, color: '#8b5cf6', bg: '#f5f3ff', path: '/procurement-portal', desc: 'Process B2B orders' },
              { label: 'Transaction Log', icon: ClipboardList, color: '#f59e0b', bg: '#fffbeb', path: '/procurement-portal', desc: 'View stock movements' },
            ].map(({ label, icon: Icon, color, bg, path, desc }) => (
              <button key={label} onClick={() => navigate(path)} style={{ padding: '14px', borderRadius: 12, border: `1px solid ${color}20`, background: bg, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${color}25`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Icon size={16} color={color} />
                </div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 10, color: 'var(--text-4)' }}>{desc}</p>
              </button>
            ))}
          </div>
        </div>

        <Footer />
      </main>

      {/* Item Drill-Down Modal */}
      {selectedItem && (
        <ItemDrillModal
          item={selectedItem}
          transactions={transactions}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
