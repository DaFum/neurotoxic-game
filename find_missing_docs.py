import os

def is_blacklisted(filepath, blacklist):
    for b in blacklist:
        if filepath.endswith(b):
            return True
    return False

blacklist = []
try:
    with open(".jules/tsdoc.md", "r") as f:
        for line in f:
            if line.startswith("|") and not line.startswith("| Date") and not line.startswith("| :---"):
                parts = line.split("|")
                if len(parts) >= 3:
                    file_path = parts[2].strip()
                    blacklist.append(file_path)
except Exception:
    pass

def check_file(filepath):
    if is_blacklisted(filepath, blacklist):
        return False
    if "vite.config" in filepath or "jest.config" in filepath or filepath.endswith(".d.ts"):
        return False

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # If it has legacy @param {
    if "@param {" in content or "@returns {" in content:
        return True

    lines = content.splitlines()

    # Find undocumented functions/consts
    # Skip if it is an overload (the function name is same as previous)
    prev_func_name = None
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("export function ") or stripped.startswith("export const "):
            # check if overload
            func_name = ""
            if stripped.startswith("export function "):
                func_name = stripped.split("export function ")[1].split("(")[0].split("<")[0].strip()

            if func_name and func_name == prev_func_name:
                continue

            prev_func_name = func_name

            if i > 0:
                prev_line = lines[i-1].strip()
                if not prev_line.endswith("*/") and not prev_line.startswith("//"):
                    return True
    return False

for root, dirs, files in os.walk("src"):
    if "node_modules" in root or "dist" in root or "build" in root:
        continue
    for file in files:
        if file.endswith(".ts") or file.endswith(".tsx"):
            filepath = os.path.join(root, file)
            if check_file(filepath):
                print(f"FOUND: {filepath}")
                exit(0)

print("NOT_FOUND")
