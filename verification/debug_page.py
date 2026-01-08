from playwright.sync_api import sync_playwright

def inspect_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:5173")
            page.wait_for_timeout(3000)

            # Print page text to see where we are
            print("Page Title:", page.title())
            print("Visible Text snippet:", page.locator("body").inner_text()[:500])

            # Take screenshot of whatever is there
            page.screenshot(path="verification/debug_screen.png")
        finally:
            browser.close()

if __name__ == "__main__":
    inspect_page()
