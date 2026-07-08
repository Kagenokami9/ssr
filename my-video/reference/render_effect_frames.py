#!/usr/bin/env python3
import math
import random
import shutil
import sys
from pathlib import Path

WIDTH = 1920
HEIGHT = 1080
FPS = 30


def ease_out_cubic(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1 - pow(1 - x, 3)


def ease_in_out(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def clamp(x: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, x))


def svg_header(alpha: bool) -> list[str]:
    return [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">',
        "<defs>",
        '<radialGradient id="spaceGlow" cx="52%" cy="56%" r="54%">'
        '<stop offset="0%" stop-color="#132a42"/><stop offset="38%" stop-color="#111630"/>'
        '<stop offset="100%" stop-color="#030712"/></radialGradient>',
        '<radialGradient id="robotBody" cx="40%" cy="24%" r="85%">'
        '<stop offset="0%" stop-color="#ffffff"/><stop offset="52%" stop-color="#dce9ff"/>'
        '<stop offset="100%" stop-color="#93a6bd"/></radialGradient>',
        '<radialGradient id="blueCore" cx="40%" cy="30%" r="70%">'
        '<stop offset="0%" stop-color="#8df4ff"/><stop offset="45%" stop-color="#4895ff"/>'
        '<stop offset="100%" stop-color="#1a47ff"/></radialGradient>',
        '<filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">'
        '<feGaussianBlur stdDeviation="16" result="blur"/><feMerge><feMergeNode in="blur"/>'
        '<feMergeNode in="SourceGraphic"/></feMerge></filter>',
        '<filter id="wideGlow" x="-120%" y="-120%" width="340%" height="340%">'
        '<feGaussianBlur stdDeviation="34" result="blur"/><feMerge><feMergeNode in="blur"/>'
        '<feMergeNode in="SourceGraphic"/></feMerge></filter>',
        "</defs>",
    ]


def star_field(seed: int, count: int, opacity: float = 1.0) -> str:
    rng = random.Random(seed)
    parts = []
    for _ in range(count):
        x = rng.randint(0, WIDTH)
        y = rng.randint(0, HEIGHT)
        r = rng.uniform(1.0, 2.8)
        a = opacity * rng.uniform(0.25, 0.95)
        parts.append(f'<circle cx="{x}" cy="{y}" r="{r:.2f}" fill="#f7fbff" opacity="{a:.3f}"/>')
    return "\n".join(parts)


def robot_svg(x: float, y: float, scale: float, phase: float, opacity: float = 1.0, tilt: float = 0.0) -> str:
    arm_swing = math.sin(phase) * 26
    leg_swing = math.sin(phase + math.pi) * 20
    return f"""
<g transform="translate({x:.1f} {y:.1f}) rotate({tilt:.1f}) scale({scale:.3f})" opacity="{opacity:.3f}" filter="url(#softGlow)">
  <ellipse cx="0" cy="-134" rx="92" ry="74" fill="url(#robotBody)"/>
  <ellipse cx="0" cy="-136" rx="56" ry="34" fill="#0a3358"/>
  <ellipse cx="18" cy="-146" rx="32" ry="19" fill="#58c7ff" opacity="0.9"/>
  <rect x="-78" y="-70" width="156" height="210" rx="34" fill="url(#robotBody)"/>
  <circle cx="0" cy="8" r="29" fill="url(#blueCore)"/>
  <circle cx="0" cy="8" r="46" fill="#348bff" opacity="0.24"/>
  <rect x="-133" y="-48" width="56" height="150" rx="28" fill="url(#robotBody)" transform="rotate({-12 + arm_swing * 0.15:.2f} -105 20)"/>
  <rect x="77" y="-48" width="56" height="150" rx="28" fill="url(#robotBody)" transform="rotate({12 - arm_swing * 0.15:.2f} 105 20)"/>
  <rect x="-70" y="128" width="58" height="154" rx="29" fill="url(#robotBody)" transform="translate({leg_swing:.1f} 0)"/>
  <rect x="12" y="128" width="58" height="154" rx="29" fill="url(#robotBody)" transform="translate({-leg_swing:.1f} 0)"/>
</g>"""


def robot_parts(x: float, y: float, p: float) -> str:
    items = [
        (-135, -80, -250, -120, -28, '<ellipse cx="0" cy="0" rx="56" ry="43" fill="url(#robotBody)"/>'),
        (70, -40, 260, -100, 34, '<rect x="-42" y="-55" width="84" height="110" rx="22" fill="url(#robotBody)"/>'),
        (-70, 65, -210, 160, -46, '<rect x="-28" y="-72" width="56" height="144" rx="28" fill="url(#robotBody)"/>'),
        (72, 72, 230, 145, 52, '<rect x="-28" y="-72" width="56" height="144" rx="28" fill="url(#robotBody)"/>'),
        (0, 0, 0, -210, 0, '<circle cx="0" cy="0" r="32" fill="url(#blueCore)"/>'),
    ]
    out = []
    for sx, sy, dx, dy, rot, shape in items:
        px = x + sx + dx * ease_out_cubic(p)
        py = y + sy + dy * ease_out_cubic(p) + 180 * p * p
        out.append(f'<g transform="translate({px:.1f} {py:.1f}) rotate({rot * p:.1f})" opacity="{1-p*0.65:.3f}" filter="url(#softGlow)">{shape}</g>')
    return "\n".join(out)


def smoke_cloud(cx: float, cy: float, p: float, cover: bool) -> str:
    rng = random.Random(2407)
    out = []
    count = 34 if cover else 16
    for i in range(count):
        ang = rng.uniform(-math.pi, math.pi)
        dist = rng.uniform(10, 580 if cover else 230) * ease_out_cubic(p)
        x = cx + math.cos(ang) * dist + rng.uniform(-20, 20)
        y = cy + math.sin(ang) * dist - 230 * p + rng.uniform(-20, 20)
        r = (rng.uniform(46, 145) if cover else rng.uniform(34, 95)) * (0.45 + 1.8 * p)
        color = rng.choice(["#d6e5f6", "#9fb3ca", "#64758d", "#263149", "#101728"])
        op = clamp((0.18 + 0.54 * p) * (1.0 - max(0, p - 0.76) * 1.5), 0, 0.72)
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{color}" opacity="{op:.3f}" filter="url(#wideGlow)"/>')
    return "\n".join(out)


def intro_frame(frame: int) -> str:
    t = frame / FPS
    parts = svg_header(alpha=False)
    parts.append('<rect width="1920" height="1080" fill="url(#spaceGlow)"/>')
    parts.append('<path d="M0 790 C360 710 620 865 960 760 C1280 662 1560 720 1920 620 L1920 1080 L0 1080 Z" fill="#07111d" opacity="0.64"/>')
    parts.append('<g opacity="0.14"><path d="M0 180 H1920 M0 360 H1920 M0 540 H1920 M0 720 H1920 M0 900 H1920 M240 0 V1080 M480 0 V1080 M720 0 V1080 M960 0 V1080 M1200 0 V1080 M1440 0 V1080 M1680 0 V1080" stroke="#9bc8ff" stroke-width="1"/></g>')
    parts.append(star_field(44, 95, opacity=0.75))
    parts.append('<circle cx="980" cy="516" r="260" fill="none" stroke="#8fc8ff" stroke-width="2" opacity="0.12"/>')
    parts.append('<circle cx="980" cy="516" r="156" fill="none" stroke="#d5e9ff" stroke-width="2" stroke-dasharray="10 22" opacity="0.22"/>')

    if t < 2.55:
        p = t / 2.55
        x = 220 + 1080 * ease_in_out(p)
        y = 705 + math.sin(t * 16) * 10
        parts.append(robot_svg(x, y, 0.82, t * 18, tilt=math.sin(t * 10) * 4))
        parts.append(f'<path d="M{x-96:.1f} {y+238:.1f} C{x-210:.1f} {y+258:.1f} {x-320:.1f} {y+242:.1f} {x-420:.1f} {y+260:.1f}" stroke="#61d6ff" stroke-width="8" opacity="0.18" fill="none" filter="url(#softGlow)"/>')
    elif t < 3.02:
        p = (t - 2.55) / 0.47
        x = 1300 + 470 * ease_out_cubic(p)
        y = 704 - 28 * p
        parts.append(robot_svg(x, y, 0.82, t * 26, tilt=16 * p))
        parts.append(f'<rect x="1780" y="530" width="28" height="360" rx="14" fill="#8ad7ff" opacity="{0.18 + 0.42*p:.3f}" filter="url(#softGlow)"/>')
        parts.append(f'<path d="M{x-160:.1f} {y+160:.1f} L{x-430:.1f} {y+210:.1f}" stroke="#83f3ff" stroke-width="12" opacity="0.28" filter="url(#softGlow)"/>')
    else:
        p = clamp((t - 3.02) / 0.98)
        cx, cy = 1740, 650
        burst = max(0, 1 - p * 1.35)
        parts.append(f'<circle cx="{cx}" cy="{cy}" r="{80 + 360*p:.1f}" fill="#ff8d35" opacity="{0.55*burst:.3f}" filter="url(#wideGlow)"/>')
        parts.append(f'<circle cx="{cx}" cy="{cy}" r="{42 + 210*p:.1f}" fill="#fff2a3" opacity="{0.70*burst:.3f}" filter="url(#softGlow)"/>')
        parts.append(robot_parts(cx, cy, p))
        parts.append(smoke_cloud(cx, cy, p, cover=True))
        parts.append(f'<rect width="1920" height="1080" fill="#020713" opacity="{clamp((p-0.72)/0.28)*0.55:.3f}"/>')

    parts.append("</svg>")
    return "\n".join(parts)


def shooting_star(event_t: float, t: float, sx: float, sy: float, length: float, hue: str) -> str:
    p = (t - event_t) / 0.85
    if p < 0 or p > 1:
        return ""
    e = ease_out_cubic(p)
    x = sx - 900 * e
    y = sy + 330 * e
    op = math.sin(math.pi * p)
    return f"""
<g opacity="{op:.3f}" filter="url(#softGlow)">
  <line x1="{x:.1f}" y1="{y:.1f}" x2="{x + length:.1f}" y2="{y - length*0.36:.1f}" stroke="{hue}" stroke-width="8" stroke-linecap="round"/>
  <line x1="{x + 18:.1f}" y1="{y - 6:.1f}" x2="{x + length + 150:.1f}" y2="{y - length*0.36 - 54:.1f}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.92"/>
</g>"""


def ufo_svg(t: float) -> str:
    start, end = 10.6, 14.9
    if t < start or t > end:
        return ""
    p = (t - start) / (end - start)
    x = 1820 - 1560 * ease_in_out(p)
    y = 205 + math.sin(t * 5.2) * 22
    bob = math.sin(t * 10) * 4
    beam_op = 0.12 * math.sin(math.pi * p)
    return f"""
<g transform="translate({x:.1f} {y + bob:.1f})" opacity="{math.sin(math.pi*p):.3f}" filter="url(#softGlow)">
  <ellipse cx="0" cy="0" rx="92" ry="23" fill="#85f7ff" opacity="0.92"/>
  <ellipse cx="0" cy="-18" rx="46" ry="30" fill="#b9ffcc" opacity="0.76"/>
  <circle cx="-46" cy="4" r="8" fill="#f7ff82"/><circle cx="0" cy="7" r="8" fill="#ff7ddb"/><circle cx="46" cy="4" r="8" fill="#f7ff82"/>
  <path d="M-42 18 L38 18 L118 180 L-118 180 Z" fill="#7dffb3" opacity="{beam_op:.3f}"/>
</g>"""


def motion_glow(t: float) -> str:
    pulse = 0.5 + 0.5 * math.sin(t * 7.5)
    ring_y = 760 + math.sin(t * 2.1) * 18
    out = [
        f'<ellipse cx="960" cy="{ring_y:.1f}" rx="{270 + 18*pulse:.1f}" ry="{198 + 10*pulse:.1f}" fill="none" stroke="#70d6ff" stroke-width="4" opacity="{0.13 + 0.07*pulse:.3f}" filter="url(#softGlow)"/>',
        f'<path d="M820 740 C770 700 770 825 825 795" stroke="#c4f4ff" stroke-width="10" opacity="{0.18 + 0.12*pulse:.3f}" fill="none" stroke-linecap="round" filter="url(#softGlow)"/>',
        f'<path d="M1098 724 C1162 686 1164 822 1098 794" stroke="#c4f4ff" stroke-width="10" opacity="{0.18 + 0.12*(1-pulse):.3f}" fill="none" stroke-linecap="round" filter="url(#softGlow)"/>',
    ]
    for i in range(10):
        a = t * 1.7 + i * 0.63
        x = 960 + math.cos(a) * (190 + (i % 3) * 34)
        y = 764 + math.sin(a * 1.2) * (150 + (i % 2) * 28)
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{4 + (i % 4):.1f}" fill="#c8f7ff" opacity="{0.22 + 0.12*math.sin(a):.3f}" filter="url(#softGlow)"/>')
    return "\n".join(out)


def effect_frame(frame: int) -> str:
    t = frame / FPS
    parts = svg_header(alpha=True)
    if 8.0 <= t <= 19.0:
        local = t - 8.0
        parts.append(motion_glow(t))
        parts.append(ufo_svg(t))
        events = [
            (8.35, 1770, 95, 360, "#8cf6ff"),
            (9.75, 1510, 170, 290, "#d6a4ff"),
            (11.40, 1880, 320, 340, "#ffffff"),
            (13.10, 1640, 82, 315, "#89ffca"),
            (15.65, 1765, 248, 380, "#75b9ff"),
            (17.55, 1420, 130, 300, "#fff1a6"),
        ]
        for event in events:
            parts.append(shooting_star(*event[:1], t, *event[1:]))
        rng = random.Random(8800 + frame // 3)
        for _ in range(14):
            x = rng.randint(80, 1840)
            y = rng.randint(30, 1010)
            r = rng.uniform(1.5, 4.2)
            a = rng.uniform(0.04, 0.22) * (0.55 + 0.45 * math.sin(local * 2.4))
            parts.append(f'<circle cx="{x}" cy="{y}" r="{r:.1f}" fill="#bff7ff" opacity="{a:.3f}" filter="url(#softGlow)"/>')
    parts.append("</svg>")
    return "\n".join(parts)


def write_frames(kind: str, out_dir: Path) -> None:
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    if kind == "intro":
        total = 4 * FPS
        renderer = intro_frame
    elif kind == "effects":
        total = 600
        renderer = effect_frame
    else:
        raise ValueError("kind must be intro or effects")
    for frame in range(total):
        (out_dir / f"{frame:04d}.svg").write_text(renderer(frame), encoding="utf-8")


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: render_effect_frames.py [intro|effects] OUT_DIR")
    write_frames(sys.argv[1], Path(sys.argv[2]))


if __name__ == "__main__":
    main()
