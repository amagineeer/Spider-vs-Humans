import {GRID} from '../data/balance.js';
export function cellAt(x,y){const col=Math.floor((x-GRID.x)/GRID.size),row=Math.floor((y-GRID.y)/GRID.size);return row>=0&&row<GRID.rows&&col>=0&&col<GRID.cols?{row,col}:null;}
export function center(row,col){return {x:GRID.x+(col+.5)*GRID.size,y:GRID.y+(row+.5)*GRID.size};}
