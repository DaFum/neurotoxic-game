import os

def add_todo_to_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Avoid adding multiple TODOs if the script is run multiple times
        if not content.startswith('// TODO:'):
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write('// TODO: Review this file\n' + content)
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            add_todo_to_file(os.path.join(root, file))
