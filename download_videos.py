import os
import subprocess

yt_dlp_path = r"C:\Users\nagar\AppData\Local\Programs\Python\Python312\Scripts\yt-dlp.exe"

videos = {
    "indian_highway_traffic": "ytsearch1:indian highway traffic cctv short",
    "chennai_cctv_traffic": "ytsearch1:chennai traffic cctv camera short",
    "bangalore_traffic_feed": "ytsearch1:bangalore traffic cctv camera short",
    "mumbai_expressway": "ytsearch1:mumbai expressway cctv short",
    "road_accident_sample": "ytsearch1:car accident cctv footage short",
    "vehicle_collision_sample": "ytsearch1:vehicle collision cctv footage short",
}

for name, query in videos.items():
    out_file = f"assets/sample-videos/{name}.mp4"
    if os.path.exists(out_file):
        print(f"File {out_file} already exists. Skipping.")
        continue
    cmd = [
        yt_dlp_path, 
        query, 
        "--max-downloads", "1", 
        "-f", "best[height<=480][ext=mp4]/best[ext=mp4]", 
        "-o", out_file
    ]
    print(f"Downloading {name}...")
    subprocess.run(cmd)
print("Done!")
