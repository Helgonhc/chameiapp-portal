(()=>{var e={};e.id=64,e.ids=[64],e.modules={47849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},25528:e=>{"use strict";e.exports=require("next/dist\\client\\components\\action-async-storage.external.js")},91877:e=>{"use strict";e.exports=require("next/dist\\client\\components\\request-async-storage.external.js")},25319:e=>{"use strict";e.exports=require("next/dist\\client\\components\\static-generation-async-storage.external.js")},48584:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>l.a,__next_app__:()=>m,originalPathname:()=>x,pages:()=>c,routeModule:()=>h,tree:()=>o});var a=s(50482),r=s(69108),n=s(62563),l=s.n(n),i=s(68300),d={};for(let e in i)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>i[e]);s.d(t,d);let o=["",{children:["appointments",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,17983)),"D:\\Projeto\\chameiapp\\client-portal\\app\\appointments\\page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,82917)),"D:\\Projeto\\chameiapp\\client-portal\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,69361,23)),"next/dist/client/components/not-found-error"]}],c=["D:\\Projeto\\chameiapp\\client-portal\\app\\appointments\\page.tsx"],x="/appointments/page",m={require:s,loadChunk:()=>Promise.resolve()},h=new a.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/appointments/page",pathname:"/appointments",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:o}})},36766:(e,t,s)=>{Promise.resolve().then(s.bind(s,12821))},12821:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>p});var a=s(95344),r=s(3729),n=s(22254),l=s(72829),i=s(25545),d=s(7060),o=s(66138),c=s(73229),x=s(55794),m=s(51838),h=s(45023);function p(){let e=(0,n.useRouter)(),[t,s]=(0,r.useState)(!0),[p,y]=(0,r.useState)([]),[u,g]=(0,r.useState)("all");async function b(){let{data:{user:t}}=await l.O.auth.getUser();t||e.push("/login")}async function k(){try{let{data:{user:e}}=await l.O.auth.getUser();if(!e)return;let{data:t,error:s}=await l.O.from("appointment_requests").select(`
          *,
          technician:profiles!appointment_requests_technician_id_fkey(full_name)
        `).order("created_at",{ascending:!1});if(s)throw s;y(t||[])}catch(e){console.error("Erro ao carregar agendamentos:",e)}finally{s(!1)}}function f(e){return({pending:"bg-yellow-100 text-yellow-800 border-yellow-200",confirmed:"bg-green-100 text-green-800 border-green-200",rescheduled:"bg-blue-100 text-blue-800 border-blue-200",completed:"bg-gray-100 text-gray-800 border-gray-200",cancelled:"bg-red-100 text-red-800 border-red-200"})[e]||"bg-gray-100 text-gray-800 border-gray-200"}(0,r.useEffect)(()=>{b(),k()},[]);let j="all"===u?p:p.filter(e=>e.status===u);return t?a.jsx(h.Z,{children:a.jsx("div",{className:"flex items-center justify-center h-full bg-gray-50",children:(0,a.jsxs)("div",{className:"text-center",children:[a.jsx("div",{className:"animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"}),a.jsx("p",{className:"text-sm font-medium text-gray-600",children:"Carregando agendamentos..."})]})})}):a.jsx(h.Z,{children:(0,a.jsxs)("div",{className:"min-h-screen bg-gray-50",children:[a.jsx("div",{className:"bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-12 shadow-lg",children:a.jsx("div",{className:"max-w-7xl mx-auto",children:(0,a.jsxs)("div",{className:"flex items-center justify-between",children:[(0,a.jsxs)("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 bg-white bg-opacity-20 rounded-lg",children:a.jsx(x.Z,{className:"w-6 h-6 text-white"})}),(0,a.jsxs)("div",{children:[a.jsx("h1",{className:"text-4xl font-bold text-white",children:"Agendamentos"}),(0,a.jsxs)("p",{className:"text-emerald-100 text-lg mt-1",children:[p.length," agendamento",1!==p.length?"s":""," no total"]})]})]}),(0,a.jsxs)("button",{onClick:()=>e.push("/appointments/new"),className:"px-6 py-4 bg-white text-emerald-600 rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2",children:[a.jsx(m.Z,{className:"w-5 h-5"}),a.jsx("span",{className:"hidden sm:inline",children:"Novo Agendamento"}),a.jsx("span",{className:"sm:hidden",children:"Novo"})]})]})})}),(0,a.jsxs)("div",{className:"max-w-7xl mx-auto px-8 -mt-8 pb-8",children:[a.jsx("div",{className:"flex flex-wrap justify-center gap-3 mb-6",children:[{key:"all",label:"Todos",count:p.length,icon:"\uD83D\uDCC5"},{key:"pending",label:"Pendentes",count:p.filter(e=>"pending"===e.status).length,icon:"⏳"},{key:"confirmed",label:"Confirmados",count:p.filter(e=>"confirmed"===e.status).length,icon:"✅"}].map(e=>(0,a.jsxs)("button",{onClick:()=>g(e.key),className:`px-5 py-3 rounded-xl font-semibold transition-all whitespace-nowrap shadow-sm ${u===e.key?"bg-white text-emerald-600 shadow-lg border-2 border-emerald-200":"bg-white text-gray-600 hover:bg-white hover:shadow-md border-2 border-transparent"}`,children:[a.jsx("span",{className:"mr-2",children:e.icon}),e.label," (",e.count,")"]},e.key))}),a.jsx("div",{className:"space-y-6",children:0===j.length?(0,a.jsxs)("div",{className:"bg-white rounded-2xl shadow-lg border border-gray-200 p-20 text-center",children:[a.jsx("div",{className:"inline-flex p-6 bg-emerald-100 rounded-full mb-6",children:a.jsx(x.Z,{className:"w-16 h-16 text-emerald-600"})}),a.jsx("p",{className:"text-2xl font-bold text-gray-700 mb-3",children:"Nenhum agendamento encontrado"}),a.jsx("p",{className:"text-gray-500 mb-8",children:"all"===u?"Crie seu primeiro agendamento":"Nenhum agendamento com este status"}),(0,a.jsxs)("button",{onClick:()=>e.push("/appointments/new"),className:"inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all",children:[a.jsx(m.Z,{className:"w-5 h-5"}),"Novo Agendamento"]})]}):j.map(e=>{var t,s;return(0,a.jsxs)("div",{className:"bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-2xl transition-all",children:[a.jsx("div",{className:"flex items-start justify-between mb-4",children:(0,a.jsxs)("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:`w-12 h-12 rounded-xl flex items-center justify-center ${f(e.status)}`,children:(t=e.status,({pending:a.jsx(i.Z,{className:"w-5 h-5"}),confirmed:a.jsx(d.Z,{className:"w-5 h-5"}),rescheduled:a.jsx(o.Z,{className:"w-5 h-5"}),completed:a.jsx(d.Z,{className:"w-5 h-5"}),cancelled:a.jsx(c.Z,{className:"w-5 h-5"})})[t]||a.jsx(i.Z,{className:"w-5 h-5"}))}),(0,a.jsxs)("div",{children:[a.jsx("div",{className:"flex items-center gap-2 mb-1",children:a.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${f(e.status)}`,children:{pending:"Aguardando Confirma\xe7\xe3o",confirmed:"Confirmado",rescheduled:"Reagendado",completed:"Realizado",cancelled:"Cancelado"}[s=e.status]||s})}),a.jsx("h3",{className:"text-lg font-bold text-gray-900",children:e.service_type||"Visita T\xe9cnica"})]})]})}),e.description&&a.jsx("p",{className:"text-gray-600 mb-4",children:e.description}),(0,a.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mb-4",children:[(0,a.jsxs)("div",{className:"flex items-center gap-2 text-sm",children:[a.jsx(x.Z,{className:"w-4 h-4 text-gray-400"}),(0,a.jsxs)("div",{children:[a.jsx("p",{className:"text-gray-500",children:"Data Solicitada"}),(0,a.jsxs)("p",{className:"font-semibold text-gray-900",children:[new Date(e.requested_date).toLocaleDateString("pt-BR")," \xe0s ",e.requested_time_start]})]})]}),e.confirmed_date&&(0,a.jsxs)("div",{className:"flex items-center gap-2 text-sm",children:[a.jsx(d.Z,{className:"w-4 h-4 text-green-500"}),(0,a.jsxs)("div",{children:[a.jsx("p",{className:"text-gray-500",children:"Data Confirmada"}),(0,a.jsxs)("p",{className:"font-semibold text-green-600",children:[new Date(e.confirmed_date).toLocaleDateString("pt-BR")," \xe0s ",e.confirmed_time_start]})]})]})]}),e.technician&&a.jsx("div",{className:"flex items-center gap-2 text-sm text-gray-600 mb-4",children:(0,a.jsxs)("span",{children:["\uD83D\uDC64 T\xe9cnico: ",e.technician.full_name]})}),e.technician_notes&&(0,a.jsxs)("div",{className:"bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4",children:[a.jsx("p",{className:"text-sm font-semibold text-blue-900 mb-1",children:"Observa\xe7\xf5es do T\xe9cnico:"}),a.jsx("p",{className:"text-sm text-blue-800",children:e.technician_notes})]}),e.cancellation_reason&&(0,a.jsxs)("div",{className:"bg-red-50 border border-red-200 rounded-xl p-4",children:[a.jsx("p",{className:"text-sm font-semibold text-red-900 mb-1",children:"Motivo do Cancelamento:"}),a.jsx("p",{className:"text-sm text-red-800",children:e.cancellation_reason})]})]},e.id)})})]})]})})}},69224:(e,t,s)=>{"use strict";s.d(t,{Z:()=>l});var a=s(3729),r={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),l=(e,t)=>{let s=(0,a.forwardRef)(({color:s="currentColor",size:l=24,strokeWidth:i=2,absoluteStrokeWidth:d,className:o="",children:c,...x},m)=>(0,a.createElement)("svg",{ref:m,...r,width:l,height:l,stroke:s,strokeWidth:d?24*Number(i)/Number(l):i,className:["lucide",`lucide-${n(e)}`,o].join(" "),...x},[...t.map(([e,t])=>(0,a.createElement)(e,t)),...Array.isArray(c)?c:[c]]));return s.displayName=`${e}`,s}},66138:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("AlertCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]])},33037:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]])},91700:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("Building2",[["path",{d:"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",key:"1b4qmf"}],["path",{d:"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",key:"i71pzd"}],["path",{d:"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",key:"10jefs"}],["path",{d:"M10 6h4",key:"1itunk"}],["path",{d:"M10 10h4",key:"tcdvrf"}],["path",{d:"M10 14h4",key:"kelpxr"}],["path",{d:"M10 18h4",key:"1ulq68"}]])},80958:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("CalendarDays",[["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",ry:"2",key:"eu3xkr"}],["line",{x1:"16",x2:"16",y1:"2",y2:"6",key:"m3sa8f"}],["line",{x1:"8",x2:"8",y1:"2",y2:"6",key:"18kwsl"}],["line",{x1:"3",x2:"21",y1:"10",y2:"10",key:"xt86sb"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M8 18h.01",key:"lrp35t"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M16 18h.01",key:"kzsmim"}]])},55794:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("Calendar",[["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",ry:"2",key:"eu3xkr"}],["line",{x1:"16",x2:"16",y1:"2",y2:"6",key:"m3sa8f"}],["line",{x1:"8",x2:"8",y1:"2",y2:"6",key:"18kwsl"}],["line",{x1:"3",x2:"21",y1:"10",y2:"10",key:"xt86sb"}]])},7060:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("CheckCircle",[["path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14",key:"g774vq"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]])},25545:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]])},48411:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("DollarSign",[["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}],["path",{d:"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",key:"1b0p4s"}]])},37121:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("FileText",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["line",{x1:"16",x2:"8",y1:"13",y2:"13",key:"14keom"}],["line",{x1:"16",x2:"8",y1:"17",y2:"17",key:"17nazh"}],["line",{x1:"10",x2:"8",y1:"9",y2:"9",key:"1a5vjj"}]])},72086:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("Home",[["path",{d:"m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"y5dka4"}],["polyline",{points:"9 22 9 12 15 12 15 22",key:"e2us08"}]])},48120:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]])},98200:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]])},35851:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("MessageCircle",[["path",{d:"m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z",key:"v2veuj"}]])},51838:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]])},76196:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("Ticket",[["path",{d:"M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z",key:"qn84l0"}],["path",{d:"M13 5v2",key:"dyzc3o"}],["path",{d:"M13 17v2",key:"1ont0d"}],["path",{d:"M13 11v2",key:"1wjjxi"}]])},18822:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]])},73229:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("XCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]])},14513:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]])},17983:(e,t,s)=>{"use strict";s.r(t),s.d(t,{$$typeof:()=>n,__esModule:()=>r,default:()=>l});let a=(0,s(86843).createProxy)(String.raw`D:\Projeto\chameiapp\client-portal\app\appointments\page.tsx`),{__esModule:r,$$typeof:n}=a,l=a.default}};var t=require("../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),a=t.X(0,[869,837,404],()=>s(48584));module.exports=a})();