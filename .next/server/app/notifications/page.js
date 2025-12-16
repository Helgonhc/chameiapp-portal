(()=>{var e={};e.id=193,e.ids=[193],e.modules={47849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},25528:e=>{"use strict";e.exports=require("next/dist\\client\\components\\action-async-storage.external.js")},91877:e=>{"use strict";e.exports=require("next/dist\\client\\components\\request-async-storage.external.js")},25319:e=>{"use strict";e.exports=require("next/dist\\client\\components\\static-generation-async-storage.external.js")},52857:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>l.a,__next_app__:()=>x,originalPathname:()=>m,pages:()=>c,routeModule:()=>h,tree:()=>d});var a=s(50482),r=s(69108),i=s(62563),l=s.n(i),n=s(68300),o={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>n[e]);s.d(t,o);let d=["",{children:["notifications",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,57125)),"D:\\Projeto\\chameiapp\\client-portal\\app\\notifications\\page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,82917)),"D:\\Projeto\\chameiapp\\client-portal\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,69361,23)),"next/dist/client/components/not-found-error"]}],c=["D:\\Projeto\\chameiapp\\client-portal\\app\\notifications\\page.tsx"],m="/notifications/page",x={require:s,loadChunk:()=>Promise.resolve()},h=new a.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/notifications/page",pathname:"/notifications",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},47919:(e,t,s)=>{Promise.resolve().then(s.bind(s,10657))},10657:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>g});var a=s(95344),r=s(3729),i=s(22254),l=s(72829),n=s(37121),o=s(66138),d=s(69224);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let c=(0,d.Z)("CheckCheck",[["path",{d:"M18 6 7 17l-5-5",key:"116fxf"}],["path",{d:"m22 10-7.5 7.5L13 16",key:"ke71qq"}]]);var m=s(48411),x=s(62312);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let h=(0,d.Z)("MessageSquare",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]]);var p=s(33037),u=s(38271),y=s(45023);function g(){let e=(0,i.useRouter)(),[t,s]=(0,r.useState)(!0),[d,g]=(0,r.useState)([]),[f,b]=(0,r.useState)("all");async function k(){let{data:{user:t}}=await l.O.auth.getUser();t||e.push("/login")}async function w(){try{let{data:{user:e}}=await l.O.auth.getUser();if(!e)return;let{data:t,error:s}=await l.O.from("notifications").select("*").eq("user_id",e.id).order("created_at",{ascending:!1}).limit(50);if(s)throw s;g(t||[])}catch(e){console.error("Erro ao carregar notifica\xe7\xf5es:",e)}finally{s(!1)}}async function j(e){try{let{error:t}=await l.O.from("notifications").update({is_read:!0,read_at:new Date().toISOString()}).eq("id",e);if(t)throw t;await w()}catch(e){console.error("Erro ao marcar como lida:",e)}}async function v(){try{let{data:{user:e}}=await l.O.auth.getUser();if(!e)return;let{error:t}=await l.O.from("notifications").update({is_read:!0,read_at:new Date().toISOString()}).eq("user_id",e.id).eq("is_read",!1);if(t)throw t;await w()}catch(e){console.error("Erro ao marcar todas como lidas:",e)}}async function N(){if(confirm("Deseja excluir todas as notifica\xe7\xf5es lidas? Esta a\xe7\xe3o n\xe3o pode ser desfeita."))try{let{data:{user:e}}=await l.O.auth.getUser();if(!e)return;let{error:t}=await l.O.from("notifications").delete().eq("user_id",e.id).eq("is_read",!0);if(t)throw t;await w()}catch(e){console.error("Erro ao deletar notifica\xe7\xf5es:",e),alert("Erro ao excluir notifica\xe7\xf5es")}}async function Z(e){try{let{error:t}=await l.O.from("notifications").delete().eq("id",e);if(t)throw t;await w()}catch(e){console.error("Erro ao deletar notifica\xe7\xe3o:",e)}}(0,r.useEffect)(()=>{k(),w()},[]);let _="unread"===f?d.filter(e=>!e.is_read):d,M=d.filter(e=>!e.is_read).length;return t?a.jsx(y.Z,{children:a.jsx("div",{className:"flex items-center justify-center h-full bg-gray-50",children:(0,a.jsxs)("div",{className:"text-center",children:[a.jsx("div",{className:"animate-spin rounded-full h-16 w-16 border-4 border-red-200 border-t-red-600 mx-auto mb-4"}),a.jsx("p",{className:"text-sm font-medium text-gray-600",children:"Carregando notifica\xe7\xf5es..."})]})})}):a.jsx(y.Z,{children:(0,a.jsxs)("div",{className:"min-h-screen bg-gray-50",children:[a.jsx("div",{className:"bg-gradient-to-r from-red-600 to-pink-600 px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 shadow-lg",children:a.jsx("div",{className:"max-w-4xl mx-auto",children:(0,a.jsxs)("div",{className:"flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4",children:[(0,a.jsxs)("div",{className:"flex items-center gap-2 sm:gap-3",children:[a.jsx("div",{className:"p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg flex-shrink-0",children:a.jsx(p.Z,{className:"w-5 h-5 sm:w-6 sm:h-6 text-white"})}),(0,a.jsxs)("div",{children:[a.jsx("h1",{className:"text-2xl sm:text-3xl md:text-4xl font-bold text-white",children:"Notifica\xe7\xf5es"}),a.jsx("p",{className:"text-red-100 text-sm sm:text-base md:text-lg mt-0.5 sm:mt-1",children:M>0?`${M} n\xe3o lida${M>1?"s":""}`:"Tudo em dia! \uD83C\uDF89"})]})]}),(0,a.jsxs)("div",{className:"flex items-center gap-2 w-full sm:w-auto",children:[M>0&&(0,a.jsxs)("button",{onClick:v,className:"flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-3 bg-white text-red-600 rounded-lg sm:rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base",children:[a.jsx(c,{className:"w-3.5 h-3.5 sm:w-4 sm:h-4"}),a.jsx("span",{className:"hidden sm:inline",children:"Marcar todas"}),a.jsx("span",{className:"sm:hidden",children:"Marcar"})]}),d.filter(e=>e.is_read).length>0&&(0,a.jsxs)("button",{onClick:N,className:"flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-3 bg-white bg-opacity-20 text-white rounded-lg sm:rounded-xl font-bold hover:bg-opacity-30 transition-all flex items-center justify-center gap-2 text-sm sm:text-base",children:[a.jsx(u.Z,{className:"w-3.5 h-3.5 sm:w-4 sm:h-4"}),a.jsx("span",{className:"hidden sm:inline",children:"Limpar"})]})]})]})})}),(0,a.jsxs)("div",{className:"max-w-4xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 pb-6 sm:pb-8",children:[a.jsx("div",{className:"flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 sm:mb-6",children:[{key:"all",label:"Todas",count:d.length,icon:"\uD83D\uDCEC"},{key:"unread",label:"N\xe3o lidas",count:M,icon:"\uD83D\uDD14"}].map(e=>(0,a.jsxs)("button",{onClick:()=>b(e.key),className:`px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all whitespace-nowrap shadow-lg text-xs sm:text-sm md:text-base ${f===e.key?"bg-white text-red-600 shadow-xl border-2 border-red-200":"bg-white text-gray-600 hover:shadow-xl border-2 border-transparent"}`,children:[a.jsx("span",{className:"mr-1 sm:mr-2",children:e.icon}),e.label," (",e.count,")"]},e.key))}),a.jsx("div",{className:"space-y-2 sm:space-y-3",children:0===_.length?(0,a.jsxs)("div",{className:"bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-10 sm:p-16 text-center",children:[a.jsx(p.Z,{className:"w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4"}),a.jsx("p",{className:"text-base sm:text-lg font-medium text-gray-700 mb-1 sm:mb-2",children:"unread"===f?"Nenhuma notifica\xe7\xe3o n\xe3o lida":"Nenhuma notifica\xe7\xe3o"}),a.jsx("p",{className:"text-xs sm:text-sm text-gray-500",children:"unread"===f?"Voc\xea est\xe1 em dia!":"Quando houver novidades, elas aparecer\xe3o aqui"})]}):_.map(t=>{var s;return a.jsx("div",{className:`group bg-white rounded-xl sm:rounded-2xl shadow-lg border transition-all cursor-pointer ${t.is_read?"border-gray-200 hover:border-gray-300":"border-blue-300 hover:border-blue-400 bg-blue-50"}`,onClick:()=>{j(t.id),t.order_id?e.push(`/order/${t.order_id}`):t.quote_id&&e.push(`/quotes/${t.quote_id}`)},children:a.jsx("div",{className:"p-3 sm:p-5",children:(0,a.jsxs)("div",{className:"flex gap-2 sm:gap-4",children:[a.jsx("div",{className:`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${{new_order:"bg-blue-100 text-blue-600",order_updated:"bg-purple-100 text-purple-600",order_completed:"bg-green-100 text-green-600",quote_created:"bg-amber-100 text-amber-600",quote_approved:"bg-emerald-100 text-emerald-600",quote_rejected:"bg-red-100 text-red-600",message:"bg-cyan-100 text-cyan-600",system:"bg-gray-100 text-gray-600"}[t.type]||"bg-gray-100 text-gray-600"}`,children:(s=t.type,({new_order:a.jsx(n.Z,{className:"w-5 h-5"}),order_updated:a.jsx(o.Z,{className:"w-5 h-5"}),order_completed:a.jsx(c,{className:"w-5 h-5"}),quote_created:a.jsx(m.Z,{className:"w-5 h-5"}),quote_approved:a.jsx(x.Z,{className:"w-5 h-5"}),quote_rejected:a.jsx(o.Z,{className:"w-5 h-5"}),message:a.jsx(h,{className:"w-5 h-5"}),system:a.jsx(p.Z,{className:"w-5 h-5"})})[s]||a.jsx(p.Z,{className:"w-5 h-5"}))}),(0,a.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,a.jsxs)("div",{className:"flex items-start justify-between gap-2 sm:gap-3 mb-0.5 sm:mb-1",children:[a.jsx("h3",{className:"font-semibold text-gray-900 text-sm sm:text-base",children:t.title}),!t.is_read&&a.jsx("div",{className:"flex-shrink-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full mt-1"})]}),a.jsx("p",{className:"text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 line-clamp-2",children:t.body}),a.jsx("p",{className:"text-[10px] sm:text-xs text-gray-500",children:new Date(t.created_at).toLocaleString("pt-BR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})})]}),(0,a.jsxs)("div",{className:"flex-shrink-0 flex items-center gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity",children:[!t.is_read&&a.jsx("button",{onClick:e=>{e.stopPropagation(),j(t.id)},className:"p-1.5 sm:p-2 hover:bg-blue-100 rounded-lg transition-colors",title:"Marcar como lida",children:a.jsx(x.Z,{className:"w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600"})}),a.jsx("button",{onClick:e=>{e.stopPropagation(),Z(t.id)},className:"p-1.5 sm:p-2 hover:bg-red-100 rounded-lg transition-colors",title:"Excluir",children:a.jsx(u.Z,{className:"w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600"})})]})]})})},t.id)})})]})]})})}},69224:(e,t,s)=>{"use strict";s.d(t,{Z:()=>l});var a=s(3729),r={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let i=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),l=(e,t)=>{let s=(0,a.forwardRef)(({color:s="currentColor",size:l=24,strokeWidth:n=2,absoluteStrokeWidth:o,className:d="",children:c,...m},x)=>(0,a.createElement)("svg",{ref:x,...r,width:l,height:l,stroke:s,strokeWidth:o?24*Number(n)/Number(l):n,className:["lucide",`lucide-${i(e)}`,d].join(" "),...m},[...t.map(([e,t])=>(0,a.createElement)(e,t)),...Array.isArray(c)?c:[c]]));return s.displayName=`${e}`,s}},66138:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
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
 */let a=(0,s(69224).Z)("Calendar",[["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",ry:"2",key:"eu3xkr"}],["line",{x1:"16",x2:"16",y1:"2",y2:"6",key:"m3sa8f"}],["line",{x1:"8",x2:"8",y1:"2",y2:"6",key:"18kwsl"}],["line",{x1:"3",x2:"21",y1:"10",y2:"10",key:"xt86sb"}]])},62312:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]])},25545:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
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
 */let a=(0,s(69224).Z)("MessageCircle",[["path",{d:"m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z",key:"v2veuj"}]])},76196:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("Ticket",[["path",{d:"M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z",key:"qn84l0"}],["path",{d:"M13 5v2",key:"dyzc3o"}],["path",{d:"M13 17v2",key:"1ont0d"}],["path",{d:"M13 11v2",key:"1wjjxi"}]])},38271:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]])},18822:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]])},14513:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=(0,s(69224).Z)("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]])},57125:(e,t,s)=>{"use strict";s.r(t),s.d(t,{$$typeof:()=>i,__esModule:()=>r,default:()=>l});let a=(0,s(86843).createProxy)(String.raw`D:\Projeto\chameiapp\client-portal\app\notifications\page.tsx`),{__esModule:r,$$typeof:i}=a,l=a.default}};var t=require("../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),a=t.X(0,[869,837,404],()=>s(52857));module.exports=a})();