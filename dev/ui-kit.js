import { OmegaUI } from '../js/v2/ui/omega-ui.js';
const ui = new OmegaUI(document.body, '..');

const term = ui.createTerminal({ lines:['OMEGA OS v2','user@omega:~$ help','filesystem  terminal  processes'] });
document.querySelector('#terminal-window').append(ui.createWindow({ title:'Terminal', content:term.terminal, mobileMode:'sheet' }));

const dialogue = ui.createDialogue({ text:'Ты ведь останешься ещё немного?', choices:[{id:'stay',label:'Да, останусь.'},{id:'leave',label:'Мне нужно идти.'}] });
document.querySelector('#dialogue').append(dialogue);

const explorer = ui.createExplorer({ path:'/memories', files:[
  {id:'photo',name:'test_photo.img',kind:'image'},
  {id:'sea',name:'Море 2017',kind:'folder'},
  {id:'dump',name:'memory_dump.dat',kind:'memory',state:'corrupted'},
  {id:'private',name:'private.key',state:'locked'}
], onOpen:file=>ui.showToast(`OPEN: ${file.name}`) });
document.querySelector('#explorer').append(explorer.explorer);

document.querySelector('#processes').append(ui.createTaskManager({ processes:[
  {id:'1',name:'kernel',cpu:'2%',memory:'18 MB'},
  {id:'4',name:'vera',cpu:'11%',memory:'342 MB'},
  {id:'?',name:'NULL',cpu:'??',memory:'??',anomaly:true}
] }));

document.querySelector('#evidence').append(ui.createEvidenceInspector({
  src:'../assets/v2/props/sea_2017_polaroid.svg',
  alt:'Placeholder photograph connected to the Sea 2017 clue.',
  title:'sea_2017_polaroid',
  metadata:[['created','2017-07-14'],['modified','2081-09-04']],
  hotspots:[{id:'date',x:52,y:82,label:'Inspect date'}],
  onHotspot:()=>ui.showToast('Несовпадение временной метки.',{tone:'vera'})
}).inspector);

document.querySelector('#boot').append(ui.createBootScreen({ progress:67, actions:[{id:'recover',label:'ВОССТАНОВИТЬ'},{id:'safe',label:'БЕЗОПАСНЫЙ РЕЖИМ'}] }).boot);

document.querySelector('#saves').append(ui.createSaveSlots({ slots:[
  {id:'auto',title:'AUTOSAVE',meta:'HOME · 00:47:18'},
  {id:'1',title:'SLOT 01',meta:'STATIC · 01:22:04'},
  {id:'2',title:'SLOT 02',meta:'Empty'}
] }));

document.querySelector('#core').append(ui.createCoreDecision({ description:'Доступные протоколы зависят от найденных доказательств.', protocols:[
  {id:'ISOLATE',label:'Изолировать систему'},
  {id:'PURGE',label:'Удалить V.E.R.A.',tone:'danger'},
  {id:'MERGE',label:'OMEGA protocol'}
] }));

document.querySelector('#toast').onclick=()=>ui.showToast('Сектор памяти восстановлен.',{tone:'vera'});
document.querySelector('#corrupt').onclick=()=>document.body.dataset.corrupted=document.body.dataset.corrupted==='true'?'false':'true';
document.querySelector('#show-settings').onclick=()=>{
  const settings=ui.createSettings({ settings:[
    {id:'reduced_glitch',label:'Reduced glitch',description:'Снижает мерцание и резкие искажения',type:'toggle',value:false},
    {id:'touch_opacity',label:'Touch opacity',type:'range',min:20,max:100,value:75}
  ]});
  const {layer}=ui.createModal({title:'SETTINGS',body:settings,actions:[{id:'close',label:'ГОТОВО',onSelect:(_,node)=>node.remove()}]}); document.body.append(layer);
};
document.querySelector('#show-chapter').onclick=()=>{
  const card=ui.createChapterCard({index:'CHAPTER 05',title:'VERSIONS',subtitle:'Некоторые резервные копии помнят больше, чем должны.'}); document.body.append(card); setTimeout(()=>card.remove(),2200);
};
