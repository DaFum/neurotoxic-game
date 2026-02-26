from playwright.sync_api import sync_playwright

def verify(page):
    page.goto("http://localhost:5173/")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/home/jules/verification/main_menu.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify(page)
        browser.close()
