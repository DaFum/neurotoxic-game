import argparse
from pathlib import Path
from playwright.sync_api import sync_playwright

def verify(page, url, output_path):
    page.goto(url)
    page.wait_for_load_state("networkidle")

    # Ensure output directory exists
    output_file = Path(output_path).resolve()
    output_file.parent.mkdir(parents=True, exist_ok=True)

    page.screenshot(path=str(output_file))
    print(f"Screenshot saved to {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify build by taking a screenshot.")
    parser.add_argument("--url", default="http://localhost:5173/", help="The URL to verify")
    parser.add_argument("--output", default="verification/main_menu.png", help="Path to save the screenshot")

    args = parser.parse_args()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify(page, args.url, args.output)
        finally:
            browser.close()
