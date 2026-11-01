// Small canvas polyfills for older Safari / embedded WebViews (CanvasRenderingContext2D.roundRect < Safari 16).
const proto=globalThis.CanvasRenderingContext2D?.prototype;
if(proto&&!proto.roundRect){
 proto.roundRect=function(x,y,w,h,r=0){
  const radius=Math.max(0,Math.min(Array.isArray(r)?(r[0]??0):Number(r)||0,Math.abs(w)/2,Math.abs(h)/2));
  this.moveTo(x+radius,y);this.lineTo(x+w-radius,y);this.quadraticCurveTo(x+w,y,x+w,y+radius);
  this.lineTo(x+w,y+h-radius);this.quadraticCurveTo(x+w,y+h,x+w-radius,y+h);this.lineTo(x+radius,y+h);
  this.quadraticCurveTo(x,y+h,x,y+h-radius);this.lineTo(x,y+radius);this.quadraticCurveTo(x,y,x+radius,y);this.closePath();
  return this;
 };
}
export const POLYFILLS_READY=true;
