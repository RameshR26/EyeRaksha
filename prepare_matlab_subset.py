from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "dataset"
OUTPUT = ROOT / "matlab_dataset"

COUNTS = {
    "train": 100,
    "validation": 19,
    "test": 19
}

for split, count in COUNTS.items():
    for cls in range(5):
        (OUTPUT / split / str(cls)).mkdir(
            parents=True,
            exist_ok=True
        )

print("Creating MATLAB subset...")

for split, count in COUNTS.items():

    print(f"\n{split.upper()}")

    for cls in range(5):

        source_folder = SOURCE / split / str(cls)
        output_folder = OUTPUT / split / str(cls)

        images = sorted([
            p for p in source_folder.iterdir()
            if p.is_file()
            and p.suffix.lower() in [".png", ".jpg", ".jpeg"]
        ])

        if len(images) < count:
            raise RuntimeError(
                f"Not enough images in {split}/{cls}: "
                f"{len(images)} available"
            )

        for image in images[:count]:
            shutil.copy2(
                image,
                output_folder / image.name
            )

        print(f"  Class {cls}: {count}")

print("\n================================")
print("MATLAB SUBSET READY")
print("================================")

for split in COUNTS:
    total = 0

    for cls in range(5):
        folder = OUTPUT / split / str(cls)
        count = len(list(folder.glob("*")))
        total += count
        print(f"{split}/{cls}: {count}")

    print(f"{split} total: {total}")
print(f"\nLocation: {OUTPUT}")