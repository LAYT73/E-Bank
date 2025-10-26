import os

ignore = ['node_modules', '.git', 'dist', '__pycache__', '.husky']

def build_tree(start_path: str, prefix: str = "") -> str:
    tree = ""
    entries = sorted(os.listdir(start_path))
    for i, entry in enumerate(entries):
        if entry in ignore:
            continue
        path = os.path.join(start_path, entry)
        connector = "└── " if i == len(entries) - 1 else "├── "
        tree += prefix + connector + entry + "\n"
        if os.path.isdir(path):
            extension = "    " if i == len(entries) - 1 else "│   "
            tree += build_tree(path, prefix + extension)
    return tree

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))  # путь к скрипту
    root = os.path.join(script_dir, "..")  # относительно скрипта
    root = os.path.abspath(root)  # абсолютный путь

    with open("scripts/output/project_structure.txt", "w", encoding="utf-8") as f:
        f.write(root + "\n")
        f.write(build_tree(root))
