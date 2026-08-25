from __future__ import annotations

import argparse
import math
import subprocess
import wave
from pathlib import Path

from PIL import Image, ImageDraw


WIDTH, HEIGHT = 1080, 1920
FPS = 30
SCENE_SECONDS = 3.0
SCENE_COUNT = 6
DURATION = SCENE_SECONDS * SCENE_COUNT
TRANSITION = 0.58


def load_posters(directory: Path) -> list[Image.Image]:
    posters = []
    for index in range(1, SCENE_COUNT + 1):
        path = directory / f"locandina-premium-{index:02d}.jpg"
        image = Image.open(path).convert("RGB")
        if image.size != (WIDTH, HEIGHT):
            image = image.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
        posters.append(image)
    return posters


def ease(value: float) -> float:
    return 0.5 - 0.5 * math.cos(math.pi * max(0.0, min(1.0, value)))


def animate(image: Image.Image, progress: float, direction: int) -> Image.Image:
    eased = ease(progress)
    scale = 1.0 + 0.018 * eased
    enlarged = image.resize((round(WIDTH * scale), round(HEIGHT * scale)), Image.Resampling.LANCZOS)
    max_x = enlarged.width - WIDTH
    max_y = enlarged.height - HEIGHT
    x = max_x // 2 + round(direction * max_x * 0.12 * (eased - 0.5))
    y = max_y // 2 + round(direction * max_y * 0.10 * (0.5 - eased))
    x = max(0, min(max_x, x))
    y = max(0, min(max_y, y))
    frame = enlarged.crop((x, y, x + WIDTH, y + HEIGHT))

    # A restrained moving reflection adds motion without changing the poster design.
    sweep = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sweep)
    sweep_x = round(-420 + (WIDTH + 840) * progress)
    draw.polygon(
        [(sweep_x - 170, 0), (sweep_x + 30, 0), (sweep_x + 470, HEIGHT), (sweep_x + 220, HEIGHT)],
        fill=(255, 226, 150, 12),
    )
    return Image.alpha_composite(frame.convert("RGBA"), sweep).convert("RGB")


def make_audio(path: Path) -> None:
    rate = 44100
    frame_count = round(DURATION * rate)
    scene_chords = [
        (130.81, 164.81, 196.00),
        (146.83, 174.61, 220.00),
        (123.47, 155.56, 185.00),
        (138.59, 174.61, 207.65),
        (130.81, 164.81, 220.00),
        (130.81, 196.00, 261.63),
    ]
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        data = bytearray()
        for i in range(frame_count):
            t = i / rate
            scene = min(SCENE_COUNT - 1, int(t // SCENE_SECONDS))
            chord = scene_chords[scene]
            fade_in = min(1.0, t / 1.2)
            fade_out = min(1.0, (DURATION - t) / 1.4)
            envelope = max(0.0, fade_in * fade_out)
            pad = sum(math.sin(2 * math.pi * frequency * t + j * 0.8) for j, frequency in enumerate(chord)) / 3
            air = math.sin(2 * math.pi * (392.0 + 8 * math.sin(t * 0.23)) * t) * 0.045
            chime = 0.0
            for start in (0, 3, 6, 9, 12, 15):
                dt = t - start
                if 0 <= dt < 1.5:
                    chime += (
                        math.sin(2 * math.pi * 783.99 * dt)
                        + 0.45 * math.sin(2 * math.pi * 1046.50 * dt)
                    ) * math.exp(-3.0 * dt) * 0.16
            sample = max(-1.0, min(1.0, envelope * (pad * 0.23 + air + chime)))
            left = round(sample * 32767)
            right = round(sample * 0.96 * 32767)
            data += left.to_bytes(2, "little", signed=True)
            data += right.to_bytes(2, "little", signed=True)
        wav.writeframes(data)


def render(posters: list[Image.Image], audio: Path, output: Path, ffmpeg: Path) -> None:
    command = [
        str(ffmpeg), "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{WIDTH}x{HEIGHT}", "-r", str(FPS), "-i", "-",
        "-i", str(audio),
        "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", str(output),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert process.stdin is not None
    total_frames = round(DURATION * FPS)
    for frame_index in range(total_frames):
        t = frame_index / FPS
        scene_index = min(SCENE_COUNT - 1, int(t // SCENE_SECONDS))
        local_t = t - scene_index * SCENE_SECONDS
        progress = local_t / SCENE_SECONDS
        direction = 1 if scene_index % 2 == 0 else -1
        frame = animate(posters[scene_index], progress, direction)

        if scene_index < SCENE_COUNT - 1 and local_t > SCENE_SECONDS - TRANSITION:
            amount = ease((local_t - (SCENE_SECONDS - TRANSITION)) / TRANSITION)
            next_frame = animate(posters[scene_index + 1], amount * 0.16, -direction)
            frame = Image.blend(frame, next_frame, amount)

        if t < 0.42:
            frame = Image.blend(Image.new("RGB", (WIDTH, HEIGHT), (7, 2, 20)), frame, ease(t / 0.42))
        if DURATION - t < 0.55:
            frame = Image.blend(frame, Image.new("RGB", (WIDTH, HEIGHT), (7, 2, 20)), ease((0.55 - (DURATION - t)) / 0.55))

        process.stdin.write(frame.tobytes())
    process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("Il rendering del Reel premium non è stato completato")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--posters", type=Path, required=True)
    parser.add_argument("--ffmpeg", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    posters = load_posters(args.posters)
    audio = args.output.with_name("audio-originale-premium-v2.wav")
    make_audio(audio)
    render(posters, audio, args.output, args.ffmpeg)


if __name__ == "__main__":
    main()
