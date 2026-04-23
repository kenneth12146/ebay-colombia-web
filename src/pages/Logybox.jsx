import { useState, useEffect } from 'react';
import {
  Search, Package, Truck, DollarSign, AlertCircle,
  CheckCircle, History, Tag, RefreshCw, X, Copy,
  Edit2, Save, Box, MapPin, Hash
} from 'lucide-react';
import api from '../lib/axios';

// ─── Paleta y estilos base ────────────────────────────────────────────────────
const TABS = [
  { id: 'buscar',    icon: Search,  label: 'Buscar Guía'    },
  { id: 'lbx',       icon: Hash,    label: 'Buscar por LBX' },
  { id: 'en-camino', icon: Truck,   label: 'En Camino'      },
  { id: 'historial', icon: History, label: 'Historial'      },
];

const ESTADO_COLORS = {
  'pagado':             'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'en-camino':          'bg-blue-100   text-blue-800   dark:bg-blue-900/40   dark:text-blue-300',
  'entregado':          'bg-green-100  text-green-800  dark:bg-green-900/40  dark:text-green-300',
  'en-camino-colombia': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'en-colombia':        'bg-teal-100   text-teal-800   dark:bg-teal-900/40   dark:text-teal-300',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// FIX: helper centralizado para calcular costo total de forma segura
const calcTotal = (totalPaid, costoLogybox) => {
  const base  = parseFloat(totalPaid   || 0);
  const extra = parseFloat(costoLogybox || 0);
  return (base + extra).toFixed(2);
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function TabBar({ active, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
      {TABS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center
            ${active === id
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

function Alert({ type, message }) {
  const styles = {
    error:   'bg-red-50   dark:bg-red-900/20   border-red-200   dark:border-red-800   text-red-700   dark:text-red-400',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
  };
  const Icon = type === 'error' ? AlertCircle : CheckCircle;
  return (
    <div className={`flex items-start gap-3 p-4 border rounded-xl ${styles[type]}`}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <span className="text-sm leading-relaxed">{message}</span>
    </div>
  );
}

function ProductCard({ producto, onClose, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-4 p-5 border-b border-gray-100 dark:border-gray-700">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          {producto.photo_url
            ? <img src={producto.photo_url} alt={producto.title} className="w-full h-full object-contain" />
            : <Package className="w-7 h-7 text-gray-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
            {producto.title}
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              #{producto.ebay_order_id}
            </span>
            {producto.estado_envio && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[producto.estado_envio] || 'bg-gray-100 text-gray-700'}`}>
                {producto.estado_descripcion || producto.estado_envio}
              </span>
            )}
          </div>
          {producto.tracking_number && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono truncate">
              {producto.carrier} · {producto.tracking_number}
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function CostSummary({ totalPaid, extra = 0 }) {
  // FIX: usar calcTotal para consistencia
  const total = calcTotal(totalPaid, extra);
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2">
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Pagado en eBay</span>
        <span className="font-medium text-gray-900 dark:text-white">
          ${parseFloat(totalPaid || 0).toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Envío Logybox</span>
        <span className="font-medium text-gray-900 dark:text-white">
          ${parseFloat(extra || 0).toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 dark:border-gray-600">
        <span className="text-gray-800 dark:text-gray-100">Total acumulado</span>
        <span className="text-indigo-600 dark:text-indigo-400">${total}</span>
      </div>
    </div>
  );
}

// ─── Tab: Buscar por guía completa ───────────────────────────────────────────

function TabBuscar() {
  const [guia, setGuia]             = useState('');
  const [idLogybox, setIdLogybox]   = useState('');
  const [costo, setCosto]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [producto, setProducto]     = useState(null);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!guia.trim()) return setError('Ingresa la guía completa de Logybox');
    setLoading(true); setError(null); setProducto(null); setSuccess(null);
    try {
      const { data } = await api.post('/casillero/match', { guia_logybox: guia.trim() });
      setProducto(data.producto);
      // Extraer ID LBX de la guía si viene embebido
      const lbxMatch = guia.match(/LBX\d+/i);
      if (lbxMatch) setIdLogybox(lbxMatch[0].toUpperCase());
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.error || 'No se encontró el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!idLogybox.trim()) return setError('Ingresa el ID Logybox (LBX...)');
    const costoNum = parseFloat(costo);
    if (!costo || isNaN(costoNum) || costoNum < 0) return setError('Ingresa un costo válido (mayor o igual a 0)');
    setConfirming(true); setError(null);
    try {
      const { data } = await api.put('/casillero/confirm', {
        producto_id:  producto.id,
        costo_logybox: costoNum,
        guia_logybox:  idLogybox.trim(),
      });
      // FIX: usar costo_total del producto devuelto, con fallback al cálculo local
      const totalMostrar = data.producto?.costo_total
        ?? calcTotal(producto.total_paid, costoNum);
      setSuccess(`✅ Registrado · ID: ${idLogybox} · Total: $${parseFloat(totalMostrar).toFixed(2)}`);
      setProducto(null); setGuia(''); setIdLogybox(''); setCosto('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al confirmar');
    } finally {
      setConfirming(false);
    }
  };

  const reset = () => {
    setProducto(null); setGuia(''); setIdLogybox(''); setCosto(''); setError(null);
  };

  return (
    <div className="space-y-5">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4">
        <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">
          <strong>📌 Cómo funciona:</strong> Pega la guía larga de Logybox (contiene el tracking USPS/FedEx/UPS).
          El sistema busca el paquete automáticamente y luego registras el ID corto (LBX) y el costo.
        </p>
        <button
          onClick={() => { setGuia('4203316656409434608106244026478024'); setIdLogybox('LBX3173767'); }}
          className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <Copy className="w-3 h-3" /> Usar datos de ejemplo
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Guía completa de Logybox..."
            value={guia}
            onChange={e => setGuia(e.target.value)}
            disabled={loading}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !guia.trim()}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error   && <Alert type="error"   message={error}   />}
      {success && <Alert type="success" message={success} />}

      {producto && (
        <ProductCard producto={producto} onClose={reset}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  ID Logybox (LBX) *
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="LBX0000000"
                    value={idLogybox}
                    onChange={e => setIdLogybox(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Costo envío a Colombia (USD) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={costo}
                    onChange={e => setCosto(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <CostSummary totalPaid={producto.total_paid} extra={costo} />

            <div className="flex justify-end gap-3">
              <button
                onClick={reset}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming || !idLogybox || !costo}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {confirming
                  ? 'Confirmando...'
                  : <><CheckCircle className="w-4 h-4" /> Confirmar envío</>
                }
              </button>
            </div>
          </div>
        </ProductCard>
      )}

      {!producto && !loading && !error && !success && (
        <div className="text-center py-14 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Box className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Ingresa la guía para encontrar el paquete</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Buscar por LBX ─────────────────────────────────────────────────────

function TabBuscarLBX() {
  const [lbx, setLbx]               = useState('');
  const [loading, setLoading]       = useState(false);
  const [producto, setProducto]     = useState(null);
  const [error, setError]           = useState(null);
  const [editing, setEditing]       = useState(false);
  const [nuevoCosto, setNuevoCosto] = useState('');
  const [saving, setSaving]         = useState(false);
  const [success, setSuccess]       = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!lbx.trim()) return setError('Ingresa un ID Logybox (LBX...)');
    setLoading(true); setError(null); setProducto(null); setSuccess(null);
    try {
      const { data } = await api.get(`/casillero/buscar-lbx?lbx=${encodeURIComponent(lbx.trim())}`);
      setProducto(data.producto);
      setNuevoCosto(data.producto.costo_logybox ?? '');
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.error || 'No se encontró ningún paquete con ese LBX');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCosto = async () => {
    const costoNum = parseFloat(nuevoCosto);
    if (nuevoCosto === '' || isNaN(costoNum) || costoNum < 0) {
      return setError('Ingresa un costo válido (mayor o igual a 0)');
    }
    setSaving(true); setError(null);
    try {
      const { data } = await api.patch('/casillero/actualizar-costo', {
        producto_id:   producto.id,
        costo_logybox: costoNum,
      });
      // FIX: actualizar el producto local con los valores nuevos
      setProducto(prev => ({
        ...prev,
        costo_logybox: costoNum,
        // Preferir costo_total del servidor, sino calcular
        costo_total: data.costo_total ?? calcTotal(prev.total_paid, costoNum),
      }));
      setEditing(false);
      setSuccess('✅ Costo actualizado correctamente');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar el costo');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setProducto(null); setLbx(''); setError(null); setSuccess(null); setEditing(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl p-4">
        <p className="text-sm text-purple-800 dark:text-purple-300">
          <strong>🔍 Búsqueda por LBX:</strong> Busca paquetes que ya registraste usando el ID corto de Logybox.
          También puedes editar el costo de envío si necesitas corregirlo.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="LBX3173767"
            value={lbx}
            onChange={e => setLbx(e.target.value.toUpperCase())}
            disabled={loading}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono uppercase"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !lbx.trim()}
          className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error   && <Alert type="error"   message={error}   />}
      {success && <Alert type="success" message={success} />}

      {producto && (
        <ProductCard producto={producto} onClose={handleClose}>
          <div className="p-5 space-y-4">
            {/* Info del paquete */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">ID Logybox</p>
                <p className="font-mono font-semibold text-sm text-gray-900 dark:text-white">
                  {producto.guia_logybox || lbx}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Pagado eBay</p>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">
                  ${parseFloat(producto.total_paid || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 col-span-2 sm:col-span-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Costo Logybox</p>
                {editing ? (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={nuevoCosto}
                      onChange={e => setNuevoCosto(e.target.value)}
                      autoFocus
                      className="w-full bg-white dark:bg-gray-800 border border-purple-400 rounded-lg px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      ${parseFloat(producto.costo_logybox || 0).toFixed(2)}
                    </p>
                    <button
                      onClick={() => { setEditing(true); setSuccess(null); }}
                      className="p-1 text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Total — FIX: siempre mostrar valor correcto */}
            <CostSummary
              totalPaid={producto.total_paid}
              extra={editing ? nuevoCosto : producto.costo_logybox}
            />

            {editing && (
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setEditing(false); setNuevoCosto(producto.costo_logybox ?? ''); }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCosto}
                  disabled={saving}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? 'Guardando...' : <><Save className="w-4 h-4" /> Guardar costo</>}
                </button>
              </div>
            )}
          </div>
        </ProductCard>
      )}

      {!producto && !loading && !error && !success && (
        <div className="text-center py-14 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Hash className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Ingresa un ID Logybox (LBX) para buscar</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: En Camino ──────────────────────────────────────────────────────────

function TabEnCamino() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/casillero/en-camino');
      setItems(data.productos || []);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Paquetes registrados en Logybox y en camino a Colombia.
        </p>
        <button
          onClick={cargar}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && <div className="text-center py-8 text-sm text-gray-400">Cargando...</div>}

      {!loading && items.length === 0 && (
        <div className="text-center py-14 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Truck className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No hay paquetes en camino a Colombia</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map(prod => {
          // FIX: calcular costo_total de forma segura si llega null de la DB
          const costoTotal = prod.costo_total
            ?? calcTotal(prod.total_paid, prod.costo_logybox);

          return (
            <div
              key={prod.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {prod.photo_url
                    ? <img src={prod.photo_url} alt={prod.title} className="w-full h-full object-contain" />
                    : <Package className="w-5 h-5 text-gray-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight line-clamp-1">
                    {prod.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                    <span className="text-xs font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                      {prod.guia_logybox || 'Sin LBX'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3 h-3 inline mr-0.5" />
                      {prod.fecha_llegada_logybox
                        ? new Date(prod.fecha_llegada_logybox).toLocaleDateString('es-CO')
                        : 'Fecha N/A'
                      }
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    ${parseFloat(costoTotal).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Historial ──────────────────────────────────────────────────────────

function TabHistorial() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/casillero/historial');
      setItems(data.envios || []);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">Todos los envíos procesados por Logybox.</p>
        <button
          onClick={cargar}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && <div className="text-center py-8 text-sm text-gray-400">Cargando...</div>}

      {!loading && items.length === 0 && (
        <div className="text-center py-14 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <History className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No hay envíos registrados aún</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">LBX</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Producto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Costo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map(envio => (
                <tr key={envio.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                      {envio.guia_logybox}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-xs">
                    <span className="line-clamp-1">{envio.title || 'Producto eliminado'}</span>
                    {envio.ebay_order_id && (
                      <span className="block text-xs text-gray-400 font-mono">#{envio.ebay_order_id}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                    ${parseFloat(envio.costo_envio || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                    {envio.fecha_procesado
                      ? new Date(envio.fecha_procesado).toLocaleDateString('es-CO')
                      : 'N/A'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function Logybox() {
  const [activeTab, setActiveTab] = useState('buscar');

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-1">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📬 Casillero Logybox</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de envíos desde Miami a Colombia</p>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      <div>
        {activeTab === 'buscar'    && <TabBuscar />}
        {activeTab === 'lbx'       && <TabBuscarLBX />}
        {activeTab === 'en-camino' && <TabEnCamino />}
        {activeTab === 'historial' && <TabHistorial />}
      </div>
    </div>
  );
}