# TODO: Implement this
import subprocess
import os

def get_tracked_files():
    result = subprocess.run(['git', 'ls-files'], stdout=subprocess.PIPE, text=True)
    return result.stdout.splitlines()

def add_todo_to_file(filepath):
    # Skip files that aren't regular files
    if not os.path.isfile(filepath):
        return

    # Skip files that should not be modified
    skip_extensions = {
        '.json', '.yaml', '.yml', '.png', '.jpg', '.jpeg', '.webp',
        '.ogg', '.mid', '.mp3', '.webm', '.lock', '.ico', '.svg',
        '.woff', '.woff2', '.ttf', '.eot', '.pid', '.toml', '.md'
    }
    skip_files = {'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'biome.json', 'jsconfig.json', 'tsconfig.json'}

    filename = os.path.basename(filepath)
    ext = os.path.splitext(filename)[1].lower()

    if ext in skip_extensions or filename in skip_files:
        return

    # Also skip hidden files and config files that might break if we add a comment
    if filename.startswith('.') and ext not in {'.js', '.jsx', '.ts', '.tsx'}:
        return

    # Determine comment style
    comment = None
    if ext in {'.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.css'}:
        comment = "// TODO: Implement this\n"
    elif ext in {'.py', '.sh'}:
        comment = "# TODO: Implement this\n"
    elif ext in {'.html'}:
        comment = "<!-- TODO: Implement this -->\n"
    elif filename in {'Dockerfile', 'Makefile'}:
        comment = "# TODO: Implement this\n"
    else:
        # Default for unknown text files
        comment = "// TODO: Implement this\n"

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Don't add if already there
        if "TODO:" in content[:100]:
            return

        # Special handling for bash scripts with shebang
        if content.startswith('#!'):
            lines = content.splitlines(True)
            if len(lines) > 0:
                new_content = lines[0] + comment + "".join(lines[1:])
            else:
                new_content = comment + content
        else:
            new_content = comment + content

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

        print(f"Added TODO to {filepath}")
    except Exception as e:
        print(f"Failed to process {filepath}: {e}")

if __name__ == "__main__":
    files = get_tracked_files()
    for f in files:
        add_todo_to_file(f)
