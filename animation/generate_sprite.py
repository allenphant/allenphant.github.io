import sys
import subprocess
import os

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    from PIL import Image, ImageDraw
except ImportError:
    install('pillow')
    from PIL import Image, ImageDraw

palette = {
    '.': (0,0,0,0),
    'W': (242,244,247,255), # Frieren White
    'S': (226,232,240,255), # Hair Silver
    'H': (255,224,189,255), # Skin
    'G': (197,160,89,255), # Gold
    'B': (139,69,19,255), # Brown Staff
    'R': (239,68,68,255), # Red Gem
    'D': (59,59,88,255),  # Dark Tights
    'E': (125,162,169,255), # Eye Green
    'K': (45,45,45,255),  # Black belt
    'T': (101,67,33,255)  # Boots
}

base_grid = [
    "................................",
    "................................",
    ".............SSSSSS.............",
    "............SSSSSSSS............",
    "...........SSSHHHHSS............",
    "...........SHHHEEHHSS...........",
    "...........SSHHHHHSSS...........",
    "....S.......SSSSSSSS.......S....",
    "...S.S.....WWWWWWWWWW.....S.S...",
    "..S..S.....WGGWWWWGGW.....S..S..",
    "..S..S....WWWWWWWWWWWW....S..SR.",
    ".S...S....WWWWWWWWWWWW....S..SG.",
    ".S....S...WWWWKKKKWWWW...S...SB.",
    "S.....S...WWWWKKKKWWWW...S....SB",
    "S......S..WWWWWWWWWWWW..S......B",
    "S.........GWWWWWWWWWWG..S......B",
    "...........WWWWWWWWWW..........B",
    "...........GWWWWWWWWG..........B",
    "............WWWWWWWW...........B",
    "............WWWWWWWW...........B",
    "............WWWWWWWW...........B",
    "............GWWWWWWG...........B",
    ".............DDDDDD............B",
    ".............DDDDDD............B",
    ".............DDDDDD............B",
    ".............TTTTTT.............",
    ".............TTTTTT.............",
    ".............TT..TT.............",
    ".............TT..TT.............",
    "................................",
    "................................",
    "................................",
]

# Create 4 frames for the hover animation
frames_grids = []
for i in range(4):
    frames_grids.append([["." for _ in range(32)] for _ in range(32)])

# Anim logic:
# F0: body y=0, hair_ends y=0
# F1: body y=-1, hair_ends y=0
# F2: body y=-2, hair_ends y=-1 
# F3: body y=-1, hair_ends y=-1

offsets = [
    {'body': 0, 'hair': 0},
    {'body': -1, 'hair': 0},
    {'body': -2, 'hair': -1},
    {'body': -1, 'hair': -1}
]

for f_idx in range(4):
    bo = offsets[f_idx]['body']
    ho = offsets[f_idx]['hair']
    
    for y in range(32):
        for x in range(32):
            char = base_grid[y][x]
            if char == '.': continue
            
            # Is this pixel a loose twintail end? (S outside central body area)
            is_hair_edge = (char == 'S') and (x < 8 or x > 23)
            
            if is_hair_edge:
                new_y = y + ho
            else:
                new_y = y + bo
                
            if 0 <= new_y < 32:
                frames_grids[f_idx][new_y][x] = char

# Render to 256x64 image (32 pixels * 4 frames * 2 scale)
scale = 2
img_w = 32 * 4 * scale
img_h = 32 * scale

img = Image.new("RGBA", (img_w, img_h), (0,0,0,0))
draw = ImageDraw.Draw(img)

for f_idx in range(4):
    offset_x = f_idx * 32 * scale
    grid = frames_grids[f_idx]
    
    for y in range(32):
        for x in range(32):
            char = grid[y][x]
            color = palette.get(char, (0,0,0,0))
            if color[3] > 0: # If not transparent
                px = offset_x + x * scale
                py = y * scale
                draw.rectangle([px, py, px+scale-1, py+scale-1], fill=color)

out_dir = r"C:\Users\raging\Desktop\Vibe_coding\CVwebsite\animation"
os.makedirs(out_dir, exist_ok=True)
img.save(os.path.join(out_dir, "frieren_idle_sprite.png"))
print("Generated frieren_idle_sprite.png successfully!")
