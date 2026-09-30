"""
High-performance audio synthesizer & mixer for GHOSTMESH 3-minute demo video.
Generates:
1. Warm ambient synth pad (48kHz stereo, 180.0s)
2. Subtle UI SFX (disconnect glitch, reconnect ping, conflict alert, resolution chime)
3. Full ducking & composite with edge-tts narration tracks
"""
import os
import subprocess
import numpy as np
from scipy.io import wavfile
from scipy.ndimage import uniform_filter1d

FFMPEG_EXE = r"C:\Users\kaila\anaconda3\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
SR = 48000
TOTAL_DURATION = 180.0
TOTAL_SAMPLES = int(SR * TOTAL_DURATION)

def create_ambient_pad():
    """Vectorized ambient pad generation using NumPy."""
    t = np.linspace(0, TOTAL_DURATION, TOTAL_SAMPLES, endpoint=False)
    
    # 4 cycling chords across 180s (each 45s)
    # Frequencies: D2 (73.42Hz), F2 (87.31Hz), C2 (65.41Hz), Bb1 (58.27Hz)
    chord_indices = (t / 45.0).astype(int) % 4
    base_freqs = np.array([73.42, 87.31, 65.41, 58.27])
    f0 = base_freqs[chord_indices]
    
    sub = np.sin(2 * np.pi * f0 * 0.5 * t) * 0.35
    fund = np.sin(2 * np.pi * f0 * t) * 0.40
    fifth = np.sin(2 * np.pi * f0 * 1.5 * t) * 0.20
    octave = np.sin(2 * np.pi * f0 * 2.0 * t + 0.5) * 0.15
    shimmer = np.sin(2 * np.pi * f0 * 3.01 * t + np.sin(t * 0.4) * 0.5) * 0.08
    
    val = sub + fund + fifth + octave + shimmer
    
    # Stereo movement
    pad_left = val * (0.8 + 0.2 * np.sin(2 * np.pi * 0.15 * t))
    pad_right = val * (0.8 + 0.2 * np.cos(2 * np.pi * 0.15 * t))
    
    # Subtle tech heartbeat pulse every 2.0s
    beat_phase = (t % 2.0)
    pulse_mask = beat_phase < 0.04
    click = np.zeros_like(t)
    click[pulse_mask] = np.sin(2 * np.pi * 880 * beat_phase[pulse_mask]) * np.exp(-beat_phase[pulse_mask] * 80) * 0.04
    
    pad_left += click
    pad_right += click
    
    # Fade in / out
    fade_in = np.clip(t / 3.0, 0.0, 1.0)
    fade_out = np.clip((TOTAL_DURATION - t) / 4.0, 0.0, 1.0)
    envelope = fade_in * fade_out
    
    pad_left *= envelope * 0.12
    pad_right *= envelope * 0.12
    return pad_left, pad_right

def generate_sfx():
    """Create distinct subtle technical SFX clips."""
    # 1. Sever/Disconnect glitch chirp
    t_sfx = np.linspace(0, 0.6, int(SR * 0.6), endpoint=False)
    disconnect = (np.sin(2 * np.pi * (440 - 200 * t_sfx) * t_sfx) * np.exp(-t_sfx * 8)) * 0.18
    
    # 2. Reconnect harmonic ping
    t_rec = np.linspace(0, 0.8, int(SR * 0.8), endpoint=False)
    reconnect = (np.sin(2 * np.pi * 659.25 * t_rec) * 0.5 + np.sin(2 * np.pi * 987.77 * t_rec) * 0.5) * np.exp(-t_rec * 5) * 0.16
    
    # 3. Conflict alert tone
    t_conf = np.linspace(0, 0.7, int(SR * 0.7), endpoint=False)
    conflict = (np.sin(2 * np.pi * 311.13 * t_conf) * 0.5 + np.sin(2 * np.pi * 329.63 * t_conf) * 0.5) * np.exp(-t_conf * 6) * 0.15
    
    # 4. Canonical resolution chime
    t_res = np.linspace(0, 1.2, int(SR * 1.2), endpoint=False)
    resolve = (np.sin(2 * np.pi * 523.25 * t_res) * 0.4 + 
               np.sin(2 * np.pi * 659.25 * t_res) * 0.3 + 
               np.sin(2 * np.pi * 783.99 * t_res) * 0.3) * np.exp(-t_res * 3.5) * 0.18
               
    return disconnect, reconnect, conflict, resolve

def main():
    print("Synthesizing ambient musical score (vectorized)...")
    music_l, music_r = create_ambient_pad()
    disconnect_sfx, reconnect_sfx, conflict_sfx, resolve_sfx = generate_sfx()
    
    # Inject SFX at key narrative inflection points:
    # 52.0s: Disconnect Device A
    idx_disc = int(52.0 * SR)
    music_l[idx_disc:idx_disc+len(disconnect_sfx)] += disconnect_sfx
    music_r[idx_disc:idx_disc+len(disconnect_sfx)] += disconnect_sfx
    
    # 97.0s: Reconnect Device A
    idx_rec = int(97.0 * SR)
    music_l[idx_rec:idx_rec+len(reconnect_sfx)] += reconnect_sfx
    music_r[idx_rec:idx_rec+len(reconnect_sfx)] += reconnect_sfx
    
    # 121.5s: Conflict Candidate Detected
    idx_conf = int(121.5 * SR)
    music_l[idx_conf:idx_conf+len(conflict_sfx)] += conflict_sfx
    music_r[idx_conf:idx_conf+len(conflict_sfx)] += conflict_sfx
    
    # 147.0s: Canonical Synthesis Resolved
    idx_res = int(147.0 * SR)
    music_l[idx_res:idx_res+len(resolve_sfx)] += resolve_sfx
    music_r[idx_res:idx_res+len(resolve_sfx)] += resolve_sfx
    
    bg_stereo = np.vstack([music_l, music_r]).T
    bg_stereo = np.clip(bg_stereo, -1.0, 1.0)
    bg_path = "data/video_assets/ambient_score_sfx.wav"
    wavfile.write(bg_path, SR, (bg_stereo * 32767).astype(np.int16))
    print(f"Saved ambient score to {bg_path}")
    
    # Narration cues
    narration_cues = [
        ("data/video_assets/narration/scene02_problem.mp3", 11.5),
        ("data/video_assets/narration/scene03_edge_memory.mp3", 29.5),
        ("data/video_assets/narration/scene04_kill_network.mp3", 52.0),
        ("data/video_assets/narration/scene05_privacy.mp3", 76.5),
        ("data/video_assets/narration/scene06_reconnect.mp3", 97.5),
        ("data/video_assets/narration/scene07_conflict.mp3", 121.5),
        ("data/video_assets/narration/scene08_canonical.mp3", 147.0),
        ("data/video_assets/narration/scene09_converged.mp3", 165.5),
    ]
    
    voice_track = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)
    
    for mp3_file, start_sec in narration_cues:
        temp_wav = mp3_file.replace(".mp3", "_temp.wav")
        subprocess.run([FFMPEG_EXE, "-y", "-i", mp3_file, "-ar", str(SR), "-ac", "2", temp_wav], 
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        _, data = wavfile.read(temp_wav)
        data = data.astype(np.float32) / 32768.0
        
        start_idx = int(start_sec * SR)
        end_idx = min(start_idx + len(data), TOTAL_SAMPLES)
        length = end_idx - start_idx
        
        voice_track[start_idx:end_idx] += data[:length] * 0.95
        if os.path.exists(temp_wav):
            os.remove(temp_wav)
        print(f"Placed narration {os.path.basename(mp3_file)} at {start_sec}s")
        
    # Audio ducking: duck ambient music by up to 60% during voice activity
    voice_energy = np.abs(voice_track[:, 0]) + np.abs(voice_track[:, 1])
    window_len = int(SR * 0.3)
    # O(N) uniform filter instead of O(N*M) convolve
    smooth_energy = uniform_filter1d(voice_energy, size=window_len)
    
    duck_factor = 1.0 - np.clip(smooth_energy * 3.0, 0.0, 0.60)
    
    final_left = (bg_stereo[:, 0] * duck_factor) + voice_track[:, 0]
    final_right = (bg_stereo[:, 1] * duck_factor) + voice_track[:, 1]
    
    final_stereo = np.vstack([final_left, final_right]).T
    peak = np.max(np.abs(final_stereo))
    if peak > 0:
        final_stereo = final_stereo * (0.94 / peak)
        
    master_path = "data/video_assets/final_soundtrack_master.wav"
    wavfile.write(master_path, SR, (final_stereo * 32767).astype(np.int16))
    print(f"SUCCESS: Generated 180.0s master audio soundtrack at {master_path}")

if __name__ == "__main__":
    main()
