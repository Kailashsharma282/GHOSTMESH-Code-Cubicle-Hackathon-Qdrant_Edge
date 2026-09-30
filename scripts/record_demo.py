"""
Playwright automated screen recording script for GHOSTMESH 3-minute demo video.
Records live application at 1920x1080 30fps with human-like, smooth interactions.
Total timeline: exactly 180.0 seconds (3:00).
"""
import os
import time
import urllib.request
import json
from playwright.sync_api import sync_playwright

REC_DIR = os.path.abspath("data/video_assets/raw_recording")
os.makedirs(REC_DIR, exist_ok=True)

TITLE_CARD_URL = "file:///" + os.path.abspath("data/video_assets/title_card.html").replace("\\", "/")
OUTRO_CARD_URL = "file:///" + os.path.abspath("data/video_assets/outro_card.html").replace("\\", "/")
APP_URL = "http://localhost:5173"

def smooth_move(page, start_x, start_y, target_x, target_y, steps=15):
    """Move cursor smoothly between coordinates."""
    for i in range(1, steps + 1):
        x = start_x + (target_x - start_x) * (i / steps)
        y = start_y + (target_y - start_y) * (i / steps)
        page.mouse.move(x, y)
        time.sleep(0.015)

def trigger_backend_offline():
    req = urllib.request.Request("http://127.0.0.1:8088/api/scenarios/run/offline-demo", method="POST")
    try:
        urllib.request.urlopen(req)
        print("Backend offline scenario triggered successfully.")
    except Exception as e:
        print("Offline scenario error:", e)

def trigger_backend_reconcile():
    req = urllib.request.Request("http://127.0.0.1:8088/api/scenarios/run/conflict-demo", method="POST")
    try:
        urllib.request.urlopen(req)
        print("Backend conflict/reconciliation data seeded.")
    except Exception as e:
        print("Conflict scenario error:", e)

def main():
    print("Pre-seeding conflict and reconciliation data for demo...")
    trigger_backend_reconcile()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--hide-scrollbars",
                "--font-render-hinting=none"
            ]
        )
        context = browser.new_context(
            record_video_dir=REC_DIR,
            record_video_size={"width": 1920, "height": 1080},
            viewport={"width": 1920, "height": 1080}
        )
        page = context.new_page()

        start_time = time.time()
        print(f"[{time.time()-start_time:.1f}s] Starting Scene 1: Title Card (00:00 - 00:10)...")
        page.goto(TITLE_CARD_URL)
        # Hold title card until 10.0s
        time.sleep(max(0, 10.0 - (time.time() - start_time)))

        print(f"[{time.time()-start_time:.1f}s] Starting Scene 2: The Problem / Memory Radar (00:10 - 00:28)...")
        page.goto(APP_URL)
        page.wait_for_load_state("networkidle")
        time.sleep(1.0)

        # Hover smoothly across nodes A, B, C on Radar plane
        smooth_move(page, 960, 540, 400, 520, steps=25) # Over Device A
        time.sleep(3.0)
        smooth_move(page, 400, 520, 1500, 240, steps=30) # Over Device B
        time.sleep(3.0)
        smooth_move(page, 1500, 240, 1500, 780, steps=30) # Over Device C
        time.sleep(3.0)
        smooth_move(page, 1500, 780, 960, 540, steps=25) # Center Core
        time.sleep(max(0, 28.0 - (time.time() - start_time)))

        print(f"[{time.time()-start_time:.1f}s] Starting Scene 3: Edge Memory & Local Search (00:28 - 00:50)...")
        # Click SEARCH tab in navigation bar
        page.locator('nav button:has-text("SEARCH")').click()
        time.sleep(1.0)

        # Select scope LOCAL
        local_scope = page.locator('button:has-text("LOCAL")')
        if local_scope.count() > 0:
            local_scope.first.click()
            time.sleep(0.5)

        # Fill search input
        search_input = page.locator('input[placeholder*="Ask memory fabric"]')
        if search_input.count() > 0:
            search_input.click()
            search_input.fill("")
            search_input.type("Where is the USB-C charger?", delay=40)
            time.sleep(0.5)

        # Click QUERY MESH
        query_btn = page.locator('button:has-text("QUERY MESH")')
        if query_btn.count() > 0:
            query_btn.first.click()
        time.sleep(3.5)

        # Scroll down slightly to highlight local result card
        page.mouse.wheel(0, 200)
        time.sleep(3.0)
        page.mouse.wheel(0, -200)
        time.sleep(max(0, 50.0 - (time.time() - start_time)))

        print(f"[{time.time()-start_time:.1f}s] Starting Scene 4: Kill Network / Offline Test (00:50 - 01:15)...")
        # Return to RADAR
        page.locator('nav button:has-text("RADAR")').click()
        time.sleep(1.5)

        # Move mouse toward Device A ONLINE button
        smooth_move(page, 960, 540, 360, 480, steps=20)
        time.sleep(0.5)

        # Click ONLINE button on Device A card to sever network
        online_btn = page.locator('button:has-text("ONLINE")')
        if online_btn.count() > 0:
            online_btn.first.click()
            print("Clicked Device A disconnect button!")
        time.sleep(1.5)

        # Trigger offline ingestion scenario on backend
        trigger_backend_offline()
        time.sleep(2.0)

        # Verify offline state by navigating to SEARCH tab while offline
        page.locator('nav button:has-text("SEARCH")').click()
        time.sleep(1.0)
        if search_input.count() > 0:
            search_input.click()
            search_input.fill("")
            search_input.type("Where is the black notebook?", delay=40)
            time.sleep(0.5)
        if query_btn.count() > 0:
            query_btn.first.click()
        time.sleep(4.0)

        # Show results found locally without network
        time.sleep(max(0, 75.0 - (time.time() - start_time)))

        print(f"[{time.time()-start_time:.1f}s] Starting Scene 5: Privacy Policy Engine (01:15 - 01:35)...")
        page.locator('nav button:has-text("PRIVACY")').click()
        time.sleep(1.5)

        privacy_input = page.locator('input[placeholder*="Type sample observation"]')
        if privacy_input.count() > 0:
            privacy_input.click()
            privacy_input.fill("")
            privacy_input.type("Hardware Lab master password and passport backup in drawer lockbox", delay=35)
            time.sleep(0.5)

        test_policy_btn = page.locator('button:has-text("TEST POLICY")')
        if test_policy_btn.count() > 0:
            test_policy_btn.first.click()
            time.sleep(3.0)

        # Scroll to show Quarantine details
        page.mouse.wheel(0, 250)
        time.sleep(3.0)
        page.mouse.wheel(0, -250)
        time.sleep(max(0, 95.0 - (time.time() - start_time)))

        print(f"[{time.time()-start_time:.1f}s] Starting Scene 6: Reconnect & Sync Queue Drain (01:35 - 02:00)...")
        # Go to SYNC QUEUE tab first to show pending queue
        page.locator('nav button:has-text("SYNC QUEUE")').click()
        time.sleep(3.0)

        # Go to RADAR tab to reconnect Device A
        page.locator('nav button:has-text("RADAR")').click()
        time.sleep(1.5)

        # Reconnect Device A
        offline_btn = page.locator('button:has-text("OFFLINE")')
        if offline_btn.count() > 0:
            offline_btn.first.click()
            print("Clicked Device A reconnect button!")
        time.sleep(2.0)

        # Trigger sync on Device A
        sync_btn = page.locator('button[title*="Trigger Immediate Sync"]')
        if sync_btn.count() > 0:
            sync_btn.first.click()
        time.sleep(4.0)

        # Watch event ticker & stats update live
        smooth_move(page, 500, 500, 960, 1020, steps=20) # Hover over event ticker
        time.sleep(max(0, 120.0 - (time.time() - start_time)))

        print(f"[{time.time()-start_time:.1f}s] Starting Scene 7: Semantic Conflict & Why Not Merge? (02:00 - 02:25)...")
        page.locator('nav button:has-text("RECONCILIATION")').click()
        time.sleep(2.0)

        # Select first conflict candidate if available
        candidates = page.locator('.border.cursor-pointer')
        if candidates.count() > 0:
            candidates.first.click()
            time.sleep(2.0)

        # Smooth hover over the conflict items and "Why Not Merge" factors
        smooth_move(page, 300, 300, 800, 400, steps=25)
        time.sleep(4.0)
        smooth_move(page, 800, 400, 1400, 600, steps=25)
        time.sleep(max(0, 145.0 - (time.time() - start_time)))

        print(f"[{time.time()-start_time:.1f}s] Starting Scene 8: Semantic Merge & Provenance Graph (02:25 - 02:45)...")
        page.locator('nav button:has-text("FORENSICS")').click()
        time.sleep(2.0)

        # Click canonical decision
        canonical_items = page.locator('.cursor-pointer')
        if canonical_items.count() > 0:
            canonical_items.first.click()
            time.sleep(1.5)

        # Smooth inspect the provenance graph nodes
        smooth_move(page, 300, 200, 960, 350, steps=25) # Over canonical node
        time.sleep(3.0)
        smooth_move(page, 960, 350, 600, 750, steps=20) # Over Device A source
        time.sleep(2.0)
        smooth_move(page, 600, 750, 960, 750, steps=20) # Over Device B source
        time.sleep(2.0)
        smooth_move(page, 960, 750, 1300, 750, steps=20) # Over Device C source
        time.sleep(max(0, 165.0 - (time.time() - start_time)))

        print(f"[{time.time()-start_time:.1f}s] Starting Scene 9: Final System View & Converged Mesh (02:45 - 02:57)...")
        # System Info tab
        page.locator('nav button:has-text("SYSTEM INFO")').click()
        time.sleep(3.5)

        # Return to RADAR for final converged view
        page.locator('nav button:has-text("RADAR")').click()
        time.sleep(1.5)
        smooth_move(page, 960, 800, 960, 540, steps=25) # Center on GhostMesh Core
        time.sleep(max(0, 177.0 - (time.time() - start_time)))

        print(f"[{time.time()-start_time:.1f}s] Starting Scene 10: Outro Card (02:57 - 03:00)...")
        page.goto(OUTRO_CARD_URL)
        time.sleep(max(0, 180.0 - (time.time() - start_time)))

        print(f"[{time.time()-start_time:.1f}s] Closing browser and saving video...")
        context.close()
        browser.close()

    print("Playwright recording completed successfully!")

if __name__ == "__main__":
    main()
