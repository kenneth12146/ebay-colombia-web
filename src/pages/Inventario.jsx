import { useState, useEffect, useRef } from 'react';
import {
  Package, DollarSign, TrendingUp, Archive, Clock, Tag,
  ShoppingBag, Calendar, X, CheckCircle, AlertCircle,
  Search, BarChart2, FileText, Printer, Phone, User, Users,
  CreditCard, ChevronDown, ChevronUp, RefreshCw, BookOpen,
  Star, AlertTriangle, ArrowUpRight, ArrowDownRight, Filter,
  Eye, Edit3, Bookmark, BookmarkX, Hash, Truck, SearchX, MapPin
} from 'lucide-react';
import api from '../lib/axios';

// ─────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────
const fmt = (n) => {
  const num = parseFloat(n);
  return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
};
const fmtDate = (d) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '-';
  }
};
const fmtPct = (n) => {
  const num = parseFloat(n);
  return isNaN(num) ? '0.0%' : `${num.toFixed(1)}%`;
};

// ─────────────────────────────────────────────────────────────
// COMPONENTES REUTILIZABLES (UI)
// ─────────────────────────────────────────────────────────────

const ModalBottomSheet = ({ children, onClose, isOpen }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-gray-200 dark:border-gray-800 animate-slide-up sm:animate-fade-in flex flex-col">
        {/* Drag Handle for mobile */}
        <div className="w-full flex justify-center py-3 sm:hidden" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>
        {children}
        {/* Espaciador para mobile safe area */}
        <div className="h-6 sm:h-0 flex-shrink-0"></div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// FACTURA IMPRIMIBLE
// ─────────────────────────────────────────────────────────────
const FacturaImprimir = ({ factura, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Factura #${String(factura.numero_factura || factura.numero).padStart(4,'0')}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; background: white; color: #111; padding: 32px; }
          .factura { max-width: 600px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #111; padding-bottom: 20px; margin-bottom: 24px; }
          .empresa-nombre { font-size: 26px; font-weight: 900; letter-spacing: -1px; }
          .empresa-sub { font-size: 12px; color: #555; margin-top: 4px; }
          .factura-num { text-align: right; }
          .factura-num h2 { font-size: 20px; font-weight: 700; }
          .factura-num p { font-size: 12px; color: #555; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
          .bloque h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 6px; }
          .bloque p { font-size: 14px; margin-bottom: 2px; }
          .tabla { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          .tabla th { background: #111; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
          .tabla td { padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; }
          .tabla .monto { text-align: right; font-weight: 600; }
          .totales { margin-left: auto; width: 240px; }
          .totales-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #eee; }
          .totales-row.final { font-weight: 700; font-size: 16px; border-top: 2px solid #111; border-bottom: none; padding-top: 10px; }
          .ganancia { color: #16a34a; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 16px; text-align: center; font-size: 11px; color: #888; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const numFactura = String(factura.numero_factura || factura.numero || 0).padStart(4, '0');
  const precio = parseFloat(factura.precio_venta || 0);

  return (
    <ModalBottomSheet isOpen={true} onClose={onClose}>
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-10">
        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-500" />
          Factura #{numFactura}
        </h3>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center justify-center w-10 h-10 sm:w-auto sm:px-4 sm:py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full sm:rounded-xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline sm:ml-2">Imprimir / PDF</span>
          </button>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-full sm:rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div ref={printRef} className="p-4 sm:p-8 overflow-y-auto">
         {/* Aquí va el mismo contenido imprimible del componente original, se mantiene por compatibilidad con window.print */}
          <div className="factura max-w-full overflow-x-hidden">
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #111', paddingBottom: '20px', marginBottom: '24px' }}>
              <div>
                <div className="empresa-nombre" style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-1px', color: '#111' }}>MARLON AUDIO</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>Tecnología importada · Barranquilla, Colombia</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>FACTURA</h2>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>#{numFactura}</p>
                <p style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{fmtDate(factura.fecha_venta)}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <h4 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '6px' }}>Cliente</h4>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{factura.cliente_nombre || 'Cliente general'}</p>
                {factura.cliente_telefono && <p style={{ fontSize: '13px', color: '#555' }}>📞 {factura.cliente_telefono}</p>}
              </div>
              <div>
                <h4 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '6px' }}>Pago</h4>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{factura.metodo_pago || 'Efectivo'}</p>
                <p style={{ fontSize: '12px', color: '#555' }}>Ref. eBay: {factura.ebay_order_id || '-'}</p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
              <thead>
                <tr style={{ background: '#111', color: 'white' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>Descripción</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase' }}>Qty</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase' }}>Precio</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '14px 12px', borderBottom: '1px solid #eee', color: '#111' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{factura.title}</div>
                    {factura.tracking_number && <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Tracking: {factura.tracking_number} ({factura.carrier || '-'})</div>}
                    {factura.notas && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Nota: {factura.notas}</div>}
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: '#111' }}>1</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: '#111' }}>{fmt(precio)}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, color: '#111' }}>{fmt(precio)}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginLeft: 'auto', maxWidth: '260px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '18px', fontWeight: 700, borderTop: '2px solid #111', color: '#111', marginTop: '6px' }}>
                <span>TOTAL</span>
                <span>{fmt(precio)}</span>
              </div>
            </div>
          </div>
      </div>
    </ModalBottomSheet>
  );
};

// ─────────────────────────────────────────────────────────────
// MODAL VENTA MULTIPLE (Misma lógica, usando ModalBottomSheet)
// ─────────────────────────────────────────────────────────────
const FacturaImprimirMultiple = ({ facturas, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    const f = facturas[0];
    const num = String(f.numero_factura || f.numero || 0).padStart(4, '0');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Factura #${num}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; background: white; color: #111; padding: 32px; }
          .factura { max-width: 600px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #111; padding-bottom: 20px; margin-bottom: 24px; }
          .empresa-nombre { font-size: 26px; font-weight: 900; letter-spacing: -1px; }
          .empresa-sub { font-size: 12px; color: #555; margin-top: 4px; }
          .factura-num { text-align: right; }
          .factura-num h2 { font-size: 20px; font-weight: 700; }
          .factura-num p { font-size: 12px; color: #555; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
          .bloque h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 6px; }
          .bloque p { font-size: 14px; margin-bottom: 2px; }
          .tabla { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          .tabla th { background: #111; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
          .tabla td { padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; }
          .tabla .monto { text-align: right; font-weight: 600; }
          .totales { margin-left: auto; width: 240px; }
          .totales-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #eee; }
          .totales-row.final { font-weight: 700; font-size: 16px; border-top: 2px solid #111; border-bottom: none; padding-top: 10px; }
          .ganancia { color: #16a34a; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 16px; text-align: center; font-size: 11px; color: #888; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const f = facturas[0];
  const numFactura = String(f.numero_factura || f.numero || 0).padStart(4, '0');
  const totalPrecio = facturas.reduce((s, fac) => s + parseFloat(fac.precio_venta || 0), 0);

  return (
    <ModalBottomSheet isOpen={true} onClose={onClose}>
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-10">
        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-500" />
          Factura Múltiple
        </h3>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center justify-center w-10 h-10 sm:w-auto sm:px-4 sm:py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full sm:rounded-xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline sm:ml-2">Imprimir / PDF</span>
          </button>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-full sm:rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div ref={printRef} className="p-4 sm:p-8 overflow-y-auto">
        <div className="factura">
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #111', paddingBottom: '20px', marginBottom: '24px' }}>
              <div>
                <div className="empresa-nombre" style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-1px', color: '#111' }}>MARLON AUDIO</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>Tecnología importada · Barranquilla, Colombia</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>FACTURA</h2>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>#{numFactura}</p>
                <p style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{fmtDate(f.fecha_venta)}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <h4 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '6px' }}>Cliente</h4>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{f.cliente_nombre || 'Cliente general'}</p>
                {f.cliente_telefono && <p style={{ fontSize: '13px', color: '#555' }}>📞 {f.cliente_telefono}</p>}
              </div>
              <div>
                <h4 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '6px' }}>Pago</h4>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{f.metodo_pago || 'Efectivo'}</p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
              <thead>
                <tr style={{ background: '#111', color: 'white' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>Descripción</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase' }}>Qty</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase' }}>Precio</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((fac, i) => (
                  <tr key={i}>
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid #eee', color: '#111' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{fac.title}</div>
                      {fac.tracking_number && (
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Tracking: {fac.tracking_number} ({fac.carrier || '-'})</div>
                      )}
                    </td>
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid #eee', textAlign: 'right', color: '#111' }}>1</td>
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid #eee', textAlign: 'right', color: '#111' }}>{fmt(fac.precio_venta)}</td>
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 700, color: '#111' }}>{fmt(fac.precio_venta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginLeft: 'auto', width: '260px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '18px', fontWeight: 700, borderTop: '2px solid #111', color: '#111', marginTop: '6px' }}>
                <span>TOTAL</span>
                <span>{fmt(totalPrecio)}</span>
              </div>
            </div>
        </div>
      </div>
    </ModalBottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL VENTA
// ─────────────────────────────────────────────────────────────
const ModalVenta = ({ item, onClose, onSuccess }) => {
  const [precioVenta, setPrecioVenta] = useState(item.precio_objetivo ? String(item.precio_objetivo) : '');
  const [notas, setNotas] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const costo = parseFloat(item.costo_unitario) || 0;
  const precio = parseFloat(precioVenta) || 0;
  const ganancia = precio - costo;
  const margen = precio > 0 ? (ganancia / precio) * 100 : 0;

  const handleSubmit = async () => {
    if (!precioVenta || precio <= 0) { setError('Ingresa un precio de venta válido'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.put('/inventario/vender', {
        inventory_item_id: item.inventory_item_id,
        precio_venta: precio,
        notas: notas || null,
        cliente_nombre: clienteNombre || null,
        cliente_telefono: clienteTelefono || null,
        metodo_pago: metodoPago
      });
      onSuccess(res.data.numero_factura);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBottomSheet isOpen={true} onClose={onClose}>
      <div className="p-5 sm:p-7 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <span className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </span>
            Registrar Venta
          </h3>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors hidden sm:block">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Producto */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl flex gap-4 items-center">
          {item.photo_url
            ? <img src={item.photo_url} alt="" className="w-16 h-16 object-contain rounded-xl bg-white dark:bg-gray-800 p-1 border border-gray-100 dark:border-gray-700 shadow-sm" />
            : <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center"><Package className="w-8 h-8 text-gray-400" /></div>
          }
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 dark:text-white line-clamp-2 text-sm sm:text-base leading-snug">{item.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1 font-medium">
              Costo importación: <span className="font-mono text-gray-900 dark:text-gray-200">{fmt(costo)}</span>
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Precio */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider text-xs">Precio de venta *</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
              <input type="number" step="0.01" min="0" value={precioVenta}
                onChange={e => setPrecioVenta(e.target.value)} autoFocus
                className="w-full pl-12 pr-4 py-4 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-2xl bg-white dark:bg-gray-900 text-2xl font-black text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-0 outline-none transition-all shadow-sm"
                placeholder="0.00" />
            </div>
            {precioVenta && (
              <div className={`mt-3 p-3.5 rounded-2xl flex justify-between items-center text-sm font-medium border ${ganancia >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-700 dark:text-red-400'}`}>
                <span>Ganancia Neta: <strong className="font-black text-lg ml-1">{fmt(ganancia)}</strong></span>
                <span className="bg-white/50 dark:bg-gray-900/50 px-2 py-1 rounded-lg">Margen: <strong className="font-bold">{fmtPct(margen)}</strong></span>
              </div>
            )}
          </div>

          {/* Datos precios de referencia */}
          {(item.precio_minimo || item.precio_objetivo) && (
            <div className="flex gap-2">
              {item.precio_minimo && <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 rounded-xl text-xs font-bold flex items-center gap-1"><Tag className="w-3 h-3" /> Mínimo: {fmt(item.precio_minimo)}</span>}
              {item.precio_objetivo && <span className="px-3 py-1.5 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30 rounded-xl text-xs font-bold flex items-center gap-1"><Star className="w-3 h-3" /> Objetivo: {fmt(item.precio_objetivo)}</span>}
            </div>
          )}

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider text-xs">Método de pago</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {['Efectivo', 'Transferencia', 'Nequi'].map(m => (
                <button key={m} onClick={() => setMetodoPago(m)}
                  className={`py-3 sm:py-2.5 rounded-xl text-sm font-bold transition-all border ${metodoPago === m ? 'bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900 shadow-md' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider text-xs"><User className="w-3.5 h-3.5 inline mr-1" />Cliente (Opcional)</label>
              <input type="text" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-gray-900 transition-colors"
                placeholder="Nombre del comprador" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider text-xs"><Phone className="w-3.5 h-3.5 inline mr-1" />Teléfono (Opcional)</label>
              <input type="text" value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-gray-900 transition-colors"
                placeholder="Ej: 3001234567" />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider text-xs"><FileText className="w-3.5 h-3.5 inline mr-1" />Notas</label>
            <input type="text" value={notas} onChange={e => setNotas(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-gray-900 transition-colors"
              placeholder="Ej: Vendido por Instagram" />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-sm font-semibold animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />{error}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer / Actions */}
      <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 mt-auto flex gap-3 z-10 rounded-b-3xl">
        <button onClick={onClose} className="flex-1 py-3.5 sm:py-3 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl font-bold transition-colors">
          Cancelar
        </button>
        <button onClick={handleSubmit} disabled={loading || !precioVenta}
          className="flex-[2] py-3.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black rounded-2xl transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2">
          {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          {loading ? 'Procesando...' : 'Confirmar Venta'}
        </button>
      </div>
    </ModalBottomSheet>
  );
};

// ─────────────────────────────────────────────────────────────
// MODAL VENTA MULTIPLE
// ─────────────────────────────────────────────────────────────
const ModalVentaMultiple = ({ items, onClose, onSuccess }) => {
  const [precios, setPrecios] = useState(
    items.reduce((acc, item) => ({ ...acc, [item.inventory_item_id]: item.precio_objetivo ? String(item.precio_objetivo) : '' }), {})
  );
  const [notas, setNotas] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    for (const item of items) {
      const p = parseFloat(precios[item.inventory_item_id]);
      if (!p || p <= 0) {
        setError(`Ingresa un precio válido para el producto ${item.title.substring(0, 15)}...`);
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const facturasGeneradas = [];
      for (const item of items) {
        const res = await api.put('/inventario/vender', {
          inventory_item_id: item.inventory_item_id,
          precio_venta: parseFloat(precios[item.inventory_item_id]),
          notas: notas || null,
          cliente_nombre: clienteNombre || null,
          cliente_telefono: clienteTelefono || null,
          metodo_pago: metodoPago
        });
        facturasGeneradas.push(res.data.numero_factura);
      }
      onSuccess(facturasGeneradas);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar venta múltiple');
    } finally {
      setLoading(false);
    }
  };

  const totalCosto = items.reduce((s, item) => s + (parseFloat(item.costo_unitario) || 0), 0);
  const totalVenta = items.reduce((s, item) => s + (parseFloat(precios[item.inventory_item_id]) || 0), 0);
  const totalGanancia = totalVenta - totalCosto;

  return (
    <ModalBottomSheet isOpen={true} onClose={onClose}>
      <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-10">
        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <span className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
             <ShoppingBag className="w-5 h-5" />
          </span>
          Venta Múltiple ({items.length})
        </h3>
        <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors hidden sm:block">
           <X className="w-5 h-5" />
        </button>
      </div>
        
      <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.inventory_item_id} className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl flex flex-col sm:flex-row gap-3 sm:items-center relative">
               <div className="absolute top-2 right-2 text-[10px] font-bold text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full sm:hidden">
                 #{idx + 1}
               </div>
              <div className="flex-1 min-w-0 pr-6 sm:pr-0">
                <p className="font-bold text-gray-900 dark:text-white line-clamp-2 text-sm">{item.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Costo: <span className="font-bold text-gray-700 dark:text-gray-300">{fmt(item.costo_unitario)}</span></p>
              </div>
              <div className="w-full sm:w-32 flex-shrink-0 mt-2 sm:mt-0">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input type="number" step="0.01" min="0" value={precios[item.inventory_item_id] || ''}
                    onChange={e => setPrecios({ ...precios, [item.inventory_item_id]: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold focus:border-emerald-500 focus:ring-0 outline-none text-sm transition-colors" placeholder="Precio" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
             <ShoppingBag className="w-24 h-24 transform rotate-12" />
           </div>
           <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Total Venta</p>
                <p className="text-3xl font-black">{fmt(totalVenta)}</p>
              </div>
              <div className="sm:text-right bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl w-full sm:w-auto">
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-0.5">Ganancia Estimada</p>
                <p className="text-xl font-black">{fmt(totalGanancia)}</p>
              </div>
           </div>
        </div>

        <div className="space-y-5">
           <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider text-xs">Método de pago</label>
              <div className="grid grid-cols-3 gap-2">
                {['Efectivo', 'Transferencia', 'Nequi'].map(m => (
                  <button key={m} onClick={() => setMetodoPago(m)}
                    className={`py-3 sm:py-2.5 rounded-xl text-sm font-bold transition-all border ${metodoPago === m ? 'bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900 shadow-md' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider text-xs"><User className="w-3.5 h-3.5 inline mr-1" />Cliente</label>
                <input type="text" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-gray-900 transition-colors" placeholder="Opcional" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider text-xs"><Phone className="w-3.5 h-3.5 inline mr-1" />Teléfono</label>
                <input type="text" value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-gray-900 transition-colors" placeholder="Opcional" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider text-xs"><FileText className="w-3.5 h-3.5 inline mr-1" />Notas</label>
              <input type="text" value={notas} onChange={e => setNotas(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-gray-900 transition-colors" placeholder="Opcional" />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-sm font-semibold animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />{error}
              </div>
            )}
        </div>
      </div>
        
      <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 mt-auto flex gap-3 rounded-b-3xl">
        <button onClick={onClose} className="flex-1 py-3.5 sm:py-3 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl font-bold transition-colors">Cancelar</button>
        <button onClick={handleSubmit} disabled={loading} className="flex-[2] py-3.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black rounded-2xl shadow-md disabled:opacity-50 flex justify-center items-center gap-2">
          {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          {loading ? 'Procesando...' : 'Confirmar Venta Múltiple'}
        </button>
      </div>
    </ModalBottomSheet>
  );
};

// ─────────────────────────────────────────────────────────────
// MODAL RECIBIR PRODUCTO
// ─────────────────────────────────────────────────────────────
const ModalRecibir = ({ onClose, onSuccess }) => {
  const [productoId, setProductoId] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [productosEnCamino, setProductosEnCamino] = useState([]);

  useEffect(() => {
    api.get('/casillero/en-camino')
      .then(r => setProductosEnCamino(r.data.productos || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!productoId) { setError('Selecciona un producto'); return; }
    setLoading(true);
    setError(null);
    try {
      await api.post('/inventario/recibir', { producto_id: parseInt(productoId), notas: notas || null });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al recibir producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBottomSheet isOpen={true} onClose={onClose}>
      <div className="p-5 sm:p-7 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
             <span className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
               <Package className="w-6 h-6" />
             </span>
             Recibir Producto
          </h3>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors hidden sm:block"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider text-xs">Producto en camino *</label>
            <div className="relative">
              <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select value={productoId} onChange={e => setProductoId(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-colors appearance-none">
                <option value="">Seleccionar producto...</option>
                {productosEnCamino.map(p => (
                  <option key={p.id} value={p.id}>{p.title.substring(0, 40)}... (LBX: {p.guia_logybox || 'N/A'})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {productosEnCamino.length === 0 && (
              <p className="text-xs text-orange-500 mt-2 bg-orange-50 dark:bg-orange-500/10 px-3 py-2 rounded-lg font-medium flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />No hay productos en camino. Confírmalos primero en Casillero.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider text-xs">Notas de recepción</label>
            <input type="text" value={notas} onChange={e => setNotas(e.target.value)}
              className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-colors"
              placeholder="Ej: Caja ligeramente golpeada" />
          </div>
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-sm font-semibold animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />{error}
            </div>
          )}
        </div>
      </div>
      <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 mt-auto flex gap-3 rounded-b-3xl">
        <button onClick={onClose} className="flex-1 py-3.5 sm:py-3 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl font-bold transition-colors">Cancelar</button>
        <button onClick={handleSubmit} disabled={loading || !productosEnCamino.length}
          className="flex-[2] py-3.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black rounded-2xl shadow-md disabled:opacity-50 flex justify-center items-center gap-2">
          {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          {loading ? 'Procesando...' : 'Confirmar Llegada'}
        </button>
      </div>
    </ModalBottomSheet>
  );
};

// ─────────────────────────────────────────────────────────────
// MODAL PRECIOS
// ─────────────────────────────────────────────────────────────
const ModalPrecios = ({ producto, onClose, onSuccess }) => {
  const [precioMinimo, setPrecioMinimo] = useState(producto.precio_minimo || '');
  const [precioObjetivo, setPrecioObjetivo] = useState(producto.precio_objetivo || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const costo = parseFloat(producto.costo_unitario) || 0;
  const min = parseFloat(precioMinimo) || 0;
  const obj = parseFloat(precioObjetivo) || 0;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.put('/inventario/precios', {
        producto_id: producto.product_id,
        precio_minimo: min || null,
        precio_objetivo: obj || null
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar precios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBottomSheet isOpen={true} onClose={onClose}>
      <div className="p-5 sm:p-7 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
             <span className="p-2 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
               <Tag className="w-6 h-6" />
             </span>
             Definir Precios
          </h3>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors hidden sm:block"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl">
          <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">{producto.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium flex items-center gap-1 bg-white dark:bg-gray-900 px-2.5 py-1 rounded-lg w-fit shadow-sm border border-gray-100 dark:border-gray-800">
             Costo Base: <strong className="text-gray-900 dark:text-white ml-1">{fmt(costo)}</strong>
          </p>
        </div>

        <div className="space-y-5">
          {[
            { label: 'Precio Mínimo (piso)', value: precioMinimo, set: setPrecioMinimo, color: 'amber', icon: AlertTriangle },
            { label: 'Precio Objetivo', value: precioObjetivo, set: setPrecioObjetivo, color: 'sky', icon: Star }
          ].map(({ label, value, set, color, icon: Icon }) => (
            <div key={label} className={`p-4 rounded-2xl border-2 ${color === 'amber' ? 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30' : 'bg-sky-50/50 border-sky-100 dark:bg-sky-900/10 dark:border-sky-900/30'}`}>
              <label className={`block text-sm font-bold mb-2 uppercase tracking-wider text-xs ${color === 'amber' ? 'text-amber-700 dark:text-amber-400' : 'text-sky-700 dark:text-sky-400'}`}>
                <Icon className="w-3.5 h-3.5 inline mr-1" />{label}
              </label>
              <div className="relative">
                <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${color === 'amber' ? 'text-amber-500' : 'text-sky-500'}`} />
                <input type="number" step="0.01" min="0" value={value} onChange={e => set(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-gray-900 text-lg font-bold text-gray-900 dark:text-white outline-none focus:ring-2 shadow-sm transition-all ${color === 'amber' ? 'focus:ring-amber-500 border border-amber-200 dark:border-amber-800' : 'focus:ring-sky-500 border border-sky-200 dark:border-sky-800'}`} />
              </div>
              {parseFloat(value) > 0 && (
                <div className="mt-3 flex justify-between items-center text-xs font-semibold bg-white/60 dark:bg-gray-900/60 p-2 rounded-lg">
                  <span className="text-gray-500">Ganancia proj.</span>
                  <span className={`${parseFloat(value) > costo ? 'text-green-600' : 'text-red-600'} font-bold flex gap-2`}>
                    {fmt(parseFloat(value) - costo)}
                    <span className="opacity-70">({fmtPct(parseFloat(value) > 0 ? ((parseFloat(value) - costo) / parseFloat(value)) * 100 : 0)})</span>
                  </span>
                </div>
              )}
            </div>
          ))}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-sm font-semibold animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />{error}
            </div>
          )}
        </div>
      </div>
      <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 mt-auto flex gap-3 rounded-b-3xl">
        <button onClick={onClose} className="flex-1 py-3.5 sm:py-3 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl font-bold transition-colors">Cancelar</button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex-[2] py-3.5 sm:py-3 bg-gradient-to-r from-gray-800 to-gray-900 dark:from-sky-600 dark:to-blue-700 text-white font-black rounded-2xl shadow-md disabled:opacity-50 flex justify-center items-center gap-2">
          {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Tag className="w-5 h-5" />}
          {loading ? 'Guardando...' : 'Guardar Precios'}
        </button>
      </div>
    </ModalBottomSheet>
  );
};

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────
const StatCard = ({ title, value, sub, icon: Icon, color, trend }) => {
  const gradients = {
    blue:   'from-blue-500 to-sky-600 shadow-blue-500/20',
    green:  'from-emerald-400 to-green-500 shadow-emerald-500/20',
    purple: 'from-violet-500 to-purple-600 shadow-purple-500/20',
    orange: 'from-amber-400 to-orange-500 shadow-orange-500/20',
    red:    'from-red-400 to-rose-500 shadow-red-500/20',
    teal:   'from-teal-400 to-emerald-500 shadow-teal-500/20',
  };
  const iconColors = {
    blue:   'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10',
    green:  'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
    purple: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10',
    orange: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10',
    red:    'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10',
    teal:   'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10',
  }

  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-10 bg-gradient-to-br ${gradients[color]} transition-opacity group-hover:opacity-30 pointer-events-none`} />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-2xl ${iconColors[color]}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="relative z-10">
        <h3 className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight break-words">{value}</p>
        {sub && <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-2">{sub}</p>}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// PRODUCT CARD (MOBILE INVENTORY)
// ─────────────────────────────────────────────────────────────
const ProductCardMobile = ({ item, onSelect, selected, onPrecios, onReservar, onVender }) => {
  const isEstancado = item.dias_en_inventario > 30;
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-3xl p-4 border transition-all ${selected ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-gray-100 dark:border-gray-700/50 shadow-sm'} ${isEstancado && !selected ? 'border-orange-200 dark:border-orange-900/30 bg-orange-50/30 dark:bg-orange-900/5' : ''}`}>
      <div className="flex gap-4">
        {/* Checkbox & Image */}
        <div className="flex flex-col items-center gap-3">
          <input type="checkbox"
            disabled={item.status === 'Reservado'}
            checked={selected}
            onChange={() => onSelect(item)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 mt-1" />
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-gray-600/50 overflow-hidden">
            {item.photo_url
              ? <img src={item.photo_url} alt="" className="w-full h-full object-contain p-1" />
              : <Package className="w-6 h-6 text-gray-400" />}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <p className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 leading-snug">{item.title}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="font-mono text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Hash className="w-2.5 h-2.5" />{item.ebay_order_id || 'N/A'}
            </span>
            <span className="font-mono text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" />{item.guia_logybox || 'N/A'}
            </span>
          </div>

          <div className="mt-3 flex items-end justify-between">
             <div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Costo</p>
               <p className="font-black text-gray-900 dark:text-white text-base">{fmt(item.costo_unitario)}</p>
             </div>
             <div className="text-right">
               <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  item.status === 'Reservado'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                }`}>
                  {item.status === 'Reservado' ? '🔖 Reservado' : '✅ Disp.'}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex gap-2">
         <button onClick={() => onPrecios(item)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl transition-colors">
            <Tag className="w-3.5 h-3.5" /> Precios
         </button>
         <button onClick={() => onReservar(item)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-colors ${item.status === 'Reservado' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-amber-50 hover:text-amber-600'}`}>
            {item.status === 'Reservado' ? <BookmarkX className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            {item.status === 'Reservado' ? 'Quitar Res.' : 'Reservar'}
         </button>
         <button onClick={() => onVender(item)} className="flex-[1.5] flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl transition-colors shadow-sm">
            <DollarSign className="w-3.5 h-3.5" /> Vender
         </button>
      </div>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function Inventario() {
  const [tab, setTab] = useState('inventario'); // inventario | historial | ganancias | clientes
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [mesFiltro, setMesFiltro] = useState('');
  const [mesKpi, setMesKpi] = useState('');
  const [modalVenta, setModalVenta] = useState(null);
  const [modalRecibir, setModalRecibir] = useState(false);
  const [modalPrecios, setModalPrecios] = useState(null);
  const [modalFactura, setModalFactura] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [modalVentaMultiple, setModalVentaMultiple] = useState(false);
  const [modalFacturaMultiple, setModalFacturaMultiple] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'list' : 'table');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === 'table') {
        setViewMode('list');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [productosRes, statsRes, ventasRes] = await Promise.all([
        api.get('/inventario/disponible'),
        api.get('/inventario/estadisticas'),
        api.get('/inventario/vendidos?limit=100')
      ]);
      setProductos(productosRes.data.productos || []);
      setEstadisticas(statsRes.data);
      setVentas(ventasRes.data.ventas || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setErrorMessage('Error cargando datos: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleSuccess = (msg, numeroFactura) => {
    setSuccessMessage(msg || '✅ Operación exitosa');
    cargarDatos();
    setModalVenta(null);
    setModalRecibir(false);
    setModalPrecios(null);
    setTimeout(() => setSuccessMessage(''), 4000);

    if (numeroFactura) {
      setTimeout(async () => {
        try {
          const res = await api.get(`/inventario/factura/${numeroFactura}`);
          setModalFactura(res.data.factura);
        } catch (_) {}
      }, 500);
    }
  };

  const handleSuccessMultiple = (msg, numerosFactura) => {
    setSuccessMessage(msg || '✅ Ventas registradas');
    cargarDatos();
    setModalVentaMultiple(false);
    setSelectedItems([]);
    setTimeout(() => setSuccessMessage(''), 4000);

    if (numerosFactura && numerosFactura.length > 0) {
      setTimeout(async () => {
        try {
          const resArray = await Promise.all(numerosFactura.map(num => api.get(`/inventario/factura/${num}`)));
          setModalFacturaMultiple(resArray.map(r => r.data.factura));
        } catch (_) {}
      }, 500);
    }
  };

  const handleReservar = async (item) => {
    try {
      if (item.status === 'Reservado') {
        await api.put('/inventario/cancelar-reserva', { inventory_item_id: item.inventory_item_id });
        handleSuccess('🔓 Reserva cancelada');
      } else {
        const cliente = prompt('Nombre del cliente (opcional):');
        if (cliente === null) return; // cancelado
        await api.put('/inventario/reservar', { inventory_item_id: item.inventory_item_id, cliente: cliente || '' });
        handleSuccess('🔖 Producto reservado');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Error al cambiar reserva');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const verFactura = async (numFactura) => {
    if (!numFactura) return;
    try {
      const res = await api.get(`/inventario/factura/${numFactura}`);
      setModalFactura(res.data.factura);
    } catch (_) {
      setErrorMessage('Factura no encontrada');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const toggleSelectItem = (item) => {
    if (item.status === 'Reservado') return;
    if (selectedItems.find(i => i.inventory_item_id === item.inventory_item_id)) {
      setSelectedItems(selectedItems.filter(i => i.inventory_item_id !== item.inventory_item_id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  // Filtros
  const productosFiltrados = productos.filter(p => {
    const matchSearch = !searchTerm ||
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ebay_order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.guia_logybox?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filtroEstado === 'todos' || p.status === filtroEstado ||
      (filtroEstado === 'estancado' && p.dias_en_inventario > 30);
    return matchSearch && matchEstado;
  });

  const ventasFiltradas = ventas.filter(v => {
    const matchSearch = !searchTerm ||
      v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMes = !mesFiltro || (v.fecha_venta && v.fecha_venta.startsWith(mesFiltro));
    return matchSearch && matchMes;
  });

  const mesesDisponibles = [...new Set(ventas.map(v => v.fecha_venta?.substring(0, 7)).filter(Boolean))].sort().reverse();
  const totalGanancias = ventas.reduce((s, v) => s + parseFloat(v.ganancia || 0), 0);
  const totalIngresos = ventas.reduce((s, v) => s + parseFloat(v.precio_venta || 0), 0);
  const margenPromedio = ventas.length > 0 ? ventas.reduce((s, v) => s + parseFloat(v.margen_porcentaje || 0), 0) / ventas.length : 0;
  
  // Total Inversión = Costo de todo lo vendido + Capital inmovilizado actual
  const costoVentas = ventas.reduce((s, v) => s + parseFloat(v.costo_unitario || 0), 0);
  const totalInversion = parseFloat(estadisticas?.capital_inmovilizado || 0) + costoVentas;

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            Inventario
          </h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md mr-1">{productos.length}</span> en stock · <span className="font-bold ml-1">{ventas.length}</span> vendidos
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={cargarDatos}
            className="p-3 sm:p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-2xl shadow-sm transition-all flex-shrink-0">
            <RefreshCw className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
          <button onClick={() => setModalRecibir(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 text-sm">
            <Package className="w-4 h-4" />
            Recibir Producto
          </button>
        </div>
      </div>

      {/* ── NOTIFICACIONES ── */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0" /><span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-700 dark:text-red-400 font-semibold shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{errorMessage}</span>
        </div>
      )}

      {/* ── STATS (Solo si está cargado) ── */}
      {estadisticas && !loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <StatCard title="Inversión Total" value={fmt(totalInversion)} icon={DollarSign} color="blue" sub="Costo eBay + Logybox" />
          <StatCard title="Total Vendido" value={fmt(totalIngresos)} icon={ShoppingBag} color="purple" sub={`${ventas.length} productos vendidos`} />
          <StatCard title="Ganancia Neta" value={fmt(totalGanancias)} icon={TrendingUp} color="green" sub={`Margen histórico: ${fmtPct(margenPromedio)}`} />
          <StatCard title="Cap. Inmovilizado" value={fmt(estadisticas.capital_inmovilizado)} icon={Archive} color="orange" sub={`${estadisticas.total_productos} unds en stock actual`} />
        </div>
      )}

      {/* ── TABS (Navegación horizontal en móvil) ── */}
      <div className="sticky top-0 z-20 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-xl py-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent sm:py-0 border-b border-gray-200/50 dark:border-gray-800/50 sm:border-none shadow-sm sm:shadow-none">
        <div className="flex overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap gap-2 hide-scrollbar snap-x">
          {[
            { id: 'inventario', label: 'Inventario', shortLabel: 'Stock', icon: Package },
            { id: 'historial', label: 'Historial Ventas', shortLabel: 'Ventas', icon: BookOpen },
            { id: 'ganancias', label: 'Ganancias', shortLabel: 'Finanzas', icon: BarChart2 },
            { id: 'clientes', label: 'Clientes', shortLabel: 'Clientes', icon: Users }
          ].map(({ id, label, shortLabel, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`snap-center flex-shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border shadow-sm
                ${tab === id 
                  ? 'bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900' 
                  : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <Icon className={`w-4 h-4 ${tab === id ? '' : 'opacity-70'}`} />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
             <div className="w-12 h-12 border-4 border-blue-100 dark:border-blue-900/50 rounded-full"></div>
             <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 animate-pulse">Sincronizando inventario...</p>
        </div>
      ) : (
        <div className="animate-fade-in">
          {/* ── TAB: INVENTARIO ── */}
          {tab === 'inventario' && (
            <div className="space-y-4">
              {/* Búsqueda y filtros */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input type="text" placeholder="Buscar por título, orden, LBX..."
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 sm:py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm transition-all" />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="relative flex-shrink-0">
                   <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                     className="w-full sm:w-auto pl-11 pr-10 py-3 sm:py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm appearance-none transition-all">
                     <option value="todos">Todos los estados</option>
                     <option value="Disponible">Disponibles</option>
                     <option value="Reservado">Reservados</option>
                     <option value="estancado">Estancados (+30d)</option>
                   </select>
                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Acciones flotantes de selección múltiple */}
              <div className={`transition-all duration-300 overflow-hidden ${selectedItems.length > 0 ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 shadow-lg flex flex-wrap sm:flex-nowrap justify-between items-center gap-3">
                  <span className="text-white font-bold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-200" />
                    {selectedItems.length} seleccionados
                  </span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => setSelectedItems([])} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-colors">
                      Cancelar
                    </button>
                    <button onClick={() => setModalVentaMultiple(true)}
                      className="flex-1 sm:flex-none px-6 py-2 bg-white text-blue-700 hover:bg-blue-50 text-sm font-black rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2">
                      <ShoppingBag className="w-4 h-4" /> Vender Juntos
                    </button>
                  </div>
                </div>
              </div>

              {productosFiltrados.length === 0 ? (
                <div className="text-center py-20 px-4 bg-white/50 dark:bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 mt-6">
                  <div className="w-20 h-20 mb-4 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                    <SearchX className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No encontramos productos</h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    {searchTerm ? `No hay resultados para "${searchTerm}" en este estado.` : 'Tu inventario está vacío.'}
                  </p>
                </div>
              ) : viewMode === 'list' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
                  {productosFiltrados.map(item => (
                    <ProductCardMobile 
                      key={item.inventory_item_id} 
                      item={item} 
                      selected={!!selectedItems.find(i => i.inventory_item_id === item.inventory_item_id)}
                      onSelect={toggleSelectItem}
                      onPrecios={setModalPrecios}
                      onReservar={handleReservar}
                      onVender={setModalVenta}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden mt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/50">
                        <tr>
                          <th className="px-5 py-4 text-left w-12">
                            <input type="checkbox"
                              checked={productosFiltrados.length > 0 && selectedItems.length === productosFiltrados.filter(p=>p.status!=='Reservado').length}
                              onChange={(e) => setSelectedItems(e.target.checked ? productosFiltrados.filter(p => p.status !== 'Reservado') : [])}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          </th>
                          <th className="px-5 py-4 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Producto</th>
                          <th className="px-5 py-4 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">IDs</th>
                          <th className="px-5 py-4 text-right font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Costo / Precios</th>
                          <th className="px-5 py-4 text-center font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Estado</th>
                          <th className="px-5 py-4 text-right font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {productosFiltrados.map(item => {
                          const isEstancado = item.dias_en_inventario > 30;
                          return (
                          <tr key={item.inventory_item_id}
                            className={`hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors group ${isEstancado ? 'bg-orange-50/20 dark:bg-orange-900/5' : ''}`}>
                            <td className="px-5 py-4">
                              <input type="checkbox" disabled={item.status === 'Reservado'}
                                checked={!!selectedItems.find(i => i.inventory_item_id === item.inventory_item_id)}
                                onChange={() => toggleSelectItem(item)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50" />
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                                  {item.photo_url ? <img src={item.photo_url} alt="" className="w-full h-full object-contain p-1" /> : <Package className="w-5 h-5 text-gray-400" />}
                                </div>
                                <div className="max-w-[250px]">
                                  <p className="font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">{item.title}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                               <div className="flex flex-col gap-1.5">
                                 <span className="font-mono text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1"><Hash className="w-3 h-3"/>{item.ebay_order_id || 'N/A'}</span>
                                 <span className="font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-1.5 py-0.5 rounded w-fit flex items-center gap-1"><MapPin className="w-3 h-3"/>{item.guia_logybox || 'N/A'}</span>
                               </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className="font-black text-gray-900 dark:text-white text-base">{fmt(item.costo_unitario)}</span>
                                <div className="text-[10px] font-bold flex gap-2">
                                  {item.precio_minimo ? <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 rounded">M: {fmt(item.precio_minimo)}</span> : null}
                                  {item.precio_objetivo ? <span className="text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-1.5 rounded">O: {fmt(item.precio_objetivo)}</span> : null}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col items-center gap-1.5">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm ${
                                  item.status === 'Reservado' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800' 
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                }`}>
                                  {item.status === 'Reservado' ? '🔖 Reservado' : '✅ Disponible'}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isEstancado ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                  {isEstancado && <AlertTriangle className="w-2.5 h-2.5 inline mr-1" />}{Math.round(item.dias_en_inventario)} días
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setModalPrecios(item)} title="Definir precios" className="p-2.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-xl transition-all border border-transparent hover:border-sky-100 dark:hover:border-sky-800">
                                  <Tag className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleReservar(item)} title={item.status === 'Reservado' ? 'Cancelar reserva' : 'Reservar'} className={`p-2.5 rounded-xl transition-all border border-transparent ${item.status === 'Reservado' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-100'}`}>
                                  {item.status === 'Reservado' ? <BookmarkX className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setModalVenta(item)} className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center gap-1">
                                  <DollarSign className="w-3.5 h-3.5" /> Vender
                                </button>
                              </div>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: HISTORIAL ── */}
          {tab === 'historial' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input type="text" placeholder="Buscar factura, producto o cliente..."
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 sm:py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 shadow-sm transition-all" />
                    {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="relative flex-shrink-0">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}
                    className="w-full sm:w-auto pl-11 pr-10 py-3 sm:py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 shadow-sm appearance-none transition-all">
                    <option value="">Histórico completo</option>
                    {mesesDisponibles.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Resumen filtrado */}
              {ventasFiltradas.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-800 dark:to-black rounded-2xl p-5 shadow-lg text-white relative overflow-hidden">
                    <ShoppingBag className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10" />
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ventas</p>
                    <p className="text-3xl font-black">{ventasFiltradas.length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ingresos</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{fmt(ventasFiltradas.reduce((s, v) => s + parseFloat(v.precio_venta || 0), 0))}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                    <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Ganancia Neta</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{fmt(ventasFiltradas.reduce((s, v) => s + parseFloat(v.ganancia || 0), 0))}</p>
                  </div>
                </div>
              )}

              {ventasFiltradas.length === 0 ? (
                <div className="text-center py-20 bg-white/50 dark:bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 mt-6">
                  <div className="w-20 h-20 mb-4 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                    <SearchX className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">No hay ventas registradas</p>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Intenta con otros filtros.</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-0 sm:bg-white sm:dark:bg-gray-800 sm:rounded-3xl sm:border sm:border-gray-100 sm:dark:border-gray-700/50 sm:shadow-sm sm:overflow-hidden mt-6">
                  {/* Vista Móvil: Tarjetas */}
                  <div className="sm:hidden space-y-3">
                    {ventasFiltradas.map(v => {
                      const g = parseFloat(v.ganancia || 0);
                      return (
                        <div key={v.id} className="bg-white dark:bg-gray-800 rounded-3xl p-4 border border-gray-100 dark:border-gray-700/50 shadow-sm relative overflow-hidden">
                          {/* Deco lateral para ganancia */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${g >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                          
                          <div className="flex justify-between items-start mb-3 pl-2">
                             <div className="flex items-center gap-2">
                               <span className="font-mono text-[10px] font-black bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-2 py-1 rounded-lg shadow-sm">
                                 FAC-{String(v.numero_factura || '').padStart(4, '0')}
                               </span>
                               <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {fmtDate(v.fecha_venta)}</span>
                             </div>
                             {v.numero_factura && (
                              <button onClick={() => verFactura(v.numero_factura)} className="p-2 bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl hover:bg-sky-100 transition-colors">
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="flex gap-3 pl-2">
                            <div className="w-14 h-14 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center justify-center border border-gray-100 dark:border-gray-600/50 overflow-hidden">
                               {v.photo_url ? <img src={v.photo_url} alt="" className="w-full h-full object-contain p-1" /> : <Package className="w-6 h-6 text-gray-300" />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 leading-snug mb-1">{v.title}</p>
                               <div className="flex items-center gap-1.5 flex-wrap">
                                 <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md flex items-center gap-1"><CreditCard className="w-2.5 h-2.5"/> {v.metodo_pago || 'Efec.'}</span>
                                 <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md flex items-center gap-1"><User className="w-2.5 h-2.5"/> {v.cliente_nombre || 'General'}</span>
                               </div>
                            </div>
                          </div>

                          <div className="mt-4 pl-2 grid grid-cols-2 gap-2 border-t border-gray-100 dark:border-gray-700/50 pt-3">
                             <div>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Venta (Costo: {fmt(v.costo_unitario)})</p>
                               <p className="font-black text-gray-900 dark:text-white text-lg">{fmt(v.precio_venta)}</p>
                             </div>
                             <div className="text-right">
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ganancia</p>
                               <p className={`font-black text-lg ${g >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{g >= 0 ? '+' : ''}{fmt(g)}</p>
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Vista Desktop: Tabla */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/50">
                        <tr>
                          <th className="px-5 py-4 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Factura</th>
                          <th className="px-5 py-4 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Detalle Venta</th>
                          <th className="px-5 py-4 text-right font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Monto / Ganancia</th>
                          <th className="px-5 py-4 text-right font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {ventasFiltradas.map(v => {
                          const g = parseFloat(v.ganancia || 0);
                          return (
                            <tr key={v.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex flex-col gap-1">
                                  <span className="font-mono text-xs font-black bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-2 py-1 rounded-md w-fit shadow-sm">
                                    FAC-{String(v.numero_factura || '').padStart(4, '0')}
                                  </span>
                                  <span className="text-[10px] font-bold text-gray-400">{fmtDate(v.fecha_venta)}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                                    {v.photo_url ? <img src={v.photo_url} alt="" className="w-full h-full object-contain p-1" /> : <Package className="w-5 h-5 text-gray-400" />}
                                  </div>
                                  <div className="min-w-0 max-w-[300px]">
                                    <p className="font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">{v.title}</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded flex items-center gap-1"><User className="w-3 h-3"/> {v.cliente_nombre || 'Cliente General'}</span>
                                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded flex items-center gap-1"><CreditCard className="w-3 h-3"/> {v.metodo_pago || 'Efectivo'}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-2">
                                     <span className="text-xs font-bold text-gray-400 line-through decoration-gray-300">{fmt(v.costo_unitario)}</span>
                                     <span className="text-base font-black text-gray-900 dark:text-white">{fmt(v.precio_venta)}</span>
                                  </div>
                                  <span className={`text-sm font-black px-2 py-0.5 rounded-lg ${g >= 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-red-600 bg-red-50 dark:bg-red-500/10'}`}>
                                    {g >= 0 ? '+' : ''}{fmt(g)} <span className="opacity-60 text-[10px]">({fmtPct(v.margen_porcentaje)})</span>
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right">
                                {v.numero_factura && (
                                  <button onClick={() => verFactura(v.numero_factura)}
                                    className="p-3 text-sky-600 hover:text-white bg-sky-50 hover:bg-sky-500 dark:bg-sky-500/10 dark:hover:bg-sky-600 rounded-xl transition-all shadow-sm">
                                    <Printer className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: GANANCIAS ── */}
          {tab === 'ganancias' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Ingresos Totales" value={fmt(totalIngresos)} icon={DollarSign} color="blue" />
                <StatCard title="Ganancias Totales" value={fmt(totalGanancias)} icon={TrendingUp} color="green" />
                <StatCard title="Margen Promedio" value={fmtPct(margenPromedio)} icon={BarChart2} color="purple" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ventas por mes */}
                {estadisticas?.ventas_por_mes?.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-blue-500" />Evolución Mensual
                    </h3>
                    <div className="space-y-5">
                      {estadisticas.ventas_por_mes.map(m => {
                        const maxGanancia = Math.max(...estadisticas.ventas_por_mes.map(x => parseFloat(x.ganancias)));
                        const pct = maxGanancia > 0 ? (parseFloat(m.ganancias) / maxGanancia) * 100 : 0;
                        return (
                          <div key={m.mes} className="relative z-10">
                            <div className="flex justify-between items-end mb-2">
                              <div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{m.mes}</span>
                                <span className="text-xs font-bold text-gray-400 ml-2 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">{m.unidades} unds</span>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-emerald-500 text-base">{fmt(m.ganancias)}</span>
                                <span className="text-[10px] font-bold text-gray-400 block">de {fmt(m.ingresos)}</span>
                              </div>
                            </div>
                            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-1000 relative" style={{ width: `${pct}%` }}>
                                <div className="absolute inset-0 bg-white/20 w-full animate-shimmer" style={{backgroundImage:'linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)',transform:'skewX(-20deg)'}}></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Top productos */}
                {estadisticas?.top_productos?.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Star className="w-6 h-6 text-amber-500" />Top 5 Rentables
                    </h3>
                    <div className="space-y-4 relative z-10">
                      {estadisticas.top_productos.map((p, i) => (
                        <div key={i} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-2xl border border-gray-100 dark:border-gray-600/30 hover:shadow-md transition-shadow">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-sm flex-shrink-0 ${i === 0 ? 'bg-gradient-to-br from-amber-200 to-yellow-400 text-amber-900' : i === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700' : i === 2 ? 'bg-gradient-to-br from-orange-200 to-orange-300 text-orange-900' : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-600'}`}>
                            {i + 1}
                          </div>
                          <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 p-1 border border-gray-100 dark:border-gray-600/50">
                             {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-contain" /> : <Package className="w-5 h-5 text-gray-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{p.title}</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-1">{fmtDate(p.fecha_venta)}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg">{fmt(p.ganancia)}</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 mr-1">{fmtPct(p.margen_porcentaje)} mgn</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {ventas.length === 0 && (
                <div className="text-center py-20 bg-white/50 dark:bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 mt-6">
                  <div className="w-20 h-20 mb-4 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                    <BarChart2 className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aún no hay ganancias</p>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Registra ventas para ver tus estadísticas.</p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: CLIENTES ── */}
          {tab === 'clientes' && (() => {
            const clientesData = Object.values(ventas.reduce((acc, v) => {
              const nombre = v.cliente_nombre || 'Cliente General';
              if (!acc[nombre]) {
                acc[nombre] = {
                  nombre,
                  telefono: v.cliente_telefono || '',
                  compras: 0,
                  total_gastado: 0,
                  total_ganancia: 0,
                  ultima_compra: v.fecha_venta
                };
              }
              acc[nombre].compras += 1;
              acc[nombre].total_gastado += parseFloat(v.precio_venta || 0);
              acc[nombre].total_ganancia += parseFloat(v.ganancia || 0);
              if (new Date(v.fecha_venta) > new Date(acc[nombre].ultima_compra)) {
                acc[nombre].ultima_compra = v.fecha_venta;
                if (v.cliente_telefono) acc[nombre].telefono = v.cliente_telefono;
              }
              return acc;
            }, {})).sort((a, b) => b.total_gastado - a.total_gastado);

            const clientesFiltrados = clientesData.filter(c =>
              !searchTerm || c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefono.includes(searchTerm)
            );

            return (
              <div className="space-y-6">
                <div className="relative group max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                  <input type="text" placeholder="Buscar cliente..."
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 shadow-sm transition-all" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-3xl p-5 shadow-lg text-white relative overflow-hidden">
                     <Users className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10" />
                     <p className="text-violet-100 text-xs font-bold uppercase tracking-wider mb-1">Clientes Únicos</p>
                     <p className="text-3xl font-black">{clientesData.length}</p>
                   </div>
                   <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                     <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Recurrentes</p>
                     <p className="text-3xl font-black text-gray-900 dark:text-white">{clientesData.filter(c => c.compras > 1).length}</p>
                   </div>
                   <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl p-5 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                     <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Mejor Cliente</p>
                     <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{fmt(clientesData[0]?.total_gastado || 0)}</p>
                   </div>
                </div>

                {clientesFiltrados.length === 0 ? (
                  <div className="text-center py-20 bg-white/50 dark:bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 mt-6">
                    <div className="w-20 h-20 mb-4 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                      <Users className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">No hay clientes</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                     {clientesFiltrados.map((c, i) => (
                       <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                          {i === 0 && <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-[10px] font-black px-3 py-1 rounded-bl-xl z-10">#1 VIP</div>}
                          
                          <div className="flex items-start gap-4 mb-4">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'}`}>
                               {c.nombre.charAt(0).toUpperCase()}
                             </div>
                             <div>
                               <p className="font-bold text-gray-900 dark:text-white text-base leading-tight mb-1">{c.nombre}</p>
                               <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded flex items-center gap-1 w-fit"><Phone className="w-3 h-3"/> {c.telefono || 'Sin teléfono'}</span>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-2xl border border-gray-100 dark:border-gray-600/30">
                             <div>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Inversión Total</p>
                               <p className="font-black text-gray-900 dark:text-white">{fmt(c.total_gastado)}</p>
                             </div>
                             <div className="text-right">
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Ganancia</p>
                               <p className="font-black text-emerald-500">{fmt(c.total_ganancia)}</p>
                             </div>
                          </div>

                          <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-gray-400">
                             <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3"/> {c.compras} compras</span>
                             <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {fmtDate(c.ultima_compra)}</span>
                          </div>
                       </div>
                     ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── MODALES ── */}
      {modalVentaMultiple && (
        <ModalVentaMultiple items={selectedItems} onClose={() => setModalVentaMultiple(false)}
          onSuccess={(numFacturas) => handleSuccessMultiple('✅ Venta múltiple registrada correctamente', numFacturas)} />
      )}
      {modalFacturaMultiple && (
        <FacturaImprimirMultiple facturas={modalFacturaMultiple} onClose={() => setModalFacturaMultiple(null)} />
      )}
      {modalVenta && (
        <ModalVenta item={modalVenta} onClose={() => setModalVenta(null)}
          onSuccess={(numFactura) => handleSuccess('✅ Venta registrada correctamente', numFactura)} />
      )}
      {modalRecibir && (
        <ModalRecibir onClose={() => setModalRecibir(false)}
          onSuccess={() => handleSuccess('✅ Producto recibido en inventario')} />
      )}
      {modalPrecios && (
        <ModalPrecios producto={modalPrecios} onClose={() => setModalPrecios(null)}
          onSuccess={() => handleSuccess('✅ Precios actualizados')} />
      )}
      {modalFactura && (
        <FacturaImprimir factura={modalFactura} onClose={() => setModalFactura(null)} />
      )}

      <style dangerouslySetContent={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
           .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2s infinite; }
      `}} />
    </div>
  );
}