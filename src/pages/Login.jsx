import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, LogIn, Headphones, ArrowRight, Sun, Moon } from 'lucide-react';
import api from '../lib/axios';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { username, password });
      
      // Guardar token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirigir al dashboard
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 relative overflow-hidden transition-colors duration-300 p-4 sm:p-6 lg:p-8">
      {/* Botón de cambio de tema */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 p-2.5 sm:p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full shadow-lg text-gray-600 dark:text-gray-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors border border-gray-200/50 dark:border-gray-700/50"
        title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      >
        {isDark ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
      </button>

      {/* Background decorations - Ajustados para móvil */}
      <div className="absolute top-[-10%] left-[-10%] w-64 sm:w-96 h-64 sm:h-96 bg-sky-500/30 dark:bg-sky-600/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-2xl sm:blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-64 sm:w-96 h-64 sm:h-96 bg-indigo-500/30 dark:bg-indigo-600/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-2xl sm:blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/30 dark:bg-blue-600/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-2xl sm:blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-5xl flex flex-col lg:flex-row rounded-[2rem] shadow-2xl overflow-hidden bg-white/95 dark:bg-gray-800/95 relative z-10 border border-white/20 dark:border-gray-700/50 backdrop-blur-xl">
        {/* Left Side - Branding (Hidden on small, visible on lg) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-600 to-indigo-900 p-12 flex-col justify-between relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-inner">
              <Headphones className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-wider">Marlon Audio</span>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold mb-6 leading-tight">
              Control <br/>
              Inteligente <br/>
              de Compras.
            </h2>
            <p className="text-sky-100 text-lg max-w-sm leading-relaxed">
              Gestiona tu inventario, sincroniza con eBay y mantén el control total de tu negocio en un solo lugar.
            </p>
          </div>
          
          <div className="relative z-10 text-sm text-sky-200/80 font-medium">
            &copy; {new Date().getFullYear()} Marlon Audio. Todos los derechos reservados.
          </div>
        </div>

        {/* Right Side - Form (Visible on all sizes, full width on small) */}
        <div className="w-full lg:w-1/2 p-6 sm:p-10 md:p-12 flex flex-col justify-center transition-colors duration-300">
          {/* Header móvil */}
          <div className="lg:hidden flex flex-col items-center justify-center gap-4 mb-8 pt-4">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">Marlon Audio</h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">Sistema de Control de Compras</p>
            </div>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">¡Bienvenido!</h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Ingresa tus credenciales para acceder.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                Usuario
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 sm:py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="Escribe tu usuario"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 sm:py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center gap-2 animate-pulse">
                <span className="font-semibold">Error:</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 mt-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none text-sm sm:text-base active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 lg:hidden text-center text-xs text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Marlon Audio. <br/>Todos los derechos reservados.
          </div>
        </div>
      </div>
      
      {/* Estilos para animación de fondo */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}