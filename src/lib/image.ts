/** Redimensionne une image (fichier/photo) en JPEG carré (fond blanc) data URL compact, stockable dans Firestore */
export async function fileToCompactDataUrl(file: File, maxSide = 600, maxBytes = 180_000): Promise<string> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  const src = bitmap ?? (await loadImg(URL.createObjectURL(file)));
  const w = 'width' in src ? src.width : 0;
  const h = 'height' in src ? src.height : 0;
  const side = Math.min(maxSide, Math.max(w, h));
  const scale = side / Math.max(w, h);
  const dw = Math.round(w * scale);
  const dh = Math.round(h * scale);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = side;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, side, side);
  ctx.drawImage(src, Math.round((side - dw) / 2), Math.round((side - dh) / 2), dw, dh);
  let q = 0.8;
  let url = canvas.toDataURL('image/jpeg', q);
  // ~4/3 : taille base64 vs octets
  while (url.length * 0.75 > maxBytes && q > 0.35) {
    q -= 0.1;
    url = canvas.toDataURL('image/jpeg', q);
  }
  return url;
}

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export const imageSearchUrl = (name: string) =>
  `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${name} jeu de société boîte`)}`;
