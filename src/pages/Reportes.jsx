import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Package,
  Truck,
  Download,
  RefreshCw,
  BarChart3,
  Trophy,
  Archive,
  Eye,
  EyeOff,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Minus,
  Percent,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import * as XLSX from 'xlsx';
import api from '../lib/axios';

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const MESES_NOMBRES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const fmt = (val, hidden, prefix = '$') =>
  hidden ? '••••••' : `${prefix}${parseFloat(val || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtNum = (val, hidden) =>
  hidden ? '••' : Number(val || 0).toLocaleString('es-CO');

/* ─────────────────────────────────────────────
   CUSTOM TOOLTIP PARA GRÁFICO
───────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label, hidden }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-xl z-50">
      <p className="font-black text-gray-900 dark:text-white mb-3 text-sm">{label}</p>
      <div className="space-y-2">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-3 text-sm font-medium">
            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
            <span className="font-mono font-bold text-gray-900 dark:text-white ml-auto pl-4">
              {hidden ? '••••••' : `$${Number(entry.value).toLocaleString('es-CO')}`}
            </span>
          </div>
        ))}
      </div>
      {payload.length >= 2 && !hidden && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
          <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Ganancia</span>
          <span className={`font-mono font-black text-sm px-2 py-0.5 rounded-lg ${(payload.find(p=>p.name==='Ganancia')?.value) >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
            ${(Number(payload.find(p=>p.name==='Ganancia')?.value || 0)).toLocaleString('es-CO')}
          </span>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
const StatCard = ({ title, value, icon: Icon, color, trend, sub }) => {
  const gradients = {
    blue:   'from-blue-500 to-sky-600 shadow-blue-500/20',
    emerald:'from-emerald-400 to-green-500 shadow-emerald-500/20',
    violet: 'from-violet-500 to-purple-600 shadow-purple-500/20',
    amber:  'from-amber-400 to-orange-500 shadow-orange-500/20',
  };
  const iconColors = {
    blue:   'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10',
    emerald:'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
    violet: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10',
    amber:  'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10',
  };

  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-10 bg-gradient-to-br ${gradients[color]} transition-opacity group-hover:opacity-30 pointer-events-none`} />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-2xl ${iconColors[color]}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        {trend !== undefined && trend !== null && (
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

/* ─────────────────────────────────────────────
   ALERTA BADGE
───────────────────────────────────────────── */
const AlertaBadge = ({ alerta }) => {
  const tipos = {
    productos_estancados: { icon: Clock,         color: 'border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-300',  dot: 'bg-amber-500' },
    sin_tracking:         { icon: AlertCircle,   color: 'border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 text-red-800 dark:text-red-300',        dot: 'bg-red-500'   },
    envio_demorado:       { icon: Truck,          color: 'border-orange-200 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-900/10 text-orange-800 dark:text-orange-300', dot: 'bg-orange-500' },
  };
  const cfg = tipos[alerta.tipo] || tipos.sin_tracking;
  const Ic = cfg.icon;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border transition-all hover:shadow-md ${cfg.color}`}>
      <div className={`mt-1 p-1.5 rounded-full bg-white/50 dark:bg-gray-900/50 shadow-sm`}>
         <span className={`block w-2.5 h-2.5 rounded-full ${cfg.dot} animate-pulse`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-snug">{alerta.mensaje}</p>
        {alerta.productos?.length > 0 && (
          <p className="text-xs font-medium opacity-80 mt-1.5 line-clamp-2 bg-white/40 dark:bg-gray-900/40 p-1.5 rounded-lg border border-white/20 dark:border-gray-700/50">
            {alerta.productos.slice(0, 3).map(p => p.title || p.id).join(' • ')}
            {alerta.productos.length > 3 && <span className="font-bold ml-1 italic">+{alerta.productos.length - 3} más</span>}
          </p>
        )}
      </div>
      <Ic className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-60 text-inherit" />
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Reportes() {
  const [resumen, setResumen]                   = useState(null);
  const [comparativo, setComparativo]           = useState([]);
  const [productosRentables, setProductosRentables] = useState([]);
  const [alertas, setAlertas]                   = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [mesesMostrar, setMesesMostrar]         = useState(6);
  const [exportando, setExportando]             = useState(false);
  const [hidden, setHidden]                     = useState(false);
  const [activeTab, setActiveTab]               = useState('grafico'); // 'grafico' | 'tabla'

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resumenRes, compRes, rentablesRes, alertasRes] = await Promise.all([
        api.get('/dashboard/resumen').catch(() => ({ data: { resumen: {} } })),
        api.get(`/dashboard/comparativo?meses=${mesesMostrar}`).catch(() => ({ data: { comparativo: [] } })),
        api.get('/dashboard/productos-rentables?limit=5').catch(() => ({ data: { productos: [] } })),
        api.get('/dashboard/alertas').catch(() => ({ data: { alertas: [] } })),
      ]);

      setResumen(resumenRes.data.resumen || {});

      const chartData = (compRes.data.comparativo || [])
        .map(item => ({
          mes:         MESES_NOMBRES[item.mes - 1],
          Invertido:   parseFloat(item.total_invertido || 0),
          Vendido:     parseFloat(item.total_vendido   || 0),
          Ganancia:    parseFloat(item.ganancia_neta   || 0),
          mes_numero:  item.mes,
          comprados:   item.productos_comprados,
          vendidos:    item.productos_vendidos,
        }))
        .sort((a, b) => a.mes_numero - b.mes_numero);

      setComparativo(chartData);
      setProductosRentables(rentablesRes.data.productos || []);
      setAlertas(alertasRes.data.alertas || []);
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, [mesesMostrar]);

  const exportarExcel = () => {
    setExportando(true);
    try {
      const wb = XLSX.utils.book_new();

      const wsResumen = XLSX.utils.aoa_to_sheet([
        ['MÉTRICA', 'VALOR'],
        ['Total Invertido',      `$${resumen?.total_invertido     || '0'}`],
        ['Total Vendido',        `$${resumen?.total_vendido       || '0'}`],
        ['Ganancia Total',       `$${resumen?.ganancia_total      || '0'}`],
        ['Margen Promedio',      `${resumen?.margen_promedio      || '0'}%`],
        ['Capital Inmovilizado', `$${resumen?.capital_inmovilizado|| '0'}`],
        ['Productos Inventario', resumen?.productos_inventario    || '0'],
        ['En Camino',            resumen?.productos_en_camino     || '0'],
      ]);
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

      const wsComp = XLSX.utils.aoa_to_sheet([
        ['MES', 'INVERTIDO', 'VENDIDO', 'GANANCIA', 'COMPRADOS', 'VENDIDOS'],
        ...comparativo.map(c => [c.mes, c.Invertido, c.Vendido, c.Ganancia, c.comprados, c.vendidos]),
      ]);
      XLSX.utils.book_append_sheet(wb, wsComp, 'Comparativo');

      const wsTop = XLSX.utils.aoa_to_sheet([
        ['PRODUCTO', 'GANANCIA', 'MARGEN %'],
        ...productosRentables.map(p => [p.title, p.ganancia, p.margen_porcentaje]),
      ]);
      XLSX.utils.book_append_sheet(wb, wsTop, 'Top Productos');

      XLSX.writeFile(wb, `reporte_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Error exportando:', err);
    } finally {
      setExportando(false);
    }
  };

  /* ── LOADING ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-100 dark:border-blue-900/50 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 animate-pulse">Generando reportes financieros...</p>
      </div>
    );
  }

  const totalGanancia = comparativo.reduce((acc, m) => acc + m.Ganancia, 0);
  const totalInvertidoHistorico = comparativo.reduce((acc, m) => acc + m.Invertido, 0);
  const totalVendidoHistorico = comparativo.reduce((acc, m) => acc + m.Vendido, 0);
  const mejorMes = comparativo.reduce((best, m) => m.Ganancia > (best?.Ganancia ?? -Infinity) ? m : best, null);

  /* ── RENDER ── */
  return (
    <div className="space-y-6 sm:space-y-8 pb-20 sm:pb-8 w-full max-w-full overflow-x-hidden">

      {/* ── HEADER & CONTROLS ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">Reportes</h2>
          <p className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 flex items-center gap-2">
            Visión analítica y financiera <BarChart3 className="w-4 h-4 text-blue-500" />
          </p>
        </div>
        
        {/* Controles Flotantes/Sticky en Móvil */}
        <div className="sticky top-0 z-20 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-xl py-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent sm:py-0 border-b border-gray-200/50 dark:border-gray-800/50 sm:border-none shadow-sm sm:shadow-none flex items-center gap-2 overflow-x-auto hide-scrollbar snap-x">
          {/* Selector meses */}
          <div className="relative flex-shrink-0 snap-start">
            <select
              value={mesesMostrar}
              onChange={(e) => setMesesMostrar(parseInt(e.target.value))}
              className="pl-4 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none transition-all"
            >
              <option value={1}>Último mes</option>
              <option value={3}>Últimos 3 meses</option>
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Último año</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Ocultar montos */}
          <button
            onClick={() => setHidden(h => !h)}
            className="flex-shrink-0 snap-start flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95"
          >
            {hidden ? <Eye className="w-4 h-4 text-blue-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
            <span className="hidden sm:inline">{hidden ? 'Mostrar' : 'Ocultar'}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={cargarDatos}
            className="flex-shrink-0 snap-start p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-500 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Export */}
          <button
            onClick={exportarExcel}
            disabled={exportando}
            className="flex-shrink-0 snap-start flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-60 text-white rounded-2xl text-sm font-black transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{exportando ? 'Exportando...' : 'Excel'}</span>
          </button>
        </div>
      </div>

      {/* ── KPI GRID ── */}
      {resumen && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <StatCard
            title="Invertido"
            value={fmt(resumen.total_invertido, hidden)}
            icon={DollarSign}
            color="blue"
            trend={resumen.trend_invertido}
          />
          <StatCard
            title="Vendido"
            value={fmt(resumen.total_vendido, hidden)}
            icon={ShoppingBag}
            color="emerald"
            trend={resumen.trend_ventas}
          />
          <StatCard
            title="Ganancia"
            value={fmt(resumen.ganancia_total, hidden)}
            icon={TrendingUp}
            color="violet"
            trend={resumen.trend_ganancia}
          />
          <StatCard
            title="Margen Prom."
            value={hidden ? '••%' : `${parseFloat(resumen.margen_promedio || 0).toFixed(1)}%`}
            icon={Percent}
            color="amber"
            sub={mejorMes ? `Pico en: ${mejorMes.mes}` : undefined}
          />
        </div>
      )}

      {/* ── GRÁFICO + TABLA ── */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm animate-fade-in">
        {/* Tab bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 pt-5 pb-0 border-b border-gray-100 dark:border-gray-700/50 gap-4">
          <div className="flex items-center gap-2 px-2 sm:px-0">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              <BarChart3 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Balance General</h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Evolución de inversión vs ingresos</p>
            </div>
          </div>
          <div className="flex bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl w-fit mx-auto sm:mx-0 mb-4 sm:mb-2">
            {['grafico', 'tabla'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab === 'grafico' ? 'Gráfico' : 'Tabla'}
              </button>
            ))}
          </div>
        </div>

        {/* Gráfico */}
        {activeTab === 'grafico' && (
          <div className="p-4 sm:p-6">
            <div className="h-64 sm:h-80 w-full mt-4 -ml-4 sm:ml-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={comparativo} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradInv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradVen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.1} vertical={false} />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickFormatter={v => hidden ? '••' : `$${(v/1000000).toFixed(0)}M`} width={50} />
                  <Tooltip content={<CustomTooltip hidden={hidden} />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="Invertido" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#gradInv)" activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="Vendido" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#gradVen)" activeDot={{ r: 6, strokeWidth: 0 }} />
                  {/* Invisible line for tooltip to show Ganancia */}
                  <Area type="monotone" dataKey="Ganancia" stroke="none" fill="none" activeDot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tabla detallada */}
        {activeTab === 'tabla' && (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/20">
                  <th className="px-5 py-4">Mes</th>
                  <th className="px-5 py-4 text-right">Invertido</th>
                  <th className="px-5 py-4 text-right">Vendido</th>
                  <th className="px-5 py-4 text-right">Ganancia</th>
                  <th className="px-5 py-4 text-center">Unidades (C / V)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {comparativo.map(row => {
                  const isPos = row.Ganancia >= 0;
                  return (
                    <tr key={row.mes} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="px-5 py-4 font-bold text-gray-900 dark:text-white">{row.mes}</td>
                      <td className="px-5 py-4 text-right font-mono font-medium text-gray-600 dark:text-gray-300">{fmt(row.Invertido, hidden)}</td>
                      <td className="px-5 py-4 text-right font-mono font-medium text-gray-600 dark:text-gray-300">{fmt(row.Vendido, hidden)}</td>
                      <td className={`px-5 py-4 text-right font-mono font-black ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                        {hidden ? '••••••' : `${isPos ? '+' : ''}${row.Ganancia.toLocaleString('es-CO')}`}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md font-bold text-xs">{fmtNum(row.comprados, hidden)}</span>
                           <span className="text-gray-300 dark:text-gray-600">/</span>
                           <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md font-bold text-xs">{fmtNum(row.vendidos, hidden)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
                <tr className="font-black text-gray-900 dark:text-white">
                  <td className="px-5 py-4">Total</td>
                  <td className="px-5 py-4 text-right font-mono">{fmt(totalInvertidoHistorico, hidden)}</td>
                  <td className="px-5 py-4 text-right font-mono">{fmt(totalVendidoHistorico, hidden)}</td>
                  <td className={`px-5 py-4 text-right font-mono ${totalGanancia >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {hidden ? '••••••' : `${totalGanancia >= 0 ? '+' : ''}${totalGanancia.toLocaleString('es-CO')}`}
                  </td>
                  <td className="px-5 py-4 text-center">
                     <span className="text-xs text-gray-500 dark:text-gray-400">
                       {fmtNum(comparativo.reduce((a,r)=>a+(r.comprados||0),0), hidden)} c. / {fmtNum(comparativo.reduce((a,r)=>a+(r.vendidos||0),0), hidden)} v.
                     </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── DOS COLUMNAS: TOP PRODUCTOS + ALERTAS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Productos */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/50 p-5 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-500/20 rounded-xl shadow-inner">
                <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">Más Rentables</h3>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Productos estrella del periodo</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full">Top {productosRentables.length}</span>
          </div>

          {productosRentables.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30">
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 dark:border-gray-700">
                <Package className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="font-bold text-gray-900 dark:text-white">Aún no hay top de ventas</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Las métricas aparecerán cuando registres ventas exitosas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {productosRentables.map((p, i) => {
                const maxGan = parseFloat(productosRentables[0]?.ganancia || 1);
                const barPct = Math.round((parseFloat(p.ganancia || 0) / maxGan) * 100);
                return (
                  <div key={p.id || i} className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/20 border border-gray-100 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-lg sm:text-xl shadow-sm flex-shrink-0
                      ${i === 0 ? 'bg-gradient-to-br from-amber-200 to-yellow-400 text-amber-900' 
                      : i === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 dark:from-gray-600/50 dark:to-gray-500/50 dark:text-white' 
                      : i === 2 ? 'bg-gradient-to-br from-orange-200 to-orange-300 text-orange-900' 
                      : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white truncate text-sm sm:text-base">{p.title}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full rounded-full transition-all duration-1000 ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-gray-400 dark:bg-gray-300' : i === 2 ? 'bg-orange-400' : 'bg-blue-400'}`} style={{ width: `${barPct}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 w-12 text-right">{hidden ? '••%' : `${parseFloat(p.margen_porcentaje||0).toFixed(0)}% mgn`}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm sm:text-base bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
                        {hidden ? '••••••' : `+${parseFloat(p.ganancia||0).toLocaleString('es-CO')}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alertas */}
        <div className="bg-gradient-to-br from-gray-900 to-black dark:from-gray-800 dark:to-black rounded-3xl p-[1px] shadow-lg relative overflow-hidden h-full">
           <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
             <AlertTriangle className="w-48 h-48 text-white transform rotate-12" />
           </div>
           
           <div className="bg-white dark:bg-gray-800 h-full rounded-[23px] p-5 sm:p-7 relative z-10 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-100 dark:bg-red-500/20 rounded-xl shadow-inner">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">Alertas Activas</h3>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Atención requerida</p>
                  </div>
                </div>
                {alertas.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-black border border-red-100 dark:border-red-900/30 shadow-sm animate-pulse">
                    {alertas.length}
                  </span>
                )}
              </div>

              {alertas.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-emerald-600 dark:text-emerald-500">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                     <CheckCircle className="w-8 h-8" />
                  </div>
                  <p className="font-black text-lg">¡Todo en orden!</p>
                  <p className="text-sm font-medium text-emerald-600/70 dark:text-emerald-400/70 mt-1">No hay alertas operativas.</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                  {alertas.map((alerta, i) => (
                    <AlertaBadge key={i} alerta={alerta} />
                  ))}
                </div>
              )}
           </div>
        </div>
      </div>

      {/* ── RESUMEN OPERATIVO FOOTER ── */}
      {resumen && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
          {[
            { label: 'Capital Inmovilizado', value: fmt(resumen.capital_inmovilizado, hidden), icon: Archive, bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400' },
            { label: 'Stock Físico',         value: `${fmtNum(resumen.productos_inventario, hidden)} uds`, icon: Package, bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
            { label: 'En Tránsito (MIA-COL)', value: `${fmtNum(resumen.productos_en_camino, hidden)} uds`,  icon: Truck,   bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
          ].map(({ label, value, icon: Ic, bg, text }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4 sm:p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`p-3 rounded-xl ${bg}`}>
                <Ic className={`w-5 h-5 ${text}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="font-black text-gray-900 dark:text-white text-lg sm:text-xl font-mono">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estilos adicionales */}
      <style dangerouslySetContent={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
      `}} />
    </div>
  );
}