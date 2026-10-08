"""Подготовка сгенерированных картинок для слайдов.

  python3 src/process_images.py frame   in.jpg out.png [radius]   # скруглённые углы
  python3 src/process_images.py sticker in.jpg out.png            # убрать фон вокруг стикера
"""
import sys
from collections import deque

from PIL import Image, ImageDraw, ImageFilter


def frame(src, dst, radius=0.07):
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    mask = Image.new("L", (w * 4, h * 4), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), radius=int(min(w, h) * radius * 4), fill=255)
    img.putalpha(mask.resize((w, h), Image.LANCZOS))
    img.save(dst)


def sticker(src, dst, tol=12):
    """Фон, связанный с краями картинки и близкий к цвету угла, становится прозрачным.
    Допуск маленький, чтобы белая обводка стикера (и белые котики за ней) остались."""
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    px = img.load()
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    bg = tuple(sorted(c[i] for c in corners)[2] for i in range(3))  # медиана по углам

    def close(c):
        return abs(c[0] - bg[0]) + abs(c[1] - bg[1]) + abs(c[2] - bg[2]) <= tol * 3

    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    alpha = Image.new("L", (w, h), 255)
    ap = alpha.load()
    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        if not close(px[x, y]):
            continue
        ap[x, y] = 0
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    # мягкий край без ореола
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    img.putalpha(alpha)
    bbox = alpha.point(lambda a: 255 if a > 20 else 0).getbbox()
    if bbox:
        img = img.crop(bbox)
    # квадратный холст, чтобы на слайде картинка не искажалась
    side = max(img.size) + 16
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2), img)
    canvas.save(dst)


if __name__ == "__main__":
    mode, src, dst = sys.argv[1:4]
    if mode == "frame":
        frame(src, dst, *(float(a) for a in sys.argv[4:5]))
    else:
        sticker(src, dst)
