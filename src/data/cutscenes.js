// Cutscene catalogue. To replace a cutscene, drop new files with the same names into
// assets/cutscenes/ (tools/cutscene/build.sh <master.mp4> intro rebuilds all copies),
// or point `sources` at other files. Sources are tried in order of preference.
export const CUTSCENES = {
 intro:{
  id:'intro',
  title:'Пролог · «Это наш дом»',
  duration:40,
  // 1080p for desktop, 720p for small screens / data saver; both H.264 + AAC with faststart.
  // The VP9/Opus WebM is the codec fallback for browsers without H.264 (some Linux/open builds):
  // it is listed after the 1080p MP4, so it only plays when the MP4 is unsupported or fails.
  sources:[
   {src:'assets/cutscenes/intro_1080.mp4',type:'video/mp4; codecs="avc1.640028, mp4a.40.2"',height:1080},
   {src:'assets/cutscenes/intro_1080.webm',type:'video/webm; codecs="vp9, opus"',height:1080},
   {src:'assets/cutscenes/intro_720.mp4',type:'video/mp4; codecs="avc1.4d401f, mp4a.40.2"',height:720},
  ],
  poster:'assets/cutscenes/intro_poster.jpg',
  // Shown instead of the video when it cannot be decoded or stalls. Captions repeat the comic text.
  fallback:[
   {src:'assets/cutscenes/intro_slide1.jpg',caption:'Обычный дом… Так-так… а это что ещё такое? Эти пауки свили логово в моём доме?! К утру ни одной лапы не останется!',duration:6},
   {src:'assets/cutscenes/intro_slide2.jpg',caption:'Слышали? Человек объявил нам войну. Мы жили здесь задолго до него. Будем защищаться!',duration:6},
   {src:'assets/cutscenes/intro_slide3.jpg',caption:'Это. Наш. Дом.',duration:3.5},
   {src:'assets/cutscenes/intro_slide4.jpg',caption:'ЭТО НАШ ДОМ',duration:3},
  ],
  // The closing title card (seconds) is reused as the finale backdrop.
  titleCard:{from:35.5,still:'assets/cutscenes/intro_slide4.jpg'},
 },
};
