from playwright.sync_api import sync_playwright

def verify_main_menu(page):
    page.goto('http://localhost:5173/')
    # Wait for the intro to finish or skip it
    try:
        page.get_by_role("button", name="SKIP INTRO").click(timeout=3000)
    except Exception:
        pass

    # Dismiss tutorial if it appears
    try:
        page.get_by_role("button", name="X").click(timeout=3000)
    except Exception:
        pass

    # Click SOCIALS button
    page.get_by_role("button", name="SOCIALS").click(timeout=5000)

    # Wait for Modal to open
    page.wait_for_selector('text=Play Neurotoxic')

    # Take screenshot
    page.screenshot(path='/home/jules/verification/socials_modal.png')
    print("Screenshot saved to /home/jules/verification/socials_modal.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        verify_main_menu(page)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
