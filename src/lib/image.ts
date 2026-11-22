/** Redimensionne une image (fichier/photo) en JPEG data URL compact, stockable dans Firestore */
export async function fileToCompactDataUrl(file: File, maxSide = 600, maxBytes = 180_000): Promise<string> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  const src = bitmap ?? (await loadImg(URL.createObjectURL(file)));
  const w = 'width' in src ? src.width : 0;
  const h = 'height' in src ? src.height : 0;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d')!.drawImage(src, 0, 0, canvas.width, canvas.height);
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
