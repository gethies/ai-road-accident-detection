import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

tabs_html = '''                                <!-- Source Selector Tabs -->
                                <div class="source-tabs">
                                    <button class="tab-btn active" data-tab="upload-image">
                                        <i class="fa-solid fa-image"></i> Image Upload
                                    </button>
                                    <button class="tab-btn" data-tab="upload-video">
                                        <i class="fa-solid fa-video"></i> Video Upload
                                    </button>
                                    <button class="tab-btn" data-tab="live-camera">
                                        <i class="fa-solid fa-camera"></i> Live CCTV
                                    </button>
                                    <button class="tab-btn" data-tab="cctv-grid">
                                        <i class="fa-solid fa-border-all"></i> CCTV Grid
                                    </button>
                                </div>'''

grid_html = '''                                <!-- CCTV Grid Tab Container -->
                                <div id="tab-cctv-grid" class="tab-content">
                                    <div class="cctv-grid-network" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                                        <div class="cctv-feed" style="position: relative; border-radius: 8px; overflow: hidden; border: 2px solid #334155; height: 180px; background: #000; cursor: pointer;" onclick="selectCCTV(0)">
                                            <video src="assets/sample-videos/highway_accident.mp4" loop muted autoplay playsinline style="width:100%; height:100%; object-fit:cover; opacity: 0.8;"></video>
                                            <span style="position:absolute; top:5px; left:5px; background:rgba(0,0,0,0.7); color:#00f2fe; padding:2px 8px; font-size:0.7rem; border-radius:4px;">CAM 01: Chennai GST Road</span>
                                        </div>
                                        <div class="cctv-feed" style="position: relative; border-radius: 8px; overflow: hidden; border: 2px solid #334155; height: 180px; background: #000; cursor: pointer;" onclick="selectCCTV(1)">
                                            <video src="assets/sample-videos/traffic_collision.mp4" loop muted autoplay playsinline style="width:100%; height:100%; object-fit:cover; opacity: 0.8;"></video>
                                            <span style="position:absolute; top:5px; left:5px; background:rgba(0,0,0,0.7); color:#00f2fe; padding:2px 8px; font-size:0.7rem; border-radius:4px;">CAM 02: Mount Road</span>
                                        </div>
                                        <div class="cctv-feed" style="position: relative; border-radius: 8px; overflow: hidden; border: 2px solid #334155; height: 180px; background: #000; cursor: pointer;" onclick="selectCCTV(2)">
                                            <video src="assets/sample-videos/bike_accident.mp4" loop muted autoplay playsinline style="width:100%; height:100%; object-fit:cover; opacity: 0.8;"></video>
                                            <span style="position:absolute; top:5px; left:5px; background:rgba(0,0,0,0.7); color:#00f2fe; padding:2px 8px; font-size:0.7rem; border-radius:4px;">CAM 03: Bangalore Hosur Rd</span>
                                        </div>
                                        <div class="cctv-feed" style="position: relative; border-radius: 8px; overflow: hidden; border: 2px solid #334155; height: 180px; background: #000; cursor: pointer;" onclick="selectCCTV(3)">
                                            <video src="assets/sample-videos/normal_traffic.mp4" loop muted autoplay playsinline style="width:100%; height:100%; object-fit:cover; opacity: 0.8;"></video>
                                            <span style="position:absolute; top:5px; left:5px; background:rgba(0,0,0,0.7); color:#00f2fe; padding:2px 8px; font-size:0.7rem; border-radius:4px;">CAM 04: Mumbai Express</span>
                                        </div>
                                    </div>
                                    <div style="text-align:center; margin-top:15px;">
                                        <p style="font-size:0.8rem; color:#94a3b8;"><i class="fa-solid fa-circle-info"></i> Click any camera feed to analyze stream</p>
                                    </div>
                                </div>'''

old_source_tabs = '''                                <!-- Source Selector Tabs -->
                                <div class="source-tabs">
                                    <button class="tab-btn active" data-tab="upload-image">
                                        <i class="fa-solid fa-image"></i> Image Upload
                                    </button>
                                    <button class="tab-btn" data-tab="upload-video">
                                        <i class="fa-solid fa-video"></i> Video Upload
                                    </button>
                                    <button class="tab-btn" data-tab="live-camera">
                                        <i class="fa-solid fa-camera"></i> Live CCTV
                                    </button>
                                </div>'''

content = content.replace(old_source_tabs, tabs_html)

monitor_start = '''                                <!-- Visual Display Screen (Processed Output) -->'''
content = content.replace(monitor_start, grid_html + '\n\n' + monitor_start)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Patched index.html with CCTV Grid successfully')
