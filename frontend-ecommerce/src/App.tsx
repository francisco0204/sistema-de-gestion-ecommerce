import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- INTERFACES ---
interface Producto { id?: number; nombre: string; precio: number; stock: number; }
interface Venta { id: number; cantidad: number; fecha: string; producto: Producto; }

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState<any>(() => {
    const persistencia = localStorage.getItem('usuario_master');
    try { return persistencia ? JSON.parse(persistencia) : null; } catch { return null; }
  });
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [productoEditandoId, setProductoEditandoId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [vistaActiva, setVistaActiva] = useState<'dashboard' | 'inventario' | 'ventas' | 'perfil'>('dashboard');
  const [isModalAbierto, setIsModalAbierto] = useState(false);
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);

  // ESTADOS PARA LA EDICIÓN DE PERFIL
  const [nuevoNombre, setNuevoNombre] = useState(usuarioLogueado?.nombre || '');
  const [nuevaPassword, setNuevaPassword] = useState('');

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token_master')}`
  });

  // --- SVGS ---
  const IconDash = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  const IconBox = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
  const IconCart = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  const IconPDF = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
  const IconEdit = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
  const IconTrash = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
  const IconArrow = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>;
  const IconUser = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

  // --- LÓGICA DE GUARDADO MEJORADA Y BLINDADA ---
  const manejarGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validamos para que no envíe strings vacíos a Java
    if (!nombre || precio === '' || stock === '') {
      alert("Por favor, completa todos los campos del producto.");
      return;
    }

    const payload = { 
      nombre, 
      precio: parseFloat(precio.toString()), 
      stock: parseInt(stock.toString()), 
      usuario: { id: usuarioLogueado?.id } 
    };
    
    const url = productoEditandoId 
      ? `http://localhost:8080/api/productos/${productoEditandoId}` 
      : 'http://localhost:8080/api/productos';
    
    try {
      const res = await fetch(url, { 
        method: productoEditandoId ? 'PUT' : 'POST', 
        headers: getAuthHeaders(), 
        body: JSON.stringify(payload) 
      });

      if (res.ok) {
        setIsModalAbierto(false);
        setProductoEditandoId(null);
        setNombre('');
        setPrecio('');
        setStock('');
        cargarProductos();
      } else {
        // AQUÍ ESTABA LA FALLA SILENCIOSA. AHORA TE AVISARÁ.
        const errorText = await res.text();
        alert(`Error del Servidor (Código ${res.status}): ${errorText}`);
      }
    } catch (error) {
      alert("Error crítico: No se pudo conectar con el servidor.");
    }
  };

  // --- LOGICA PDF ---
  const exportarReportePDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text("StockMaster - Reporte de Inventario", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);
    autoTable(doc, {
      startY: 35,
      head: [['Producto', 'Precio', 'Stock']],
      body: productos.map(p => [p.nombre, `$${p.precio}`, p.stock]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save("Reporte_StockMaster.pdf");
  };

  const cargarProductos = async () => {
    const res = await fetch('http://localhost:8080/api/productos', { headers: getAuthHeaders() });
    if (res.ok) setProductos(await res.json());
  };

  const cargarVentas = async () => {
    const res = await fetch('http://localhost:8080/api/ventas', { headers: getAuthHeaders() });
    if (res.ok) setVentas(await res.json());
  };

  useEffect(() => {
    if (usuarioLogueado) { cargarProductos(); cargarVentas(); }
  }, [usuarioLogueado]);

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPassword })
    });
    if (res.ok) {
      const data = await res.json();
      setUsuarioLogueado(data.usuario);
      setNuevoNombre(data.usuario.nombre);
      localStorage.setItem('usuario_master', JSON.stringify(data.usuario));
      localStorage.setItem('token_master', data.token);
    } else { alert("Acceso denegado"); }
  };

  const actualizarCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Enviando actualización para:", nuevoNombre);
    try {
      const res = await fetch('http://localhost:8080/api/auth/actualizar', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          nombre: nuevoNombre, 
          password: nuevaPassword 
        })
      });

      if (res.ok) {
        const userActualizado = await res.json();
        setUsuarioLogueado(userActualizado);
        localStorage.setItem('usuario_master', JSON.stringify(userActualizado));
        setNuevaPassword('');
        alert("¡Cuenta actualizada con éxito!");
        setVistaActiva('dashboard');
      } else {
        const txt = await res.text();
        console.error("Detalle del error:", txt);
        alert("Error al actualizar: " + res.status + " - " + txt);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("Error de conexión con el servidor.");
    }
  };

  const totalHoy = ventas.filter(v => new Date(v.fecha).toDateString() === new Date().toDateString()).reduce((acc, v) => acc + (v.producto?.precio || 0) * v.cantidad, 0);
  const stockBajo = productos.filter(p => p.stock > 0 && p.stock < 5).length;
  const agotados = productos.filter(p => p.stock === 0).length;
  const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  if (!usuarioLogueado) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100">
          <div className="text-center mb-10">
            <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-white shadow-xl shadow-indigo-100 mb-6"><IconBox /></div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">StockMaster</h1>
          </div>
          <form onSubmit={manejarLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-indigo-500 font-bold" />
            <input type="password" placeholder="Contraseña" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-indigo-500 font-bold" />
            <button type="submit" className="w-full p-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 cursor-pointer">ENTRAR</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <aside className="w-68 bg-white border-r border-slate-200 flex flex-col hidden md:flex z-10">
        <div className="p-8"><div className="flex items-center gap-3 text-indigo-600 font-black text-xl italic"><IconBox /> StockMaster</div></div>
        <nav className="flex-1 px-4 space-y-2">
          {usuarioLogueado.rol === 'ADMIN' && (
            <button onClick={() => setVistaActiva('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${vistaActiva === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}><IconDash /> Dashboard</button>
          )}
          <button onClick={() => setVistaActiva('inventario')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${vistaActiva === 'inventario' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}><IconBox /> Inventario</button>
          <button onClick={() => setVistaActiva('ventas')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${vistaActiva === 'ventas' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}><IconCart /> Ventas</button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center relative">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{vistaActiva}</h2>
          <div className="flex items-center gap-4">
            {vistaActiva !== 'perfil' && (
              <button onClick={exportarReportePDF} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-slate-900 transition-all cursor-pointer flex items-center gap-2"><IconPDF /> EXPORTAR PDF</button>
            )}
            
            <div className="relative">
              <button onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)} className="flex items-center gap-3 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-2xl transition-all cursor-pointer group">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs">{usuarioLogueado.nombre.charAt(0)}</div>
                <span className="text-xs font-black text-slate-700">{usuarioLogueado.nombre}</span>
              </button>

              {menuPerfilAbierto && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-slate-50 mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</p>
                    <p className="text-xs font-black text-indigo-600 uppercase">{usuarioLogueado.rol}</p>
                  </div>
                  <button onClick={() => { setVistaActiva('perfil'); setMenuPerfilAbierto(false); }} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer transition-all">Configuración de cuenta</button>
                  <button onClick={() => {localStorage.clear(); window.location.reload();}} className="w-full text-left px-4 py-3 text-xs font-black text-red-500 hover:bg-red-50 rounded-xl cursor-pointer transition-all mt-1">Cerrar Sesión</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            
            {/* VISTA DASHBOARD */}
            {vistaActiva === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group">
                    <div>
                        <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-6"><IconCart /></div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ingresos Hoy</p>
                        <h3 className="text-4xl font-black text-slate-800 mt-2">${totalHoy.toLocaleString()}</h3>
                    </div>
                    <button onClick={() => setVistaActiva('ventas')} className="mt-8 text-indigo-600 font-bold text-xs flex items-center gap-2 cursor-pointer hover:underline uppercase tracking-tighter">Ver detalles <IconArrow /></button>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all">
                    <div>
                        <div className="bg-amber-50 text-amber-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-6"><IconBox /></div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Stock Crítico</p>
                        <h3 className="text-4xl font-black text-slate-800 mt-2">{stockBajo}</h3>
                    </div>
                    <button onClick={() => setVistaActiva('inventario')} className="mt-8 text-amber-600 font-bold text-xs flex items-center gap-2 cursor-pointer hover:underline uppercase tracking-tighter">Gestionar Stock <IconArrow /></button>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all">
                    <div>
                        <div className="bg-red-50 text-red-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-6"><IconBox /></div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Agotados</p>
                        <h3 className="text-4xl font-black text-slate-800 mt-2">{agotados}</h3>
                    </div>
                    <span className="mt-8 text-slate-300 font-bold text-xs uppercase">Base de datos al día</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h4 className="font-black text-slate-800 mb-8 uppercase tracking-widest text-sm">Rendimiento Semanal</h4>
                    <div className="flex items-end justify-between h-32 gap-2">
                        {[30, 60, 45, 90, 50, 70, 100].map((h, i) => (
                            <div key={i} className="flex-1 bg-indigo-50 rounded-t-lg relative"><div style={{ height: `${h}%` }} className="bg-indigo-500 w-full rounded-t-lg absolute bottom-0"></div></div>
                        ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center"><h4 className="font-black text-slate-800 uppercase text-sm">Actividad</h4><IconCart /></div>
                    <div className="divide-y divide-slate-50">
                        {ventas.slice(-4).reverse().map(v => (
                            <div key={v.id} className="p-5 px-8 flex justify-between items-center hover:bg-slate-50">
                                <div><p className="font-black text-slate-700 text-sm">{v.producto?.nombre}</p><p className="text-[10px] text-slate-300 font-bold uppercase">{new Date(v.fecha).toLocaleTimeString()}</p></div>
                                <span className="font-black text-emerald-500 text-sm">+${v.producto?.precio}</span>
                            </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VISTA PERFIL */}
            {vistaActiva === 'perfil' && (
              <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8 flex items-center gap-4">
                  <button onClick={() => setVistaActiva('dashboard')} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer text-slate-500">
                    <IconArrow />
                  </button>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Mi Cuenta</h3>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                  <div className="bg-indigo-600 p-10 flex items-center gap-6">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center text-white">
                      <IconUser />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white">{usuarioLogueado.nombre}</h4>
                      <p className="text-indigo-100 font-bold text-sm uppercase tracking-widest">{usuarioLogueado.rol}</p>
                    </div>
                  </div>

                  <form onSubmit={actualizarCuenta} className="p-10 space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                        <input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-indigo-500 font-bold mt-2 transition-all" placeholder="Tu nombre" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Solo lectura)</label>
                        <input type="email" value={usuarioLogueado.email} disabled className="w-full border-2 border-slate-50 bg-slate-50 p-4 rounded-2xl font-bold mt-2 text-slate-400 cursor-not-allowed" />
                      </div>
                      <div className="pt-4 border-t border-slate-50">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                        <input type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-indigo-500 font-bold mt-2 transition-all" placeholder="Dejar en blanco para mantener actual" />
                        <p className="text-[10px] text-slate-400 mt-2 italic font-medium px-1">* Por seguridad, usa al menos 6 caracteres si decides cambiarla.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setVistaActiva('dashboard')} className="flex-1 p-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-xs cursor-pointer hover:bg-slate-100 transition-all">Cancelar</button>
                      <button type="submit" className="flex-1 p-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-indigo-100 cursor-pointer hover:bg-indigo-700 transition-all">Guardar Cambios</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* VISTAS INVENTARIO Y VENTAS */}
            {vistaActiva === 'inventario' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center gap-4">
                  <input type="text" placeholder="Buscar producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 shadow-sm font-bold" />
                  {usuarioLogueado.rol === 'ADMIN' && (
                    <button onClick={() => { setNombre(''); setPrecio(''); setStock(''); setProductoEditandoId(null); setIsModalAbierto(true); }} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-lg hover:bg-indigo-700 uppercase tracking-widest cursor-pointer transition-all">+ Nuevo Producto</button>
                  )}
                </div>
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                  {filtrados.map(prod => (
                    <div key={prod.id} className="p-6 px-8 flex justify-between items-center group hover:bg-slate-50/50 transition-all">
                      <div className="flex-1">
                        <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">{prod.nombre}</h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-emerald-600 font-black text-sm bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">${prod.precio}</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${prod.stock === 0 ? 'text-red-500' : 'text-slate-400'}`}>{prod.stock === 0 ? '● Agotado' : `● ${prod.stock} stock`}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => {
                            fetch(`http://localhost:8080/api/ventas/comprar/${prod.id}?cantidad=1`, { method: 'POST', headers: getAuthHeaders() }).then(res => {
                                if(res.ok) { cargarProductos(); cargarVentas(); }
                            });
                        }} disabled={prod.stock === 0} className="bg-slate-800 text-white py-3 px-8 rounded-xl hover:bg-indigo-600 disabled:opacity-20 text-xs font-black cursor-pointer uppercase transition-all">Vender</button>
                        {usuarioLogueado.rol === 'ADMIN' && (
                          <div className="flex gap-2">
                             <button onClick={() => { setNombre(prod.nombre); setPrecio(prod.precio.toString()); setStock(prod.stock.toString()); setProductoEditandoId(prod.id!); setIsModalAbierto(true); }} className="p-3 text-slate-300 hover:text-indigo-600 bg-slate-50 rounded-xl cursor-pointer transition-all"><IconEdit /></button>
                             <button onClick={() => { if(window.confirm("Borrar?")) fetch(`http://localhost:8080/api/productos/${prod.id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(() => cargarProductos()); }} className="p-3 text-slate-300 hover:text-red-600 bg-slate-50 rounded-xl cursor-pointer transition-all"><IconTrash /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vistaActiva === 'ventas' && (
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <tr><th className="px-8 py-6 font-black uppercase">Referencia</th><th className="px-8 py-6 font-black uppercase">Artículo</th><th className="px-8 py-6 font-black uppercase text-center">Cant.</th><th className="px-8 py-6 font-black uppercase text-right">Total</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-bold uppercase">
                    {ventas.map(v => (
                      <tr key={v.id}>
                        <td className="px-8 py-5 text-slate-300 font-mono italic">#ID-{v.id}</td>
                        <td className="px-8 py-5 text-slate-700">{v.producto?.nombre}</td>
                        <td className="px-8 py-5 text-center text-slate-400">{v.cantidad}</td>
                        <td className="px-8 py-5 text-right font-black text-emerald-500">${v.producto?.precio}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL PRODUCTO */}
      {isModalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95">
            <form onSubmit={manejarGuardar} className="space-y-6">
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">
                {productoEditandoId ? 'Editar' : 'Nuevo'} Producto
              </h3>
              
              <input 
                type="text" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                required 
                className="w-full border-2 border-slate-100 p-5 rounded-2xl outline-none focus:border-indigo-500 font-bold" 
                placeholder="Nombre"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" 
                  step="0.01" 
                  value={precio} 
                  onChange={(e) => setPrecio(e.target.value)} 
                  required 
                  className="border-2 border-slate-100 p-5 rounded-2xl outline-none focus:border-indigo-500 font-bold" 
                  placeholder="Precio"
                />
                <input 
                  type="number" 
                  value={stock} 
                  onChange={(e) => setStock(e.target.value)} 
                  required 
                  className="border-2 border-slate-100 p-5 rounded-2xl outline-none focus:border-indigo-500 font-bold" 
                  placeholder="Stock"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setIsModalAbierto(false); setProductoEditandoId(null); }} 
                  className="flex-1 p-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-xs cursor-pointer hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 p-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-indigo-100 cursor-pointer hover:bg-indigo-700 transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;