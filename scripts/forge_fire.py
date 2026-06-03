#!/usr/bin/env python3
import curses
import random
import sys
from pathlib import Path


DEFAULT_CHARS = " .:^*xsS#$"
BANNER = (
    "░▀█▀░█░█░█▀▀░░░█▀▀░█▀█░█▀▄░█▀▀░█▀▀░░░▀█▀░█▀▀░░░█░░░▀█▀░▀█▀\n"
    "░░█░░█▀█░█▀▀░░░█▀▀░█░█░█▀▄░█░█░█▀▀░░░░█░░▀▀█░░░█░░░░█░░░█░\n"
    "░░▀░░▀░▀░▀▀▀░░░▀░░░▀▀▀░▀░▀░▀▀▀░▀▀▀░░░▀▀▀░▀▀▀░░░▀▀▀░▀▀▀░░▀░"
)
COLOR_NAMES = {
    "black": curses.COLOR_BLACK,
    "red": curses.COLOR_RED,
    "orange": curses.COLOR_YELLOW,
    "green": curses.COLOR_GREEN,
    "yellow": curses.COLOR_YELLOW,
    "blue": curses.COLOR_BLUE,
    "magenta": curses.COLOR_MAGENTA,
    "cyan": curses.COLOR_CYAN,
    "white": curses.COLOR_WHITE,
}
FLAME_PALETTES = {
    "blue": {
        "dominant": "cyan",
        "gradient.low": "black",
        "gradient.mid": "blue",
        "gradient.hot": "cyan",
        "gradient.core": "white",
    },
    "red": {
        "dominant": "yellow",
        "gradient.low": "red",
        "gradient.mid": "orange",
        "gradient.hot": "yellow",
        "gradient.core": "white",
    },
    "green": {
        "dominant": "green",
        "gradient.low": "black",
        "gradient.mid": "green",
        "gradient.hot": "cyan",
        "gradient.core": "white",
    },
    "cyan": {
        "dominant": "cyan",
        "gradient.low": "black",
        "gradient.mid": "cyan",
        "gradient.hot": "white",
        "gradient.core": "white",
    },
    "purple": {
        "dominant": "magenta",
        "gradient.low": "black",
        "gradient.mid": "magenta",
        "gradient.hot": "cyan",
        "gradient.core": "white",
    },
    "yellow": {
        "dominant": "yellow",
        "gradient.low": "red",
        "gradient.mid": "yellow",
        "gradient.hot": "white",
        "gradient.core": "white",
    },
    "grayscale": {
        "dominant": "white",
        "gradient.low": "black",
        "gradient.mid": "black",
        "gradient.hot": "white",
        "gradient.core": "white",
    },
}


def load_properties(path: str | None) -> dict[str, str]:
    if not path:
        return {}

    properties_path = Path(path)
    if not properties_path.exists():
        return {}

    properties: dict[str, str] = {}
    for raw_line in properties_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        properties[key.strip()] = value.strip()

    return properties


def bool_property(properties: dict[str, str], key: str, default: bool) -> bool:
    value = properties.get(key)
    if value is None:
        return default

    return value.lower() in {"true", "yes", "on", "1"}


def int_property(properties: dict[str, str], key: str, default: int, minimum: int) -> int:
    try:
        value = int(properties.get(key, str(default)))
    except ValueError:
        return default

    return max(minimum, value)


def clamp(value: int, minimum: int, maximum: int) -> int:
    return max(minimum, min(maximum, value))


def color_property(properties: dict[str, str], key: str, default: str) -> int:
    return COLOR_NAMES.get(properties.get(key, default).lower(), COLOR_NAMES[default])


def selected_palette(properties: dict[str, str]) -> dict[str, str]:
    palette_name = properties.get("flame.palette", "blue").lower()
    return FLAME_PALETTES.get(palette_name, FLAME_PALETTES["blue"])


def dominant_color_name(properties: dict[str, str]) -> str:
    return selected_palette(properties).get("dominant", "cyan")


def gradient_color_name(properties: dict[str, str], key: str, default: str) -> str:
    if key in properties:
        return properties[key]

    return selected_palette(properties).get(key, default)


def gradient_color_property(properties: dict[str, str], key: str, default: str) -> int:
    color_name = gradient_color_name(properties, key, default).lower()
    return COLOR_NAMES.get(color_name, COLOR_NAMES[default])


def init_colors(properties: dict[str, str]) -> bool:
    curses.start_color()

    if not curses.has_colors() or curses.COLOR_PAIRS <= 1:
        return False

    background = -1

    try:
        curses.use_default_colors()
    except curses.error:
        background = curses.COLOR_BLACK

    curses.init_pair(1, gradient_color_property(properties, "gradient.low", "black"), background)
    curses.init_pair(2, gradient_color_property(properties, "gradient.mid", "blue"), background)
    curses.init_pair(3, gradient_color_property(properties, "gradient.hot", "cyan"), background)
    curses.init_pair(4, gradient_color_property(properties, "gradient.core", "white"), background)
    dominant_color = dominant_color_name(properties)
    curses.init_pair(5, color_property(properties, "status.banner.color", dominant_color), background)
    curses.init_pair(6, color_property(properties, "status.text.color", "white"), background)
    curses.init_pair(7, color_property(properties, "border.color", dominant_color), background)
    return True


def color_attr(pair: int, has_color: bool) -> int:
    if not has_color:
        return curses.A_BOLD
    return curses.color_pair(pair) | curses.A_BOLD


def add_centered(
    screen: curses.window,
    row: int,
    line: str,
    width: int,
    attr: int,
) -> None:
    visible_width = max(0, width - 1)
    if visible_width == 0:
        return

    rendered = line[:visible_width]
    column = max(0, (width - len(rendered)) // 2)

    try:
        screen.addstr(row, column, rendered, attr)
    except curses.error:
        pass


def draw_fire_box(
    screen: curses.window,
    top: int,
    left: int,
    height: int,
    width: int,
    has_color: bool,
) -> None:
    attr = color_attr(7, has_color)
    if height < 2 or width < 2:
        return

    try:
        screen.addstr(top, left, "┌" + "─" * (width - 2) + "┐", attr)
        for row in range(1, height - 1):
            screen.addstr(top + row, left, "│", attr)
            screen.addstr(top + row, left + width - 1, "│", attr)
        screen.addstr(top + height - 1, left, "└" + "─" * (width - 2) + "┘", attr)
    except curses.error:
        pass


def draw_status(
    screen: curses.window,
    height: int,
    width: int,
    has_color: bool,
    show_banner: bool,
) -> None:
    status_lines = [
        "Backend:  http://localhost:8000",
        "Frontend: http://localhost:5173",
        "Logs:     .logs/backend.log and .logs/frontend.log",
        "Press any key or Ctrl+C to quench the forge.",
    ]
    banner_lines = BANNER.splitlines() if show_banner else []
    start_row = max(0, height - len(status_lines) - len(banner_lines) - 1)

    for offset, line in enumerate(banner_lines):
        add_centered(screen, start_row + offset, line, width, color_attr(5, has_color))

    status_start = start_row + len(banner_lines) + 1
    for offset, line in enumerate(status_lines):
        try:
            screen.addstr(
                status_start + offset,
                0,
                line[: max(0, width - 1)],
                curses.color_pair(6) if has_color else curses.A_NORMAL,
            )
        except curses.error:
            pass


def animate(screen: curses.window, properties: dict[str, str]) -> None:
    try:
        curses.curs_set(0)
    except curses.error:
        pass

    has_color = init_colors(properties)
    screen.clear()
    fps = int_property(properties, "animation.fps", 30, 1)
    intensity = int_property(properties, "animation.intensity", 9, 1)
    width_ratio = int_property(properties, "animation.width_ratio", 3, 1)
    show_border = bool_property(properties, "animation.border.enabled", True)
    chars = list(properties.get("animation.charset", DEFAULT_CHARS))
    if len(chars) < 10:
        chars = list(DEFAULT_CHARS)
    show_banner = bool_property(properties, "status.banner.enabled", True)

    screen.timeout(max(1, int(1000 / fps)))

    while True:
        status_rows = 8
        previous_dimensions: tuple[int, int] | None = None
        buffer: list[int] = []

        while True:
            height, width = screen.getmaxyx()
            box_height = max(3, height - status_rows)
            box_width = clamp(width // width_ratio, 20, max(20, width - 2))
            box_top = 0
            box_left = max(0, (width - box_width) // 2)
            fire_top = box_top + 1 if show_border else box_top
            fire_left = box_left + 1 if show_border else box_left
            fire_height = max(1, box_height - 2 if show_border else box_height)
            fire_width = max(1, box_width - 2 if show_border else box_width)
            size = fire_width * fire_height

            current_dimensions = (fire_height, fire_width)
            if current_dimensions != previous_dimensions:
                buffer = [0] * (size + fire_width + 1)
                previous_dimensions = current_dimensions
            elif len(buffer) < size + fire_width + 1:
                buffer = [0] * (size + fire_width + 1)

            for _ in range(max(1, fire_width // intensity)):
                buffer[int(random.random() * fire_width) + fire_width * (fire_height - 1)] = 65

            screen.erase()
            if show_border:
                draw_fire_box(screen, box_top, box_left, box_height, box_width, has_color)

            for i in range(size):
                buffer[i] = int(
                    (
                        buffer[i]
                        + buffer[i + 1]
                        + buffer[i + fire_width]
                        + buffer[i + fire_width + 1]
                    )
                    / 4
                )
                color = 4 if buffer[i] > 15 else 3 if buffer[i] > 9 else 2 if buffer[i] > 4 else 1
                char = chars[9 if buffer[i] > 9 else buffer[i]]

                if i < size - 1:
                    try:
                        screen.addstr(
                            fire_top + int(i / fire_width),
                            fire_left + (i % fire_width),
                            char,
                            color_attr(color, has_color),
                        )
                    except curses.error:
                        pass

            draw_status(screen, height, width, has_color, show_banner)
            screen.refresh()

            try:
                key = screen.getch()
                if key == curses.KEY_RESIZE:
                    screen.clear()
                    previous_dimensions = None
                    continue
                if key != -1:
                    return
            except KeyboardInterrupt:
                return


def main() -> None:
    properties_path = sys.argv[1] if len(sys.argv) > 1 else None
    properties = load_properties(properties_path)

    try:
        curses.wrapper(animate, properties)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
