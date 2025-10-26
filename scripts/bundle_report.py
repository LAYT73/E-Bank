import os

dist_folder = "dist"

sum = 0

with open("scripts/output/bundle_report.txt", "w", encoding="utf-8") as f:
    for root, _, files in os.walk(dist_folder):
        for file in files:
            path = os.path.join(root, file)
            size = os.path.getsize(path) / 1024
            sum += size
            f.write(f"{path}: {size:.2f} KB\n")
        f.write(f"Total size: {sum:.2f} KB\n")

print(f"Bundle report saved to scripts/output/bundle_report.txt")
print(f"Total size: {sum:.2f} KB")
