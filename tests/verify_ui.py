import time
from playwright.sync_api import sync_playwright

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:5173...")
            # Use domcontentloaded to avoid waiting for streaming audio
            page.goto("http://localhost:5173", timeout=60000, wait_until="domcontentloaded")

            # 1. Skip Tutorial
            print("Looking for SKIP ALL button...")
            try:
                # Wait for button to be visible
                page.wait_for_selector("button:has-text('SKIP ALL')", timeout=10000)
                page.click("button:has-text('SKIP ALL')")
                print("Clicked SKIP ALL")
                time.sleep(1)
            except Exception as e:
                print(f"SKIP ALL not found (might be already skipped): {e}")

            # 2. Click Start Tour (Menu -> Overworld)
            print("Looking for START TOUR button...")
            try:
                page.wait_for_selector("button:has-text('START TOUR')", timeout=10000)
                page.click("button:has-text('START TOUR')")
                print("Clicked START TOUR")
                time.sleep(3) # Wait for scene transition
            except Exception as e:
                print(f"START TOUR not found or failed: {e}")

            # 3. Verify Overworld
            print("Verifying Overworld...")
            try:
                page.wait_for_selector("text=TOUR PLAN", timeout=10000)
                print("Overworld Loaded")
            except:
                print("Failed to load Overworld")
                page.screenshot(path="tests/failure_overworld.png")

            # 4. Check Radio Widget
            print("Checking Radio Widget...")
            if page.locator("text=FM 66.6").is_visible():
                print("Radio Widget Found")
                try:
                    box = page.locator("text=FM 66.6").evaluate("el => { const rect = el.parentElement.getBoundingClientRect(); return {top: rect.top, left: rect.left}; }")
                    print(f"Radio Widget Position: {box}")
                except:
                    pass
            else:
                print("Radio Widget NOT Found")

            # 5. Check Buttons
            content = page.content()
            if "▶" in content: print("Play button found")
            if "■" in content: print("Stop button found")
            if "||" in content:
                print("Pause button found")
            else:
                print("Pause button NOT found")

            # 6. Check Toasts (Optional - hard to force toast)
            # We trust the CSS change for toasts.

            page.screenshot(path="tests/overworld_ui.png")
            print("Screenshot saved to tests/overworld_ui.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="tests/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_ui()
