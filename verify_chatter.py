from playwright.sync_api import sync_playwright
import time

def verify_chatter_overlay():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Navigate to the app (using port 5174 as 5173 was busy)
        print("Navigating to app...")
        page.goto("http://localhost:5174/")

        # Wait for "Start Tour" button to appear (initial intro or main menu)
        print("Waiting for Start Tour button...")
        try:
            # We look for the button element itself or the text
            # Often intro screens have a "Start Tour" text.
            # Let's verify if we are at the intro screen.
            # The intro video has a skip button or ends automatically.
            # If we see "Start Tour", click it.
            page.wait_for_selector("text=Start Tour", timeout=10000)
            print("Found Start Tour button.")

            # Click it once.
            page.click("text=Start Tour")
            print("Clicked Start Tour (Intro Skip/Start).")

            # Now wait. If it was the intro, we might be at the Main Menu now.
            # Main Menu ALSO has a "Start Tour" button (New Game).
            # Wait for the button to be re-enabled or a new one to appear.
            # Let's wait for a short delay.
            time.sleep(2)

            # If we see "Start Tour" again, click it again to start the game.
            if page.locator("text=Start Tour").is_visible():
                print("Found Start Tour button again (New Game). Clicking...")
                page.click("text=Start Tour")

                # Now we expect identity confirmation
                print("Waiting for Identity Confirmation...")
                try:
                     page.wait_for_selector("text=CONFIRM IDENTITY", timeout=5000)
                     page.fill("input", "TestBand")
                     page.click("text=CONFIRM IDENTITY")
                     print("Identity confirmed.")
                except:
                     print("Identity confirmation skipped or not found.")

                # Now wait for Tutorial
                print("Waiting for Tutorial...")
                try:
                     page.wait_for_selector("text=WELCOME TO THE GRIND", timeout=5000)
                     # Press Escape to dismiss tutorial
                     page.keyboard.press("Escape")
                     print("Tutorial dismissed.")
                except:
                     print("Tutorial not found.")

                # Now we should be in Band HQ.
                time.sleep(2)

                # Check for Setlist tab
                print("Checking for SETLIST tab...")
                if page.locator("text=SETLIST").is_visible():
                    print("Found SETLIST tab. Navigating...")
                    page.click("text=SETLIST")
                    time.sleep(1)
                    page.screenshot(path="setlist_tab.png")
                    print("Screenshot of Setlist Tab taken.")
                else:
                    print("SETLIST tab not found. We might be stuck on Main Menu or Intro.")
                    page.screenshot(path="debug_stuck.png")

                # Check for Details tab
                print("Checking for DETAILS tab...")
                if page.locator("text=DETAILS").is_visible():
                    print("Found DETAILS tab. Navigating...")
                    page.click("text=DETAILS")
                    time.sleep(1)
                    page.screenshot(path="details_tab.png")
                    print("Screenshot of Details Tab taken.")

            else:
                print("Did not find Start Tour button again. Taking screenshot.")
                page.screenshot(path="debug_no_start.png")

        except Exception as e:
            print(f"Error during flow: {e}")
            page.screenshot(path="debug_error.png")

        browser.close()

if __name__ == "__main__":
    verify_chatter_overlay()
