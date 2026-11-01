import {GRID} from '../data/balance.js';
import {BACKGROUNDS} from '../data/backgrounds.js';
let cached;
function buildRoom(){
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=900;
 const c=canvas.getContext('2d');
 const wall=c.createLinearGradient(0,0,0,210);wall.addColorStop(0,'#bfa88b');wall.addColorStop(.65,'#e1cfb1');wall.addColorStop(1,'#b49b7d');c.fillStyle=wall;c.fillRect(0,0,1600,210);
 // Faded striped wallpaper and fine damask-like accents.
 for(let x=0;x<1600;x+=40){c.fillStyle='#8e725215';c.fillRect(x,0,17,190);c.strokeStyle='#977c5522';for(let y=20;y<190;y+=48){c.beginPath();c.ellipse(x+25,y,5,10,0,0,Math.PI*2);c.stroke();}}
 // Window recess, wooden frame, blue glass, curtains and warm daylight.
 c.fillStyle='#4b382d';c.fillRect(292,13,300,153);c.fillStyle='#bc9262';c.fillRect(300,18,284,143);
 const sky=c.createLinearGradient(0,24,0,150);sky.addColorStop(0,'#83b5c5');sky.addColorStop(1,'#e7e4ca');c.fillStyle=sky;c.fillRect(309,25,266,124);
 c.fillStyle='#cad6ca';c.beginPath();c.moveTo(309,115);c.lineTo(370,75);c.lineTo(420,109);c.lineTo(485,62);c.lineTo(575,108);c.lineTo(575,149);c.lineTo(309,149);c.fill();
 c.fillStyle='#96734e';c.fillRect(436,22,9,131);c.fillRect(306,83,272,7);c.fillStyle='#e5c394';c.fillRect(287,156,310,10);
 for(const x of [276,550]){c.fillStyle='#9b6659';c.beginPath();c.moveTo(x,15);c.lineTo(x+58,15);c.quadraticCurveTo(x+28,75,x+42,153);c.lineTo(x-7,153);c.closePath();c.fill();c.strokeStyle='#714c464f';for(let k=0;k<4;k++){c.beginPath();c.moveTo(x+8+k*10,20);c.lineTo(x+3+k*9,145);c.stroke();}}
 c.fillStyle='#614937';c.fillRect(266,9,350,6);
 // Framed family pictures.
 for(const [x,w,h] of [[735,82,100],[845,65,76]]){c.fillStyle='#543d32';c.fillRect(x+4,36,w,h);c.fillStyle='#b88e59';c.fillRect(x,30,w,h);c.fillStyle='#e6d6af';c.fillRect(x+7,37,w-14,h-14);c.fillStyle='#8b9b80';c.fillRect(x+13,43,w-26,h-26);c.fillStyle='#cdb182';c.beginPath();c.ellipse(x+w/2,65,12,16,0,0,7);c.fill();c.fillStyle='#71677b';c.beginPath();c.ellipse(x+w/2,99,22,22,0,0,7);c.fill();}
 // Shelf, books, pot plant and lamp; all remain behind the playable floor.
 c.fillStyle='#594334';c.fillRect(1030,147,305,12);c.fillStyle='#b18b60';c.fillRect(1025,140,315,9);
 for(let i=0;i<7;i++){c.fillStyle=['#806475','#708777','#b38b58','#657b8b'][i%4];c.fillRect(1050+i*17,84-(i%3)*7,14,56+(i%3)*7);c.fillStyle='#ddc59a';c.fillRect(1053+i*17,102,8,2);}
 c.fillStyle='#a2684c';c.beginPath();c.moveTo(1238,110);c.lineTo(1286,110);c.lineTo(1278,140);c.lineTo(1246,140);c.fill();
 c.strokeStyle='#526b48';c.lineWidth=4;c.beginPath();c.moveTo(1262,114);c.lineTo(1262,62);c.stroke();c.fillStyle='#6f8854';for(let i=0;i<6;i++){c.beginPath();c.ellipse(1262+(i%2?12:-12),70+i*6,16,6,i%2?-.5:.5,0,7);c.fill();}
 c.fillStyle='#604c3b';c.fillRect(1434,100,6,65);c.fillRect(1413,163,48,5);c.fillStyle='#c09b62';c.beginPath();c.moveTo(1412,62);c.lineTo(1463,62);c.lineTo(1478,107);c.lineTo(1396,107);c.closePath();c.fill();
 c.fillStyle='#f4d79c';c.fillRect(1400,104,74,4);
 // Deep baseboard and floor, with individual staggered parquet planks.
 c.fillStyle='#674c39';c.fillRect(0,183,1600,27);c.fillStyle='#bc966a';c.fillRect(0,183,1600,5);c.fillStyle='#3f302b';c.fillRect(0,207,1600,6);
 c.fillStyle='#9f7757';c.fillRect(0,213,1600,687);
 for(let row=0;row<20;row++)for(let col=-1;col<11;col++){const x=col*168+(row%2)*84,y=213+row*36;c.fillStyle=['#bd9269','#b38860','#c49c73','#ac815c'][(row*7+col+12)%4];c.fillRect(x+1,y+1,166,34);c.strokeStyle='#73513735';c.lineWidth=1;for(let k=0;k<3;k++){c.beginPath();c.moveTo(x+12,y+8+k*9);c.bezierCurveTo(x+62,y+4+k*9,x+100,y+13+k*9,x+155,y+7+k*9);c.stroke();}}
 const light=c.createLinearGradient(300,200,1100,880);light.addColorStop(0,'#ffebbc29');light.addColorStop(1,'#ffebbc00');c.fillStyle=light;c.beginPath();c.moveTo(300,210);c.lineTo(590,210);c.lineTo(1130,900);c.lineTo(380,900);c.closePath();c.fill();
 for(let r=0;r<GRID.rows;r++)for(let col=0;col<GRID.cols;col++){const x=GRID.x+col*GRID.size,y=GRID.y+r*GRID.size;c.fillStyle=(r+col)%2?'#4c342414':'#f6deb316';c.fillRect(x,y,128,128);c.strokeStyle='#674b354c';c.strokeRect(x+.5,y+.5,127,127);}
 // Sparse corner webs do not hide cell contents.
 c.strokeStyle='#f8edcf80';c.lineWidth=1;for(const [x,y] of [[GRID.x+3,GRID.y+3],[1268,715],[755,459]]){for(let i=0;i<4;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*36,y+Math.sin(a)*36);c.stroke();}for(const radius of [12,24,36]){c.beginPath();c.arc(x,y,radius,0,Math.PI/2);c.stroke();}}
 return canvas;
}
export function drawRoom(ctx,level,images={}){
 const def=BACKGROUNDS[level?.background],img=images[level?.background];
 if(img&&def){
  const top=Math.round(img.naturalHeight*def.cropTop);
  ctx.drawImage(img,0,top,img.naturalWidth,img.naturalHeight-top,0,0,1600,900);
  // Only the functional 9 × 5 grid is drawn over the supplied artwork.
  for(let r=0;r<GRID.rows;r++)for(let col=0;col<GRID.cols;col++){
   const x=GRID.x+col*GRID.size,y=GRID.y+r*GRID.size;
   ctx.fillStyle=(r+col)%2?'#34263812':'#fff1ce14';ctx.fillRect(x,y,GRID.size,GRID.size);
   ctx.strokeStyle=def.day?'#674b354c':'#d3d9ed38';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,GRID.size-1,GRID.size-1);
  }
  return true;
 }
 cached??=buildRoom();ctx.drawImage(cached,0,0);return false;
}
