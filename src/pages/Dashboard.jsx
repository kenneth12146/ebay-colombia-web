import { useEffect, useState } from 'react';
import {
  DollarSign,
  Package,
  Truck,
  TrendingUp,
  ShoppingBag,
  Archive,
  Eye,
  EyeOff,
  Activity,
  Award,
  ChevronUp,
  ChevronDown,
  Minus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../lib/axios';

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const fmt = (val, hidden, prefix = '$') =>
  hidden ? '••••••' : `${prefix}${Number(val || 0).toLocaleString('es-CO')}`;

const pct = (val, hidden) => (hidden ? '••' : `${val || 0}%`);

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/* ─────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────── */

const StatCard = ({ title, value, icon: Icon, color, trend, trendText }) => {
  const gradients = {
    blue:   'from-blue-500 to-blue-600 shadow-blue-500/20',
    green:  'from-emerald-400 to-emerald-500 shadow-emerald-500/20',
    purple: 'from-indigo-500 to-purple-600 shadow-purple-500/20',
    orange: 'from-orange-400 to-orange-500 shadow-orange-500/20',
  };

  const textColors = {
    blue:   'text-blue-500 dark:text-blue-400',
    green:  'text-emerald-500 dark:text-emerald-400',
    purple: 'text-purple-500 dark:text-purple-400',
    orange: 'text-orange-500 dark:text-orange-400',
  };

  const bgColors = {
    blue:   'bg-blue-50 dark:bg-blue-500/10',
    green:  'bg-emerald-50 dark:bg-emerald-500/10',
    purple: 'bg-purple-50 dark:bg-purple-500/10',
    orange: 'bg-orange-50 dark:bg-orange-500/10',
  };

  const TrendIcon = trend > 0 ? ChevronUp : trend < 0 ? ChevronDown : Minus;
  const trendColor = trend > 0 
    ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400' 
    : trend < 0 
      ? 'text-red-600 bg-red-100 dark:bg-red-500/20 dark:text-red-400' 
      : 'text-gray-600 bg-gray-100 dark:bg-gray-500/20 dark:text-gray-400';

  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
      {/* Decorative gradient blur in background */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 bg-gradient-to-br ${gradients[color]} transition-opacity group-hover:opacity-40 pointer-events-none`} />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-2xl ${bgColors[color]}`}>
          <Icon className={`w-6 h-6 ${textColors[color]}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
        <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight break-words">{value}</p>
        {trendText && trend !== undefined && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium">{trendText}</p>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   CHART COMPONENT
───────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label, hidden }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-100 dark:border-gray-700 p-4 rounded-2xl shadow-xl z-50 relative">
        <p className="font-bold text-gray-900 dark:text-white mb-3 text-sm">{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-3 text-sm font-medium">
              <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600 dark:text-gray-300">{entry.name}:</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white ml-auto pl-4">
                {fmt(entry.value, hidden)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const DashboardChart = ({ data, hidden }) => {
  if (!data || data.length === 0) return null;
  
  // Format data for chart
  const chartData = data.map(d => {
    const ganancia = (d.vendido || 0) - (d.invertido || 0);
    return {
      name: MONTH_NAMES[(d.mes ?? 1) - 1],
      Invertido: hidden ? 0 : (d.invertido || 0),
      Vendido: hidden ? 0 : (d.vendido || 0),
      Ganancia: hidden ? 0 : ganancia,
    };
  });

  return (
    <div className="h-64 sm:h-80 w-full mt-4 -ml-4 sm:ml-0 relative z-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVendido" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorInvertido" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.1} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={(value) => hidden ? '••' : `$${(value/1000000).toFixed(0)}M`}
            width={50}
          />
          <Tooltip content={<CustomTooltip hidden={hidden} />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
          <Area type="monotone" dataKey="Invertido" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorInvertido)" activeDot={{ r: 6, strokeWidth: 0 }} />
          <Area type="monotone" dataKey="Vendido" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVendido)" activeDot={{ r: 6, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MOBILE FRIENDLY TABLE / LIST FOR MONTHS
───────────────────────────────────────────── */
const MonthlyData = ({ data = [], hidden }) => {
  if (data.length === 0) {
    return <div className="py-8 text-center text-gray-400">Sin datos mensuales</div>;
  }

  return (
    <div className="w-full">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700/50">
              <th className="pb-3 pr-4 font-medium">Mes</th>
              <th className="pb-3 pr-4 font-medium">Invertido</th>
              <th className="pb-3 pr-4 font-medium">Vendido</th>
              <th className="pb-3 font-medium text-right">Ganancia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {data.map((row) => {
              const mes = MONTH_NAMES[(row.mes ?? 1) - 1];
              const ganancia = (row.vendido || 0) - (row.invertido || 0);
              const isPositive = ganancia >= 0;
              return (
                <tr key={row.mes} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                  <td className="py-4 pr-4 font-semibold text-gray-800 dark:text-gray-200">{mes}</td>
                  <td className="py-4 pr-4 font-mono text-gray-600 dark:text-gray-300">
                    {fmt(row.invertido, hidden)}
                  </td>
                  <td className="py-4 pr-4 font-mono text-gray-600 dark:text-gray-300">
                    {fmt(row.vendido, hidden)}
                  </td>
                  <td className={`py-4 font-mono font-bold text-right ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {hidden ? '••••••' : `${isPositive ? '+' : ''}${ganancia.toLocaleString('es-CO')}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile / Tablet Cards */}
      <div className="lg:hidden flex flex-col gap-3">
        {data.map((row) => {
          const mes = MONTH_NAMES[(row.mes ?? 1) - 1];
          const ganancia = (row.vendido || 0) - (row.invertido || 0);
          const isPositive = ganancia >= 0;
          return (
            <div key={row.mes} className="bg-gray-50 dark:bg-gray-700/20 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700/50">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{mes}</span>
                <span className={`text-sm font-bold px-3 py-1.5 rounded-xl ${isPositive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                  {hidden ? '••••••' : `${isPositive ? '+' : ''}${ganancia.toLocaleString('es-CO')}`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
                <div>
                  <p className="text-gray-400 text-xs uppercase font-semibold mb-1">Invertido</p>
                  <p className="font-mono font-semibold text-gray-700 dark:text-gray-300">{fmt(row.invertido, hidden)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase font-semibold mb-1">Vendido</p>
                  <p className="font-mono font-semibold text-gray-700 dark:text-gray-300">{fmt(row.vendido, hidden)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MOBILE FRIENDLY TOP PRODUCTS
───────────────────────────────────────────── */
const TopProductos = ({ items = [], hidden }) => {
  if (items.length === 0) {
    return <div className="py-8 text-center text-gray-400">Sin datos disponibles</div>;
  }

  return (
    <div className="w-full">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700/50">
              <th className="pb-3 pr-4 font-medium w-12">#</th>
              <th className="pb-3 pr-4 font-medium">Producto</th>
              <th className="pb-3 pr-4 font-medium text-center">Unidades</th>
              <th className="pb-3 font-medium text-right">Ingresos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {items.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                <td className="py-3 pr-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : i === 1 ? 'bg-gray-200 text-gray-600 dark:bg-gray-600/40 dark:text-gray-300' : i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'}`}>
                    {i + 1}
                  </div>
                </td>
                <td className="py-3 pr-4 font-medium text-gray-800 dark:text-gray-200">{p.nombre}</td>
                <td className="py-3 pr-4 text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                    {p.unidades}
                  </span>
                </td>
                <td className="py-3 font-mono font-bold text-gray-800 dark:text-gray-100 text-right">
                  {fmt(p.ingresos, hidden)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile / Tablet Cards */}
      <div className="lg:hidden flex flex-col gap-3">
        {items.map((p, i) => (
          <div key={i} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700/20 p-3.5 sm:p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/40">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm ${i === 0 ? 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-800 dark:from-amber-500/40 dark:to-amber-600/40 dark:text-amber-300' : i === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 dark:from-gray-600/40 dark:to-gray-700/40 dark:text-gray-300' : i === 2 ? 'bg-gradient-to-br from-orange-200 to-orange-300 text-orange-800 dark:from-orange-500/40 dark:to-orange-600/40 dark:text-orange-300' : 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 dark:from-blue-500/20 dark:to-blue-600/20 dark:text-blue-400'}`}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm sm:text-base">{p.nombre}</h4>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {p.unidades} un.
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">{fmt(p.ingresos, hidden)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
export default function Dashboard() {
  const [resumen, setResumen]         = useState(null);
  const [mensual, setMensual]         = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [hidden, setHidden]           = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, mensualRes, topRes] = await Promise.allSettled([
          api.get('/dashboard/resumen'),
          api.get('/dashboard/mensual'),
          api.get('/dashboard/top-productos'),
        ]);

        if (dashRes.status === 'fulfilled')   setResumen(dashRes.value.data.resumen);
        if (mensualRes.status === 'fulfilled') setMensual(mensualRes.value.data.meses || []);
        if (topRes.status === 'fulfilled')     setTopProductos(topRes.value.data.productos || []);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-100 dark:border-blue-900 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">Preparando tu dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 w-full max-w-full overflow-x-hidden">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard</h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">Resumen general y rendimiento de tu operación</p>
        </div>
        <button
          onClick={() => setHidden((h) => !h)}
          className="group flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 shadow-sm hover:shadow-md w-full sm:w-auto active:scale-95"
        >
          {hidden ? <Eye className="w-4 h-4 text-blue-500" /> : <EyeOff className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />}
          {hidden ? 'Mostrar Valores' : 'Ocultar Valores'}
        </button>
      </div>

      {/* ── KPIs principales ── */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Invertido"
            value={fmt(resumen?.total_invertido, hidden)}
            icon={DollarSign}
            color="blue"
            trend={resumen?.trend_invertido}
            trendText="vs. mes anterior"
          />
          <StatCard
            title="Total Vendido"
            value={fmt(resumen?.total_vendido, hidden)}
            icon={ShoppingBag}
            color="green"
            trend={resumen?.trend_ventas}
            trendText="vs. mes anterior"
          />
          <StatCard
            title="Ganancia Total"
            value={fmt(resumen?.ganancia_total, hidden)}
            icon={TrendingUp}
            color="purple"
            trend={resumen?.trend_ganancia}
            trendText="vs. mes anterior"
          />
          <StatCard
            title="Capital Inmovilizado"
            value={fmt(resumen?.capital_inmovilizado, hidden)}
            icon={Archive}
            color="orange"
          />
        </div>
      </section>

      {/* ── Main content grid (Charts & Operativo) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Col: Chart & Monthly Data */}
        <div className="xl:col-span-2 space-y-6">
          
          <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-5 sm:p-7 transition-shadow hover:shadow-md overflow-hidden relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-6 h-6 text-indigo-500" />
                  Rendimiento Mensual
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Evolución de inversión y ventas</p>
              </div>
            </div>
            
            {/* Chart Area */}
            <DashboardChart data={mensual} hidden={hidden} />
            
            <div className="mt-8 relative z-10">
              <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Desglose Detallado</h4>
              <MonthlyData data={mensual} hidden={hidden} />
            </div>
          </section>

        </div>

        {/* Right Col: Operativo & Top Products */}
        <div className="space-y-6">

          {/* KPIs Operativos (stacked) */}
          <section className="bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-600 rounded-3xl shadow-lg p-[1px] relative overflow-hidden">
            {/* Inner glow and decorative icon */}
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
              <TrendingUp className="w-40 h-40 text-white" />
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-[23px] p-6 text-white h-full relative z-10">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-100" />
                Estado Operativo
              </h3>
              
              <div className="space-y-4">
                <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/20 transition-all duration-300">
                  <div className="p-3 bg-white/20 rounded-xl shadow-inner">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-indigo-100 text-xs uppercase tracking-wider font-semibold mb-0.5">En Camino</p>
                    <p className="text-2xl font-black">
                      {hidden ? '••' : resumen?.productos_en_camino || 0}
                      <span className="text-sm font-medium text-indigo-200 ml-1.5">unidades</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/20 transition-all duration-300">
                  <div className="p-3 bg-white/20 rounded-xl shadow-inner">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-indigo-100 text-xs uppercase tracking-wider font-semibold mb-0.5">En Inventario</p>
                    <p className="text-2xl font-black">
                      {hidden ? '••' : resumen?.productos_inventario || 0}
                      <span className="text-sm font-medium text-indigo-200 ml-1.5">unidades</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/20 transition-all duration-300">
                  <div className="p-3 bg-white/20 rounded-xl shadow-inner">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-indigo-100 text-xs uppercase tracking-wider font-semibold mb-0.5">Margen Promedio</p>
                    <p className="text-2xl font-black">
                      {pct(resumen?.margen_promedio, hidden)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Top Products */}
          <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-5 sm:p-7 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                <Award className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Ventas</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Productos más rentables</p>
              </div>
            </div>
            <TopProductos items={topProductos} hidden={hidden} />
          </section>

        </div>
      </div>
    </div>
  );
}
