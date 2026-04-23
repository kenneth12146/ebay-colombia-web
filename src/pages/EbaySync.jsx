import { useEffect, useState, useCallback } from 'react';
import {
  Package, Truck, CheckCircle, Clock, ExternalLink,
  RefreshCw, Search, ImageOff, LayoutGrid, List,
  X, DollarSign, ChevronRight, AlertCircle, Box, Anchor, ShoppingBag
} from 'lucide-react';
import api from '../lib/axios';

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADOS = [
  { value: 'all',                label: 'Todos',                    shortLabel: 'Todos' },
  { value: 'pagado',             label: '💳 Pagado',                shortLabel: 'Pagado' },
  { value: 'en-camino',          label: '📦 En camino al casillero',shortLabel: 'En camino' },
  { value: 'entregado',          label: '✅ Llegó al casillero',    shortLabel: 'En casillero' },
  { value: 'en-camino-colombia', label: '🚢 Rumbo a Colombia',      shortLabel: 'En tránsito' },
  { value: 'en-inventario',      label: '🏠 En inventario',         shortLabel: 'Inventario' },
  { value: 'vendido',            label: '✅ Vendidos',              shortLabel: 'Vendidos' },
];

const ESTADO_CONFIG = {
  'pagado':             { emoji: '💳', label: 'Pagado',           bg: 'bg-amber-100   dark:bg-amber-900/30',   text: 'text-amber-800   dark:text-amber-300'   },
  'en-camino':          { emoji: '📦', label: 'En camino',        bg: 'bg-sky-100     dark:bg-sky-900/30',     text: 'text-sky-800     dark:text-sky-300'     },
  'entregado':          { emoji: '✅', label: 'En casillero',     bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300' },
  'en-camino-colombia': { emoji: '🚢', label: 'Rumbo a Colombia', bg: 'bg-violet-100  dark:bg-violet-900/30',  text: 'text-violet-800  dark:text-violet-300'  },
  'en-inventario':      { emoji: '🏠', label: 'En inventario',    bg: 'bg-teal-100    dark:bg-teal-900/30',    text: 'text-teal-800    dark:text-teal-300'    },
  'vendido':            { emoji: '✅', label: 'Vendido',          bg: 'bg-green-100   dark:bg-green-900/30',   text: 'text-green-800   dark:text-green-300'   },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt     = (n) => `$${parseFloat(n || 0).toFixed(2)}`;
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const calcCostoTotal = (product) => {
  if (product.costo_total && parseFloat(product.costo_total) > 0) {
    return parseFloat(product.costo_total);
  }
  return parseFloat(product.total_paid || 0) + parseFloat(product.costo_logybox || 0);
};

// ─── ProductImage ─────────────────────────────────────────────────────────────

function ProductImage({ photoUrl, title, className = '' }) {
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!photoUrl || err) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 ${className}`}>
        <ImageOff className="w-6 h-6 text-gray-300 dark:text-gray-600" />
      </div>
    );
  }
  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800/50">
          <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        src={photoUrl}
        alt={title}
        className="w-full h-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
        onLoad={() => setLoading(false)}
        onError={() => { setErr(true); setLoading(false); }}
      />
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ estado, size = 'sm' }) {
  const cfg = ESTADO_CONFIG[estado] || {
    emoji: '❓', label: estado,
    bg: 'bg-gray-100 dark:bg-gray-700/50',
    text: 'text-gray-700 dark:text-gray-300'
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap shadow-sm
      ${size === 'sm' ? 'px-2 py-0.5 text-[10px] sm:text-xs' : 'px-3.5 py-1.5 text-sm'}
      ${cfg.bg} ${cfg.text}`}
    >
      <span className="text-[12px] sm:text-[14px] leading-none">{cfg.emoji}</span>
      <span>{cfg.label}</span>
    </span>
  );
}

// ─── Modal de Detalle ─────────────────────────────────────────────────────────

function DetailModal({ product, onClose }) {
  if (!product) return null;

  const costoTotal = calcCostoTotal(product);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-gray-200 dark:border-gray-800 animate-slide-up sm:animate-fade-in pb-safe">
        
        {/* Drag Handle for mobile */}
        <div className="w-full flex justify-center py-3 sm:hidden" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        <div className="relative">
          <div className="h-56 sm:h-64 bg-gray-50 dark:bg-gray-800/50 rounded-t-3xl sm:rounded-t-3xl overflow-hidden p-6">
            <ProductImage photoUrl={product.photo_url} title={product.title} className="h-full w-full drop-shadow-md" />
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shadow-lg transition-all hover:scale-105 active:scale-95 z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-gray-900 dark:via-gray-900/90">
            <StatusBadge estado={product.estado_envio || 'vendido'} size="md" />
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">{product.title}</h2>
            {product.ebay_url && (
              <a
                href={product.ebay_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 mt-2 bg-sky-50 dark:bg-sky-500/10 px-3 py-1.5 rounded-full transition-colors w-fit"
              >
                <ExternalLink className="w-4 h-4" /> Ver en eBay
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section icon={<Box className="w-5 h-5" />} title="Información eBay" color="sky">
              <Row label="Orden" value={<span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">{product.ebay_order_id || '—'}</span>} />
              <Row label="Vendedor" value={<span className="text-sm font-medium">{product.seller || '—'}</span>} />
              <Row label="Cantidad" value={<span className="text-sm font-medium">{product.quantity || 1} un.</span>} />
              <Row label="Precio unitario" value={<span className="font-mono font-medium">{fmt(product.price_ebay)}</span>} />
              <Row label="Envío eBay" value={<span className="font-mono font-medium">{fmt(product.shipping_ebay)}</span>} />
              <div className="mt-2 pt-2 border-t border-sky-100 dark:border-sky-900/50 flex justify-between items-center">
                <span className="text-sm font-bold text-sky-900 dark:text-sky-100">Total pagado</span>
                <span className="text-lg font-black text-sky-600 dark:text-sky-400">{fmt(product.total_paid)}</span>
              </div>
              <Row label="Compra" value={<span className="text-xs text-gray-500">{fmtDate(product.purchase_date)}</span>} />
            </Section>

            {product.estado_envio && product.estado_envio !== 'vendido' && (
              <Section icon={<Truck className="w-5 h-5" />} title="Estado de envío" color="amber">
                <Row label="Estado actual" value={<StatusBadge estado={product.estado_envio} />} />
                {product.tracking_number && (
                  <Row label="Tracking" value={
                    product.tracking_url ? (
                      <a href={product.tracking_url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 bg-sky-50 dark:bg-sky-500/10 px-2 py-1 rounded-md flex items-center gap-1 transition-colors">
                        {product.tracking_number} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{product.tracking_number}</span>
                  } />
                )}
                {product.carrier && <Row label="Carrier" value={<span className="text-sm font-medium">{product.carrier}</span>} />}
                {product.shipped_date && <Row label="Envío" value={<span className="text-xs text-gray-500">{fmtDate(product.shipped_date)}</span>} />}
                {product.delivered_date && <Row label="Entrega (MIA)" value={<span className="text-xs text-gray-500">{fmtDate(product.delivered_date)}</span>} />}
              </Section>
            )}

            {(product.guia_logybox || product.costo_logybox != null) && (
              <Section icon={<Anchor className="w-5 h-5" />} title="Logística Logybox" color="violet">
                {product.guia_logybox && (
                  <Row label="ID (LBX)" value={
                    <span className="font-mono text-xs font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-md">
                      {product.guia_logybox}
                    </span>
                  } />
                )}
                {product.costo_logybox != null && <Row label="Costo envío" value={<span className="font-mono font-medium">{fmt(product.costo_logybox)}</span>} />}
                {product.fecha_llegada_logybox && <Row label="Registro" value={<span className="text-xs text-gray-500">{fmtDate(product.fecha_llegada_logybox)}</span>} />}
                <div className="mt-3 pt-3 border-t border-violet-100 dark:border-violet-900/50 flex justify-between items-center bg-violet-50/50 dark:bg-violet-900/10 -mx-4 px-4 py-2 rounded-b-xl">
                  <span className="text-sm font-bold text-violet-900 dark:text-violet-100">Costo total acumulado</span>
                  <span className="text-xl font-black text-violet-600 dark:text-violet-400">{fmt(costoTotal)}</span>
                </div>
              </Section>
            )}

            {(product.status === 'Vendido' || product.precio_venta) && (
              <Section icon={<ShoppingBag className="w-5 h-5" />} title="Detalles de Venta" color="emerald">
                <Row label="Precio de venta" value={<span className="font-mono font-bold text-gray-900 dark:text-white">{fmt(product.precio_venta)}</span>} />
                <Row label="Ganancia Neta" value={<span className="text-emerald-600 dark:text-emerald-400 font-black text-lg bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">{fmt(product.ganancia)}</span>} />
                <Row label="Margen" value={<span className="font-bold text-emerald-600 dark:text-emerald-400">{product.margen_porcentaje || 0}%</span>} />
                <Row label="Fecha venta" value={<span className="text-xs text-gray-500">{fmtDate(product.fecha_venta)}</span>} />
                {product.numero_factura && <Row label="Factura" value={<span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">#{product.numero_factura}</span>} />}
                {product.cliente_nombre && <Row label="Cliente" value={<span className="text-sm font-medium">{product.cliente_nombre}</span>} />}
              </Section>
            )}
          </div>
          
          {/* Espaciador para mobile bottom nav si existiera o para safe area */}
          <div className="h-6 sm:h-0"></div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, color, children }) {
  const colors = {
    sky:    'text-sky-600    dark:text-sky-400    border-sky-100    dark:border-sky-900/30 bg-white dark:bg-gray-800/50',
    amber:  'text-amber-600  dark:text-amber-400  border-amber-100  dark:border-amber-900/30 bg-white dark:bg-gray-800/50',
    violet: 'text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/30 bg-white dark:bg-gray-800/50',
    emerald:'text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-gray-800/50',
  };
  return (
    <div className={`border rounded-2xl p-4 shadow-sm ${colors[color]}`}>
      <div className={`flex items-center gap-2.5 mb-4 font-bold text-sm sm:text-base ${colors[color].split(' ').slice(0, 2).join(' ')}`}>
        <div className="p-1.5 rounded-lg bg-current opacity-20 hidden"></div> {/* Placeholder for bg color extraction if needed */}
        {icon} {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500 dark:text-gray-400 font-medium">{label}</span>
      <span className="text-gray-800 dark:text-gray-200 text-right">{value}</span>
    </div>
  );
}

// ─── ProductCardGrid ──────────────────────────────────────────────────────────

function ProductCardGrid({ product, onClick }) {
  return (
    <button
      onClick={() => onClick(product)}
      className="group w-full text-left bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/50 overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500 flex flex-col h-full"
    >
      <div className="aspect-[4/3] bg-gray-50/50 dark:bg-gray-800/50 relative overflow-hidden border-b border-gray-50 dark:border-gray-700/30">
        <ProductImage photoUrl={product.photo_url} title={product.title} className="h-full w-full" />
        <div className="absolute top-3 left-3">
          <StatusBadge estado={product.estado_envio || 'vendido'} />
        </div>
        <div className="absolute inset-0 bg-sky-900/0 group-hover:bg-sky-900/5 dark:group-hover:bg-sky-400/5 transition-colors flex items-center justify-center">
          <div className="transform scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-xs font-bold text-gray-800 dark:text-gray-200 px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" /> Ver
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-4 flex-1">
          {product.title}
        </p>
        <div className="flex items-end justify-between mt-auto">
          <div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mb-0.5">
              {product.precio_venta ? 'Vendido en' : 'Costo'}
            </p>
            <span className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
              {fmt(product.precio_venta || product.total_paid)}
            </span>
          </div>
          {product.ganancia && (
             <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
               +{fmt(product.ganancia)}
             </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── ProductRowList ───────────────────────────────────────────────────────────

function ProductRowList({ product, onClick }) {
  return (
    <button
      onClick={() => onClick(product)}
      className="group w-full text-left flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:shadow-lg hover:border-sky-200 dark:hover:border-sky-800/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98]"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
        <ProductImage photoUrl={product.photo_url} title={product.title} className="w-full h-full" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white line-clamp-1 sm:line-clamp-2 leading-snug mb-1">{product.title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 rounded flex items-center gap-1">
            <Box className="w-3 h-3" />
            {product.ebay_order_id || `#${product.numero_factura || '—'}`}
          </span>
          <StatusBadge estado={product.estado_envio || 'vendido'} />
        </div>
      </div>
      <div className="flex-shrink-0 text-right ml-2">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mb-0.5">
          {product.precio_venta ? 'Vendido' : 'Costo'}
        </p>
        <p className="text-sm sm:text-lg font-black text-gray-900 dark:text-white">
          {fmt(product.precio_venta || product.total_paid)}
        </p>
        {product.ganancia && (
          <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">+{fmt(product.ganancia)}</p>
        )}
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-sky-500 transition-colors flex-shrink-0 hidden sm:block ml-2" />
    </button>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function EbaySync() {
  const [products, setProducts] = useState([]);
  const [vendidos, setVendidos] = useState([]);
  const [vendidosCount, setVendidosCount] = useState(0);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  // Por defecto list en movil, grid en desktop
  const [viewMode, setViewMode] = useState(window.innerWidth < 640 ? 'list' : 'grid');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get('/products?limit=100');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  }, []);

  const fetchVendidosCount = useCallback(async () => {
    try {
      const response = await api.get('/inventario/vendidos?limit=1');
      setVendidosCount(response.data.total || 0);
    } catch (error) {
      console.error('Error cargando conteo de vendidos:', error);
    }
  }, []);

  const fetchVendidos = useCallback(async () => {
    try {
      const response = await api.get('/inventario/vendidos?limit=100');
      setVendidos(response.data.ventas || []);
    } catch (error) {
      console.error('Error cargando vendidos:', error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchVendidosCount();
    fetchVendidos();
    
    // Handle resize for view mode
    const handleResize = () => {
      if (window.innerWidth < 640 && viewMode === 'grid') {
        setViewMode('list');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchProducts, fetchVendidosCount, fetchVendidos]); // viewMode omitido a proposito

  useEffect(() => {
    setLoading(true);
    
    let data = [];
    if (statusFilter === 'vendido') {
      data = vendidos;
    } else {
      data = products;
      if (statusFilter !== 'all') {
        data = data.filter(p => p.estado_envio === statusFilter);
      }
    }
    
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.ebay_order_id?.toLowerCase().includes(q) ||
        p.guia_logybox?.toLowerCase().includes(q)
      );
    }
    
    setFiltered(data);
    setLoading(false);
  }, [statusFilter, searchTerm, products, vendidos]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const { data } = await api.post('/sync/ebay/manual', { days: 30, fotos: true });
      setSyncMsg({
        type: 'success',
        text: `✅ ${data.insertadas} nuevas · ${data.actualizadas} actualizadas · ${data.total_ebay} en eBay`
      });
      await fetchProducts();
      await fetchVendidosCount();
      await fetchVendidos();
    } catch {
      setSyncMsg({ type: 'error', text: '❌ Error en sincronización' });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 5000);
    }
  };

  const countByEstado = (estado) => {
    if (estado === 'all') return products.length;
    if (estado === 'vendido') return vendidosCount;
    return products.filter(p => p.estado_envio === estado).length;
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">eBay Sync</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Auto-sync cada 2 min
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="group flex justify-center items-center gap-2 px-6 py-3 sm:py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-sm font-bold rounded-2xl transition-all shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
        </button>
      </div>

      {/* Mensaje sync */}
      {syncMsg && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold shadow-sm animate-fade-in
          ${syncMsg.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
            : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30'
          }`}>
          {syncMsg.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {syncMsg.text}
        </div>
      )}

      {/* Barra de búsqueda + toggle vista (Sticky en móvil) */}
      <div className="sticky top-0 z-20 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl py-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent sm:py-0 border-b border-gray-200/50 dark:border-gray-700/50 sm:border-none shadow-sm sm:shadow-none">
        <div className="flex gap-2 sm:gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar título, orden o LBX..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 shadow-sm transition-all"
            />
            {searchTerm && (
               <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                 <X className="w-4 h-4" />
               </button>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1 p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
              title="Vista de cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
              title="Vista de lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Filtros de estado - Scrollable en móvil */}
        <div className="mt-3 flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap gap-2 hide-scrollbar snap-x">
          {ESTADOS.map(({ value, label, shortLabel }) => {
            const count = countByEstado(value);
            const active = statusFilter === value;
            return (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`snap-center flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-2xl text-[13px] sm:text-sm font-semibold transition-all border
                  ${active
                    ? 'bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900 shadow-md'
                    : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold
                  ${active
                    ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resultados */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
             <div className="w-12 h-12 border-4 border-sky-100 dark:border-sky-900/50 rounded-full"></div>
             <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">Sincronizando datos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 bg-white/50 dark:bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
          <div className="w-20 h-20 mb-4 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {statusFilter === 'vendido' ? 'Sin ventas registradas' : 'No hay productos'}
          </h3>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm">
            {searchTerm ? `No encontramos nada para "${searchTerm}"` : 'Aún no hay productos en este estado. Sincroniza con eBay para actualizar.'}
          </p>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="mt-4 text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline">
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5 animate-fade-in">
          {filtered.map(p => (
            <ProductCardGrid key={p.id || p.inventory_item_id} product={p} onClick={setSelectedProduct} />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3 animate-fade-in">
          {filtered.map(p => (
            <ProductRowList key={p.id || p.inventory_item_id} product={p} onClick={setSelectedProduct} />
          ))}
        </div>
      )}

      {/* Conteo final */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-center py-4 border-t border-gray-100 dark:border-gray-800 mt-6">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-gray-800/50 px-4 py-1.5 rounded-full">
            Mostrando {filtered.length} de {countByEstado(statusFilter)}
          </p>
        </div>
      )}

      {/* Modal Detalle */}
      {selectedProduct && (
        <DetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {/* Estilos adicionales para ocultar scrollbar en los filtros móviles */}
      <style dangerouslySetContent={{ __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
           .pb-safe {
             padding-bottom: env(safe-area-inset-bottom);
           }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}