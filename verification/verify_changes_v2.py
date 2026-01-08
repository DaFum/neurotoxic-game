from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Go to app
            page.goto("http://localhost:5173")
            page.wait_for_timeout(2000) # Wait for load

            # Check if we are at Menu or Tutorial
            if page.get_by_text("START TOUR").is_visible():
                print("Clicking START TOUR")
                page.get_by_text("START TOUR").click()
                page.wait_for_timeout(1000)

            # If Tutorial appears "SKIP ALL"
            if page.get_by_text("SKIP ALL").is_visible():
                print("Skipping Tutorial")
                page.get_by_text("SKIP ALL").click()
                page.wait_for_timeout(2000)

            # Now likely in Overworld.
            # Check for Radio toggle button.
            # It has title "Play Radio" or "Stop Radio" depending on state.
            # Initial state: Play Radio (▶)
            play_btn = page.get_by_title("Play Radio")
            if play_btn.is_visible():
                print("Radio Play Button found.")
                play_btn.click()
                page.wait_for_timeout(500)
                # Should now be Stop Radio (■)
                stop_btn = page.get_by_title("Stop Radio")
                if stop_btn.is_visible():
                     print("Radio toggled to Stop.")
                else:
                     print("Radio toggle failed.")
            else:
                print("Radio Play Button not found in Overworld.")
                # Maybe already playing?
                if page.get_by_title("Stop Radio").is_visible():
                     print("Radio is already playing (Stop button visible).")
                else:
                     print("No Radio controls found.")

            # Take screenshot of Overworld with Radio toggled
            page.screenshot(path="verification/overworld_radio.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
