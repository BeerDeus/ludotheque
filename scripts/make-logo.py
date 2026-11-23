# Génère public/logo.svg + favicon.svg : python3 scripts/make-logo.py public
import math,sys
cx,cy,R=32,33.2,12.8
def P(x,y): return (round(x,2),round(y,2))
T=P(cx,cy-R); B=P(cx,cy+R)
UR=P(cx+R*math.sqrt(3)/2,cy-R/2); LR=P(cx+R*math.sqrt(3)/2,cy+R/2)
UL=P(cx-R*math.sqrt(3)/2,cy-R/2); LL=P(cx-R*math.sqrt(3)/2,cy+R/2)
a=P(cx,cy-0.56*R); b=P(cx+0.55*R,cy+0.3*R); c=P(cx-0.55*R,cy+0.3*R)
def poly(pts,fill,extra=''): return f'<path d="M{" L".join(f"{x} {y}" for x,y in pts)}Z" fill="{fill}"{extra}/>'
faces=[
 ((T,a,UL),'#f9e19b'),((T,a,UR),'#dcaa45'),
 ((UL,a,c),'#eec867'),((UR,a,b),'#b98629'),
 ((UL,c,LL),'#d3a13c'),((UR,b,LR),'#8f661b'),
 ((c,b,B),'#b07d24'),((LL,c,B),'#a5731f'),((LR,b,B),'#755214'),
]
d20=''.join(poly(p,f) for p,f in faces)
d20+=poly((a,b,c),'url(#lg-face)')
# arêtes
edges=[(T,a),(UL,a),(UR,a),(UL,c),(UR,b),(LL,c),(LR,b),(B,c),(B,b),(a,b),(b,c),(c,a)]
d20+='<path d="'+''.join(f"M{p[0]} {p[1]}L{q[0]} {q[1]}" for p,q in edges)+'" stroke="#6e4c12" stroke-width=".6" stroke-linejoin="round" fill="none" stroke-opacity=".85"/>'
d20+=poly((T,UR,LR,B,LL,UL),'none',' stroke="#5a3c0c" stroke-width="1.15" stroke-linejoin="round"')
# reflet
d20+=poly(((T[0]-.8,T[1]+2.2),(a[0]-1.3,a[1]+.9),(UL[0]+2.6,UL[1]+.5)),'#fffbe8',' fill-opacity=".5"')
defs='''<defs>
<linearGradient id="lg-face" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#fdedb9"/><stop offset="1" stop-color="#efc95f"/></linearGradient>
<linearGradient id="lg-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7dc8f"/><stop offset="1" stop-color="#c9962e"/></linearGradient>
<linearGradient id="lg-copper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ee9f7e"/><stop offset="1" stop-color="#b5532f"/></linearGradient>
<radialGradient id="lg-bg" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#3b3936"/><stop offset="1" stop-color="#1b1a19"/></radialGradient>
<radialGradient id="lg-glow" cx=".5" cy=".52" r=".5"><stop offset="0" stop-color="#e6bb4f" stop-opacity=".28"/><stop offset="1" stop-color="#e6bb4f" stop-opacity="0"/></radialGradient>
</defs>'''
shield='''<path d="M32 13 49.5 17.6v12.2c0 11.2-7.8 17.8-17.5 21.4-9.7-3.6-17.5-10.2-17.5-21.4V17.6z" fill="#262523" stroke="url(#lg-copper)" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M32 16.7 46.1 20.4v9.4c0 9-6.2 14.5-14.1 17.7-7.9-3.2-14.1-8.7-14.1-17.7v-9.4z" fill="url(#lg-glow)" stroke="#d97757" stroke-opacity=".35" stroke-width=".9"/>'''
crown='''<path d="M24.2 13.8 27.6 16.4 32 10.6l4.4 5.8 3.4-2.6-1.3 5.4h-13z" fill="url(#lg-gold)" stroke="#6e4c12" stroke-width=".8" stroke-linejoin="round"/>
<circle cx="32" cy="9.4" r="1.25" fill="#d97757" stroke="#6e4c12" stroke-width=".5"/><circle cx="24.2" cy="13.6" r=".8" fill="#f7dc8f"/><circle cx="39.8" cy="13.6" r=".8" fill="#f7dc8f"/>'''
def svg(bg=True,rx=14):
    b=f'<rect width="64" height="64" rx="{rx}" fill="url(#lg-bg)"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">{defs}{b}{shield}<g filter="none">{d20}</g>{crown}</svg>'
out=sys.argv[1]
open(f'{out}/favicon.svg','w').write(svg())
open(f'{out}/logo.svg','w').write(svg())
open(f'{out}/logo-mark.svg','w').write(svg(bg=False).replace('viewBox="0 0 64 64"','viewBox="13 7 38 46"'))
open(f'{out}/logo-square.svg','w').write(svg(rx=0))
mask=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">{defs}<rect width="64" height="64" fill="url(#lg-bg)"/><g transform="translate(32 32) scale(.8) translate(-32 -30)">{shield}{d20}{crown}</g></svg>'
open(f'{out}/logo-maskable.svg','w').write(mask)
