import json, math, os
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from shapely.geometry import Polygon, Point, LineString
from shapely.ops import unary_union
import numpy as np
from PIL import Image

O=Path('/mnt/data/ashen_veil_blueprint')
C={'bg':'#f5f3eb','paper':'#fcfcf8','wall':'#23364b','dark':'#122439','ink':'#263d54','quiet':'#5f7280', 'room':'#e3edf4','room2':'#d6e9ee','corridor':'#d2e2f0','secret':'#e7dcf3','secretstroke':'#7a539d','story':'#efe5d6','work':'#e1e9dd','void':'#f8f4e8','trace':'#b2bcc4','gold':'#b38e3d','red':'#aa6258','white':'#fffef9'}

def rec(x0,y0,x1,y1): return [[x0,y0],[x1,y0],[x1,y1],[x0,y1]]

def multi(*polys): return unary_union([Polygon(p) for p in polys])

def room(id,name,poly,kind='required',fixtures=None,story='',notes='',label=None):
    geom=poly if hasattr(poly,'geom_type') else Polygon(poly)
    return {'id':id,'name':name,'geom':geom,'kind':kind,'fixtures':fixtures or [], 'story':story,'notes':notes,'label':label}

ground=[
room('H-G01','Dining Room',rec(0,0,24,16),'proposed-story',['Dining table','household place settings'], 'Meals once shared by the family',( 'optional space') , (12,8)),
room('H-G02','Foyer',rec(24,0,52,16),fixtures=['Grandfather clock','two separate stair flights','front porch'],story='Familial welcome, clocks built for Sophia',label=(38,12)),
room('H-G03','Kitchen',rec(52,0,76,16),'proposed-story',['Family worktable','warm hearth','cookware'], 'Ordinary domestic life',label=(64,9)),
room('H-G04','Pantry',rec(76,0,90,16),'proposed-story',['Dry stores','shelves'], 'Practical household inventory',label=(83,8)),
room('H-G05','Allen’s Study',multi(rec(0,16,24,52),rec(-10,26,0,46)),fixtures=['Rufus—both eyes missing','587 note','Gond drafts'],story='Practical maker and caring father',label=(12,37)),
room('H-G06','Great Room',multi(rec(24,16,52,52),rec(28,52,48,57)),fixtures=['Blueprint displayed on table','027 combination box','family portraits','double-height fireplace'],story='Return hub: family history and altered construction drawing',label=(38,31)),
room('H-G07','Dahlia’s Art Studio',rec(52,16,76,52),fixtures=['Empty-mirror vanity','painting containing 027 clue','Sune altar'],story='Creativity, love, faith; apparent erased wall section on blueprint',label=(64,35)),
room('H-G08','Hidden Candle Workshop',rec(76,30,90,52),'hidden',['wick','wax trays','safety lantern'], 'Parental fear of fire, protected craft room',label=(83,41)),
]
upper=[
room('H-U01','Unused Nursery',rec(0,0,24,16),'proposed-story',['Empty cradle','carefully folded linens'], 'Unrealized plans for unborn son',label=(12,8)),
room('H-U02','Upper Gallery / Landing',multi(rec(24,0,52,16),rec(24,16,29,52),rec(47,16,52,52),rec(29,47,47,52)),fixtures=['Stair arrival','attic pull-down hatch','roof access dormer'],story='Open view down into Great Room and family hearth',label=(37,10)),
room('H-U03','Guest Bedroom',rec(52,0,76,16),'proposed-story',['Spare bed','worn suitcase'], 'A home intended to welcome visitors',label=(64,8)),
room('H-U04','Parents’ Bedroom',multi(rec(0,16,24,52),rec(-10,26,0,46)),fixtures=['Coat with Old Iron Key','broken nightstand—Gate Handle','Hope Chest—Music Box'],story='Care and loss in a normal family bedroom',label=(12,35)),
room('H-U05','Sophia’s Bedroom',rec(52,16,76,52),fixtures=['Stuffed bear—first Rufus eye','six-book Spine Mosaic','Veil-only final book on bed'],story='Childhood and adaptation to blindness',label=(64,35)),
room('H-U06','Spine Mosaic Hidden Room',rec(76,30,90,52),'hidden',['Gond emblem half','hidden bookshelf entrance'], 'Allen’s concealed workmanship, upstairs counterpart to studio void',label=(83,41)),
]
basement=[
room('H-B01','Allen’s Workshop',rec(24,0,52,52),fixtures=['Weathered-Key stairs from Foyer','repair benches','four-branch Vault mechanism doorway'],story='A tinkerer’s beloved craft: practical, not evil',label=(38,29)),
room('H-B02','Secured Vault',rec(52,26,76,52),'hidden',['Four-input lock mechanism','Keystone display'],story='Last security barrier meant to protect family, reward Keystone only',label=(64,39)),
]

door_groups={
 'ground':[
 ('P-EXT-FOYER','Exterior / Foyer',(38,0),'H-G02','OUTSIDE','regular','SOUTH'),
 ('P-FOYER-GREAT','Foyer / Great Room',(38,16),'H-G02','H-G06','regular','HORIZONTAL'),
 ('P-FOYER-DINING','Foyer / Dining',(24,8),'H-G02','H-G01','regular','VERTICAL'),
 ('P-FOYER-KITCHEN','Foyer / Kitchen',(52,8),'H-G02','H-G03','regular','VERTICAL'),
 ('P-GREAT-STUDY','Great Room / Study',(24,34),'H-G06','H-G05','locked:BrassStudyKey','VERTICAL'),
 ('P-GREAT-STUDIO','Great Room / Art Studio',(52,34),'H-G06','H-G07','regular','VERTICAL'),
 ('P-KITCHEN-PANTRY','Kitchen / Pantry',(76,8),'H-G03','H-G04','regular','VERTICAL'),
 ('P-STUDIO-CANDLE','Art Studio / Candle Workshop',(76,41),'H-G07','H-G08','hidden:PrayerProtection','VERTICAL'),
 ],
 'upper':[
 ('P-UPPER-NURSERY','Landing / Nursery',(24,8),'H-U02','H-U01','regular','VERTICAL'),
 ('P-UPPER-GUEST','Landing / Guest',(52,8),'H-U02','H-U03','regular','VERTICAL'),
 ('P-UPPER-PARENTS','Gallery / Parents',(24,34),'H-U02','H-U04','regular','VERTICAL'),
 ('P-UPPER-SOPHIA','Gallery / Sophia',(52,34),'H-U02','H-U05','locked:OldIronKey','VERTICAL'),
 ('P-SOPHIA-SPINE','Sophia / Spine Hidden',(76,41),'H-U05','H-U06','hidden:SixBooks','VERTICAL'),
 ],
 'basement':[
 ('P-WORKSHOP-VAULT','Workshop / Keystone Vault',(52,38),'H-B01','H-B02','locked:FourVaultInputs','VERTICAL'),
 ]
}
vert=[{'id':'V-FOYER-UPPER','from':'H-G02','to':'H-U02','at':[43,8],'kind':'stair_up','status':'required'},
      {'id':'V-FOYER-BASEMENT','from':'H-G02','to':'H-B01','at':[31,8],'kind':'stair_down','gate':'WeatheredKey','status':'required'},
      {'id':'V-UPPER-ATTIC','from':'H-U02','to':'H-A01','at':[38,49],'kind':'hook_ladder','gate':'LadderHook','status':'required'},
      {'id':'V-UPPER-ROOF','from':'H-U04','to':'H-R01','at':[12,52],'kind':'parents_north_window','status':'proposal'}]
windows={
 'ground': [('W-STUDY-W',(-10,35),'V'),('W-STUDY-N',(12,52),'H'),('W-GREAT-N',(38,57),'H'),('W-STUDIO-N',(64,52),'H'),('W-STUDIO-E',(76,24),'V'),('W-DINING-S',(12,0),'H'),('W-KITCHEN-S',(65,0),'H'),('W-CANDLE-E',(90,40),'V')],
 'upper':[('W-PARENTS-N',(12,52),'H'),('W-PARENTS-W',(-10,35),'V'),('W-SOPHIA-N',(64,52),'H'),('W-GUEST-S',(65,0),'H'),('W-NURSERY-S',(12,0),'H')],
 'basement':[]
}

alllevels={'ground':ground,'upper':upper,'basement':basement}

def holes(poly):return poly.interiors if hasattr(poly,'interiors') else []

# Geometric quality checks
checks={}
for floor,arr in alllevels.items():
    overlaps=[]
    for i,a in enumerate(arr):
        if not a['geom'].is_valid:overlaps.append((a['id'],'invalid'))
        for b in arr[i+1:]:
            ia=a['geom'].intersection(b['geom']).area
            if ia>1e-6:overlaps.append((a['id'],b['id'],round(ia,2)))
    checks[floor]={'room_count':len(arr),'positive_room_overlaps':overlaps,'min_piece_area':round(min(x['geom'].area for x in arr),1),'total_room_area':round(sum(x['geom'].area for x in arr),1)}
    assert not overlaps,(floor,overlaps)
for floor,dd in door_groups.items():
    for d in dd:
        key,name,pos,a,b,gate,orientation=d
        if b!='OUTSIDE':
            ga=next(z['geom'] for z in alllevels[floor] if z['id']==a)
            gb=next(z['geom'] for z in alllevels[floor] if z['id']==b)
            pa=Point(pos)
            assert ga.boundary.distance(pa)<1e-5,(key,a,'not on boundary')
            assert gb.boundary.distance(pa)<1e-5,(key,b,'not on boundary')

# Upper gallery with central void in same footprint
lower_hall=next(z for z in upper if z['id']=='H-U02')['geom']
void=Polygon(rec(29,16,47,47))
assert lower_hall.intersection(void).area==0
assert lower_hall.is_valid

# SVG/matplotlib drawing
plt.rcParams.update({'font.family':'DejaVu Sans','svg.fonttype':'none'})

def draw_scale(ax):
    y=-19
    ax.plot([0,20],[y,y],lw=1.6,color=C['dark'])
    for x in [0,5,10,15,20]:ax.plot([x,x],[y-1,y+1],color=C['dark'],lw=1.5)
    ax.text(10,y-3.8,'0        10        20 ft',size=8,ha='center',color=C['ink'])

def draw_window(ax,pos,orientation):
    x,y=pos
    if orientation=='H':
        ax.plot([x-2.3,x+2.3],[y,y],lw=4.5,color=C['paper'],solid_capstyle='butt',zorder=15)
        ax.plot([x-2.3,x+2.3],[y,y],lw=2,color='#3b859f',zorder=16)
        ax.plot([x-2.3,x+2.3],[y+0.65,y+0.65],lw=0.8,color='#3b859f',zorder=16)
    else:
        ax.plot([x,x],[y-2.3,y+2.3],lw=4.5,color=C['paper'],solid_capstyle='butt',zorder=15)
        ax.plot([x,x],[y-2.3,y+2.3],lw=2,color='#3b859f',zorder=16)
        ax.plot([x+0.65,x+0.65],[y-2.3,y+2.3],lw=0.8,color='#3b859f',zorder=16)

def draw_door(ax,d):
    key,name,(x,y),a,b,gate,orientation=d
    width=5 if not gate.startswith('hidden') else 4.8
    col=C['secretstroke'] if gate.startswith('hidden') else C['red'] if gate.startswith('locked') else C['gold']
    if orientation=='VERTICAL':
        ax.plot([x,x],[y-width/2,y+width/2],lw=4.4,color=C['paper'],zorder=14,solid_capstyle='butt')
        ax.plot([x,x+2.6],[y-width/2,y-width/2],lw=1.35,color=col,zorder=15)
        arc=patches.Arc((x,y-width/2),5.2,5.2,theta1=0,theta2=90,color=col,lw=0.8,zorder=15)
    else:
        ax.plot([x-width/2,x+width/2],[y,y],lw=4.4,color=C['paper'],zorder=14,solid_capstyle='butt')
        ax.plot([x-width/2,x-width/2],[y,y+2.6],lw=1.35,color=col,zorder=15)
        arc=patches.Arc((x-width/2,y),5.2,5.2,theta1=0,theta2=90,color=col,lw=0.8,zorder=15)
    ax.add_patch(arc)
    if gate.startswith('hidden'):
        ax.plot([x],[y],marker='D',markersize=3,color=col,zorder=17)

def draw_room(ax,rm):
    g=rm['geom'];geoms=list(g.geoms) if g.geom_type=='MultiPolygon' else [g]
    for geom in geoms:
        xx,yy=geom.exterior.xy
        fill=C['secret'] if rm['kind']=='hidden' else C['story'] if rm['kind']=='proposed-story' else C['corridor'] if 'Gallery' in rm['name'] else C['room']
        ax.fill(xx,yy,fc=fill,ec=C['ink'],lw=1.8 if rm['kind']=='hidden' else 1.5,zorder=2)
        if rm['kind']=='hidden':ax.plot(xx,yy,c=C['secretstroke'],lw=2.4,ls=(0,(3,3)),zorder=4)
    lx,ly=rm['label'] if rm['label'] else (g.centroid.x,g.centroid.y)
    name=rm['name'].replace('Dahlia’s Art Studio','Dahlia’s\nArt Studio').replace('Hidden Candle Workshop','Hidden Candle\nWorkshop').replace('Spine Mosaic Hidden Room','Spine Mosaic\nHidden Room').replace('Upper Gallery / Landing','Upper Gallery\n& Landing').replace('Parents’ Bedroom','Parents’\nBedroom').replace('Sophia’s Bedroom','Sophia’s\nBedroom').replace('Allen’s Workshop','Allen’s\nWorkshop').replace('Unused Nursery','Unused\nNursery').replace('Guest Bedroom','Guest\nBedroom').replace('Allen’s Study','Allen’s\nStudy')
    if rm['id']=='H-G06':name='GREAT ROOM\nTHE HOUSE HUB'
    h=min(g.bounds[3]-g.bounds[1],g.bounds[2]-g.bounds[0])
    fontsize=9.2 if h<18 else 9.5
    ax.text(lx,ly+1.8,rm['id'],ha='center',va='center',size=7.2,color=C['quiet'],zorder=7,weight='bold')
    ax.text(lx,ly-2.2,name,ha='center',va='center',size=fontsize,weight='bold',color=C['ink'],zorder=7)


def icon(ax,xy,text,color=None,dx=0,dy=0,sz=6.8):
    x,y=xy;ax.plot([x],[y],marker='o',color=color or C['gold'],markersize=3,zorder=8)
    ax.annotate(text,(x,y),xytext=(dx,dy),textcoords='offset points',fontsize=sz,color=color or C['quiet'],ha='left',va='bottom',zorder=9)

def extra(ax,floor):
    # selected key furniture/prop footprints, aligned to room geometry
    if floor=='ground':
        # blueprint table/Great Room hearth
        ax.add_patch(patches.Rectangle((33,23),10,5,lw=1,ec=C['gold'],fc='#f6edcc',zorder=6))
        ax.text(38,25.5,'HOUSE\nPLAN',size=6.2,ha='center',va='center',zorder=8,color=C['ink'])
        ax.add_patch(patches.Rectangle((34,49.5),8,2,fc='#d2a98c',ec=C['ink'],lw=1,zorder=8))
        icon(ax,(38,51.1),'hearth',dx=9,dy=6)
        icon(ax,(27,26),'027',dx=-23,dy=8)
        icon(ax,(7,32),'Rufus',dx=0,dy=8)
        icon(ax,(13,23),'587 note',dx=-13,dy=8)
        icon(ax,(59,23),'vanity',dx=5,dy=8)
        icon(ax,(70,43),'Sune altar',dx=-55,dy=9)
        icon(ax,(58,49),'painting 027',dx=4,dy=8)
        icon(ax,(84,46),'wick',dx=-8,dy=8)
        icon(ax,(47,6),'UP',dx=-4,dy=8,sz=8)
        icon(ax,(30,6),'DN',dx=-4,dy=8,sz=8)
        # story erasure east edge
        ax.annotate('A: concealed east wing',xy=(76,47),xytext=(98,71),arrowprops=dict(arrowstyle='->',color=C['secretstroke'],lw=1),fontsize=8,ha='right',color=C['secretstroke'])
    if floor=='upper':
        ax.add_patch(patches.Rectangle((29,16),18,31,facecolor=C['void'],edgecolor=C['quiet'],lw=1.6,linestyle=':',zorder=5))
        ax.text(38,31,'OPEN TO\nGREAT ROOM\nBELOW',ha='center',va='center',size=9,weight='bold',color=C['quiet'],zorder=8)
        # open balcony railing side
        for xs,ys in [([29,29],[16,47]),([47,47],[16,47]),([29,47],[47,47])]: ax.plot(xs,ys,c='#658da0',lw=2.2,ls=(0,(2,2)),zorder=7)
        icon(ax,(9,26),'nightstand',dx=0,dy=8)
        icon(ax,(14,42),'Hope Chest',dx=-8,dy=8)
        icon(ax,(57,25),'bear',dx=3,dy=8)
        icon(ax,(73,44),'bookcase',dx=-60,dy=8)
        icon(ax,(64,23),'bed / Veil book',dx=-20,dy=8)
        icon(ax,(84,43),'Gond half',dx=-13,dy=8)
        icon(ax,(38,49),'attic hatch',dx=8,dy=6)
        icon(ax,(38,13),'stairs',dx=-8,dy=8)
        ax.annotate('B: concealed upper wing',xy=(76,43),xytext=(98,68),arrowprops=dict(arrowstyle='->',color=C['secretstroke'],lw=1),fontsize=8,ha='right',color=C['secretstroke'])
    if floor=='basement':
        icon(ax,(40,8),'from Foyer',dx=0,dy=8)
        for (x,y) in [(30,24),(43,43)]:ax.add_patch(patches.Rectangle((x,y),5,3,fc='#c7bfb1',ec=C['ink'],lw=0.8,zorder=6))
        icon(ax,(64,41),'KEYSTONE',dx=-26,dy=8)
        ax.text(11,32,'UNEXCAVATED\nFOUNDATIONS',ha='center',va='center',size=10,color=C['quiet'])
        ax.text(63,10,'UNEXCAVATED\nEARTH',ha='center',va='center',size=9,color=C['quiet'])
    

def draw_floor(floor,arr,filename):
    fig,ax=plt.subplots(figsize=(13.5,10.5),dpi=180)
    fig.patch.set_facecolor(C['bg']);ax.set_facecolor(C['paper'])
    # reference core structural footprint from ground to upper/basement
    ax.add_patch(patches.Rectangle((0,0),76,52,lw=0.9,fc='none',ec='#a4acb3',linestyle=(0,(2,5)),zorder=1))
    for rm in arr:draw_room(ax,rm)
    # draw perimeter strong as true shell (except upper basement floor envelope based on room union)
    shell=unary_union([rm['geom'] for rm in arr])
    ggeoms=list(shell.geoms) if shell.geom_type=='MultiPolygon' else [shell]
    for g in ggeoms:
        x,y=g.exterior.xy;ax.plot(x,y,c=C['wall'],lw=3.8,zorder=10)
    for w in windows[floor]:draw_window(ax,w[1],w[2])
    for d in door_groups[floor]:draw_door(ax,d)
    extra(ax,floor)
    # porch projection
    if floor=='ground':
        ax.add_patch(patches.Rectangle((28,-7),20,7,facecolor='#ede8df',edgecolor=C['wall'],lw=1.5,zorder=3))
        ax.plot([28,48],[-7,-7],lw=3,color=C['wall']);ax.annotate('SOUTH PORCH',xy=(38,-3.5),ha='center',va='center',fontsize=8,fontweight='bold',color=C['ink'])
        ax.annotate('TO CARRIAGE YARD',xy=(38,-9),ha='center',fontsize=8,color=C['quiet'])
    ax.annotate('N',xy=(100,54),xytext=(100,43),arrowprops=dict(arrowstyle='-|>',lw=2,color=C['ink']),ha='center',fontsize=16,fontweight='bold',color=C['ink'])
    ax.text(-11,76,('01 / GROUND FLOOR' if floor=='ground' else '02 / UPPER FLOOR' if floor=='upper' else '03 / BASEMENT'),size=19,weight='bold',color=C['dark'])
    ax.text(-11,72,{'ground':'Great Room blueprint hub · Studio/Study branches · concealed Candle Workshop',
                     'upper':'Upper Gallery overlooking Great Room · Sophia/Parents · concealed Spine Room',
                     'basement':'Under the central house · Allen’s Workshop · four-input Keystone Vault'}[floor],size=9.2,color=C['quiet'])
    ax.text(-11,66,'Concept design · Dimensions in feet · Proposed polygons / NOT construction-verified',size=8.7,color=C['quiet'])
    draw_scale(ax)
    ax.set_xlim(-19,108);ax.set_ylim(-27,80);ax.set_aspect('equal')
    ax.axis('off');fig.tight_layout(pad=0.5)
    fig.savefig(O/(filename+'.svg'),facecolor=fig.get_facecolor(),bbox_inches='tight')
    fig.savefig(O/(filename+'.png'),facecolor=fig.get_facecolor(),bbox_inches='tight',dpi=170)
    plt.close(fig)

for f,arr in alllevels.items():draw_floor(f,arr,'ashen_house_'+f+'_v1')

# Attic/roof relationship visual as separate conceptual diagram with footprint of core
fig,ax=plt.subplots(figsize=(13.5,10.5),dpi=170);fig.patch.set_facecolor(C['bg']);ax.set_facecolor(C['paper'])
ax.add_patch(patches.Rectangle((0,0),76,52,fc='#e6eced',ec=C['wall'],lw=3.5))
ax.add_patch(patches.Rectangle((24,0),28,52,fc='#d6dfeb',ec=C['wall'],lw=2))
ax.add_patch(patches.Rectangle((24,0),28,20,fc='#e1e8da',ec=C['ink'],lw=1.3))
ax.add_patch(patches.Rectangle((24,20),28,32,fc='#eceded',ec=C['ink'],lw=1.3))
ax.text(38,14,'ATTIC STORAGE\nWinder · Minute Hand\nStorybook',ha='center',va='center',fontsize=9.5,fontweight='bold',color=C['ink'])
ax.text(38,37,'PITCHED ROOF / BEAMS\nNot full-height floor space',ha='center',va='center',fontsize=9.5,color=C['ink'])
ax.scatter([38],[49],c=C['gold'],s=55,zorder=6);ax.annotate('ATTIC ACCESS\nfrom Upper Gallery',xy=(38,49),xytext=(53,57),arrowprops=dict(arrowstyle='->'),fontsize=8,color=C['ink'])
ax.add_patch(patches.Rectangle((33,52),10,6,fc='#d2ad99',ec=C['wall'],lw=2))
ax.text(38,54.3,'CLOCK',ha='center',va='center',fontsize=8,fontweight='bold',color=C['ink'])
ax.annotate('Clock at north chimney',xy=(42,56),xytext=(65,67),arrowprops=dict(arrowstyle='->'),fontsize=8,color=C['ink'])
ax.annotate('Flue book distinct from gear',xy=(34,54),xytext=(-5,66),arrowprops=dict(arrowstyle='->'),fontsize=8,color=C['ink'])
ax.annotate('Roof entry via parents’ upstairs window',xy=(12,52),xytext=(42,-12),arrowprops=dict(arrowstyle='->'),fontsize=8,color=C['ink'])
ax.text(-11,76,'04 / ATTIC & ROOF RELATIONSHIP',fontsize=19,fontweight='bold',color=C['dark']);ax.text(-11,72,'Provisional cross-level access · precise slopes, roof decks and landings not yet designed',fontsize=9.2,color=C['quiet'])
ax.annotate('N',xy=(100,54),xytext=(100,43),arrowprops=dict(arrowstyle='-|>',lw=2,color=C['ink']),ha='center',fontsize=16,fontweight='bold',color=C['ink'])
ax.set_xlim(-19,108);ax.set_ylim(-27,80);ax.set_aspect('equal');ax.axis('off');fig.tight_layout(pad=0.5)
fig.savefig(O/'ashen_house_attic_roof_v1.svg',facecolor=fig.get_facecolor(),bbox_inches='tight')
fig.savefig(O/'ashen_house_attic_roof_v1.png',facecolor=fig.get_facecolor(),bbox_inches='tight',dpi=170);plt.close(fig)

# Composite sheet (no chart subplot instruction applies to analytical plots; this is a graphic sheet)
imgs=[Image.open(O/f'ashen_house_{key}_v1.png').convert('RGB') for key in ['ground','upper','basement','attic_roof']]
cellw=max(im.width for im in imgs);cellh=max(im.height for im in imgs)
imgs=[im.resize((cellw,cellh),Image.Resampling.LANCZOS) for im in imgs]
out=Image.new('RGB',(cellw*2,cellh*2),'#f5f3eb')
for i,im in enumerate(imgs):out.paste(im,((i%2)*cellw,(i//2)*cellh))
out.save(O/'ashen_house_blueprint_overview_v1.png',optimize=True)

rooms_serial={}
for floor,arr in alllevels.items():
    rooms_serial[floor]=[]
    for r in arr:
        g=r['geom']
        if g.geom_type=='Polygon': coords=[list(map(lambda p:[round(p[0],2),round(p[1],2)], list(g.exterior.coords)[:-1]))]
        else:coords=[[list(p) for p in z.exterior.coords[:-1]] for z in g.geoms]
        rooms_serial[floor].append({'id':r['id'],'name':r['name'],'category':r['kind'],'polygons_ft':coords,'area_sqft':round(g.area,1),'fixtures':r['fixtures'],'story_purpose':r['story'],'label_point_ft':list(r['label'] or (round(g.centroid.x,1),round(g.centroid.y,1)))})
dd={floor:[{'id':i,'label':name,'point_ft':list(pos),'from':a,'to':b,'gate':gate,'wall_axis':orientation} for i,name,pos,a,b,gate,orientation in group] for floor,group in door_groups.items()}
meta={'title':'Cabin in the Ashen Veil - House Master Blueprint v1','status':'PROPOSED DIMENSIONED CONCEPT, NOT AUTHORITATIVE SPATIAL BLUEPRINT','orientation':'north up','unit':'feet','coordinate_origin':'southwest corner of main rectangular structural core (0,0); x increases east; y increases north','core_footprint_ft':{'width':76,'depth':52},'overall_extent_ft':{'xmin':-10,'xmax':90,'ymin':-7,'ymax':57},'wall_thickness_ft':{'external_nominal':1.0,'internal_nominal':0.6},'default_foundry_profile':'gridless, logical 120px/5ft, no painted grid','rooms':rooms_serial,'horizontal_portals':dd,'vertical_portals':vert,'windows':{f:[{'id':w[0],'point_ft':list(w[1]),'wall_axis':w[2]} for w in group] for f,group in windows.items()},'checks':checks,'pending':['actual owner approval of external footprint and floor geometry','optional story-room scene inclusion and map total recalculation','stair riser/landing / roof access structural design','scene stage transition adapter verification','Foundry authoritative Scene IDs and runtime receipt','room-specific Map PREPARE approval and Feature Manifest reconciliation']}
(O/'ashen_house_blueprint_geometry_v1.json').write_text(json.dumps(meta,indent=2,ensure_ascii=False))
print(json.dumps({'checks':checks,'files':[str(p) for p in O.iterdir()],'overview_px':out.size},indent=2))
