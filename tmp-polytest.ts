
import { encodePolyline, decodePolyline, fuzzEndpoints } from '/home/runner/workspace/shared/polyline.ts';
const known = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const pts = decodePolyline(known);
console.log('knownCount', pts.length, JSON.stringify(pts));
console.log('reencodedMatches', encodePolyline(pts) === known);
let ok=true;
for(let i=0;i<200;i++){
  const n=2+Math.floor(Math.random()*25);
  let lat=(Math.random()*140)-70;
  let lng=(Math.random()*300)-150;
  const arr=[];
  for(let j=0;j<n;j++){
    lat += (Math.random()-0.5)*0.02;
    lng += (Math.random()-0.5)*0.02;
    arr.push({lat,lng});
  }
  const enc=encodePolyline(arr);
  const dec=decodePolyline(enc);
  if(dec.length!==arr.length){ ok=false; console.log('len mismatch', i); break; }
  for(let j=0;j<arr.length;j++){
    if(Math.abs(dec[j].lat-arr[j].lat) > 1.1e-5 || Math.abs(dec[j].lng-arr[j].lng) > 1.1e-5){
      ok=false; console.log('drift', i,j,arr[j],dec[j]); break;
    }
  }
  if(!ok) break;
}
console.log('fuzzExample', fuzzEndpoints([{lat:0,lng:0},{lat:0,lng:0.001},{lat:0,lng:0.002},{lat:0,lng:0.003},{lat:0,lng:0.004}],200).length);
console.log('randomRoundTrip', ok);
