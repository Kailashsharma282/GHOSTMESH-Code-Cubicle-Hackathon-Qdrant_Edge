"""
Video and audio compositing script for GHOSTMESH 3-minute demo video.
Takes Playwright raw 1920x1080 30fps screen recording (.webm)
and master audio soundtrack (48kHz stereo .wav)
and renders the final high-definition MP4:
GHOSTMESH_CodeCubicle6_Demo.mp4 (exactly 180.0s / 3:00).
"""
import os
import glob
import subprocess
import sys

FFMPEG_EXE = r"C:\Users\kaila\anaconda3\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
OUTPUT_MP4 = os.path.abspath("GHOSTMESH_CodeCubicle6_Demo.mp4")
AUDIO_FILE = os.path.abspath("data/video_assets/final_soundtrack_master.wav")
RAW_DIR = os.path.abspath("data/video_assets/raw_recording")

def main():
    webms = glob.glob(os.path.join(RAW_DIR, "*.webm"))
    if not webms:
        print("ERROR: No .webm video files found in", RAW_DIR)
        sys.exit(1)
        
    # Get the latest webm
    input_video = max(webms, key=os.path.getmtime)
    print(f"Selected raw screen recording: {input_video}")
    print(f"Master soundtrack: {AUDIO_FILE}")
    print(f"Target output: {OUTPUT_MP4}")
    
    if not os.path.exists(AUDIO_FILE):
        print("ERROR: Master audio file not found:", AUDIO_FILE)
        sys.exit(1)
        
    cmd = [
        FFMPEG_EXE,
        "-y",
        "-i", input_video,
        "-i", AUDIO_FILE,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-r", "30",
        "-c:a", "aac",
        "-b:a", "256k",
        "-ar", "48000",
        "-t", "180.0",
        "-shortest",
        OUTPUT_MP4
    ]
    
    print("Executing FFmpeg composite command...")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print("FFmpeg error:", res.stderr)
        sys.exit(res.returncode)
        
    print("SUCCESS: Rendered GHOSTMESH_CodeCubicle6_Demo.mp4!")
    
    # Inspect output
    verify_cmd = [FFMPEG_EXE, "-i", OUTPUT_MP4]
    verify_res = subprocess.run(verify_cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    print("\n--- Output Video Information ---")
    for line in verify_res.stderr.split("\n"):
        if any(keyword in line for keyword in ["Duration:", "Stream #0:0", "Stream #0:1"]):
            print(line.strip())

if __name__ == "__main__":
    main()
