// streamLoader.js
//Your stream mapping (can also be a pattern-based link)

const streams = {
    
 "l1": "https://watchasports.com/live/fubo.html",  //aston villa
 "l2": "https://aeriswispx.github.io/mpdhls?get=aHR0cHM6Ly9wbGF5N2JhLnBlb2RsYy5jb20vc3BvcnQvMjAyXzQzMDUxODFfMS5tM3U4", 
"l3": "https://watchasports.com/live/skysports.html",
 "l4": "https:\/\/xlz.plcdn.xyz\/ajax\/chanel\/type\/1\/link\/rchtwtx",
   
"m1": "https:\/\/xlz.plcdn.xyz\/ajax\/chanel\/type\/7\/link\/channel18",  //cry palace
  "m2": "https://sportzonline.live/channels/bra/br3.php",
  "m3": "https:\/\/xlz.plcdn.xyz\/ajax\/chanel\/type\/7\/link\/channel18",
  "m4": "https:\/\/xlz.plcdn.xyz\/ajax\/chanel\/type\/7\/link\/channel18",
   
  "lx1": "https://watchasports.com/live/bein2.html",  //new
 "lx2": "https:\/\/xlz.plcdn.xyz\/ajax\/chanel\/type\/1\/link\/rchtwtx",
 "lx3": "https://watchasports.com/live/Laligatv.html",
  "lx4": "https://sportzonline.live/channels/pt/eleven2.php",
  "lx5": "https://aeriswispx.github.io/mpdhls?get=aHR0cHM6Ly9pbi1tYy1mZGxpdmUuZmFuY29kZS5jb20vbXVtYmFpLzEzMDk0NF9lbmdsaXNoX2hsc182M2VlOTFmN2NiMTIwNDVfMWFkZnJlZXRhLWRpX2gyNjQvaW5kZXgubTN1OA==",


  
 "1": "https://aeriswispx.github.io/mpdhls?get=aHR0cHM6Ly9pbi1tYy1mZGxpdmUuZmFuY29kZS5jb20vbXVtYmFpLzEzNzM3MF9lbmdsaXNoX2hsc19mNDhlMmVjYmNiNTIxNDJfMWFkZnJlZXRhLWRpX2gyNjQvaW5kZXgubTN1OA==", //nwewcastle
"2": "https://aeriswispx.github.io/mpdhls?get=aHR0cHM6Ly9pbi1tYy1mZGxpdmUuZmFuY29kZS5jb20vbXVtYmFpLzEzNzM3MF9lbmdsaXNoX2hsc19mNDhlMmVjYmNiNTIxNDJfMWFkZnJlZXRhLWRpX2gyNjQvaW5kZXgubTN1OA==",
  "3": "https://aeriswispx.github.io/mpdhls?get=aHR0cHM6Ly9pbi1tYy1mZGxpdmUuZmFuY29kZS5jb20vbXVtYmFpLzEzNzM3MF9lbmdsaXNoX2hsc19mNDhlMmVjYmNiNTIxNDJfMWFkZnJlZXRhLWRpX2gyNjQvaW5kZXgubTN1OA==",
   "4": "https://aeriswispx.github.io/mpdhls?get=aHR0cHM6Ly9pbi1tYy1mZGxpdmUuZmFuY29kZS5jb20vbXVtYmFpLzEzNzM3MF9lbmdsaXNoX2hsc19mNDhlMmVjYmNiNTIxNDJfMWFkZnJlZXRhLWRpX2gyNjQvaW5kZXgubTN1OA==",
   
   
   "5": "https://aeriswispx.github.io/mpdhls?get=aHR0cHM6Ly9jZG4taGxzLm5zLXBsYXRmb3Jtcy5jb20vX3IxMC9saXN0L3Nsay1saXZlLm0zdTg=", //serie-a
   "6": "https://aeriswispx.github.io/mpdhls?get=aHR0cHM6Ly9jZG4taGxzLm5zLXBsYXRmb3Jtcy5jb20vX3IxMC9saXN0L3Nsay1saXZlLm0zdTg=",
 "7": "https://aeriswispx.github.io/mpdhls?get=aHR0cHM6Ly9jZG4taGxzLm5zLXBsYXRmb3Jtcy5jb20vX3IxMC9saXN0L3Nsay1saXZlLm0zdTg=",
 "8": "https://aeriswispx.github.io/mpdhls?get=aHR0cHM6Ly9jZG4taGxzLm5zLXBsYXRmb3Jtcy5jb20vX3IxMC9saXN0L3Nsay1saXZlLm0zdTg=",
 
    "9": "https://watchasports.com//live/shoq.html", //newcastle 
   "10": "https://watchasports.com//live/primehin.html",
 "11": "https://watchasports.com/live/willow.html",
 "12": "https://watchasports.com/live/willow.html",
 
  "13": "https://watchasports.com/live/fubo.html", //bayern
   "14": "https://aeriswispx.github.io/play?get=459401",
 "15": "https://aeriswispx.github.io/play?get=534219",
 "16": "https://aeriswispx.github.io/play?get=285067",
 
   "17": "https://watchasports.com/live/sports2sk.html", //inter
   "18": "https://aeriswispx.github.io/play?get=304148",
 "19": "https://aeriswispx.github.io/play?get=406865",
 "20": "https://aeriswispx.github.io/play?get=511367",
 
  "c1": "https://watchasports.com/live/tnt3.html", //tott
 "c2": "https://aeriswispx.github.io/mpdhls?get=aHR0cHM6Ly9jZG4taGxzLm5zLXBsYXRmb3Jtcy5jb20vX3IxMC9saXN0L3Nsay1saXZlLm0zdTg=",
  "c3": "https://watchasports.com/live/tnt3.html",
  "c4": "https://aeriswispx.github.io/mpdhls?get=aHR0cHM6Ly9wbGF5N2JhLnBlb2RsYy5jb20vc3BvcnQvMjAyXzQzMDUxODFfMS5tM3U4",

};

(function() {
  const id = new URLSearchParams(window.location.search).get("id");
  const iframe = document.getElementById("streamFrame");

  if (iframe && streams[id]) {
    iframe.src = streams[id];
  } else {
    console.error("Invalid or missing stream ID");
  }
})();
