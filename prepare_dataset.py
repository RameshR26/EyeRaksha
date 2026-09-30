<<<<<<< HEAD
from pathlib import Path
import pandas as pd
import shutil
from sklearn.model_selection import train_test_split

# ============================================================
# EyeRaksha - APTOS 2019 Dataset Preparation
# ============================================================

ROOT = Path(__file__).resolve().parent

RAW_DIR = ROOT / "dataset_raw"
IMAGE_DIR = RAW_DIR / "train_images"
CSV_FILE = RAW_DIR / "train.csv"
OUTPUT_DIR = ROOT / "dataset"

# ------------------------------------------------------------
# 1. Load CSV
# ------------------------------------------------------------

print("\nLoading APTOS labels...")

df = pd.read_csv(CSV_FILE)

df["diagnosis"] = df["diagnosis"].astype(int)

print(f"CSV records: {len(df)}")

# ------------------------------------------------------------
# 2. Verify images
# ------------------------------------------------------------

print("\nChecking images...")

records = []

for _, row in df.iterrows():

    image_id = str(row["id_code"])
    diagnosis = int(row["diagnosis"])

    image_path = IMAGE_DIR / f"{image_id}.png"

    if image_path.exists():

        records.append({
            "id_code": image_id,
            "diagnosis": diagnosis,
            "path": image_path
        })

    else:

        print(f"WARNING: Missing image: {image_id}")

df = pd.DataFrame(records)

print(f"Images found: {len(df)}")

if len(df) != 3662:
    print("\nWARNING: Expected 3662 images.")

# ------------------------------------------------------------
# 3. Show class distribution
# ------------------------------------------------------------

print("\nOriginal class distribution:")

print(
    df["diagnosis"]
    .value_counts()
    .sort_index()
)

# ------------------------------------------------------------
# 4. Stratified split
# ------------------------------------------------------------

print("\nCreating stratified split...")

train_df, temp_df = train_test_split(
    df,
    test_size=0.20,
    stratify=df["diagnosis"],
    random_state=42
)

validation_df, test_df = train_test_split(
    temp_df,
    test_size=0.50,
    stratify=temp_df["diagnosis"],
    random_state=42
)

print("\nDataset split:")

print(f"Train:      {len(train_df)}")
print(f"Validation: {len(validation_df)}")
print(f"Test:       {len(test_df)}")

# ------------------------------------------------------------
# 5. Create directories
# ------------------------------------------------------------

for split in ["train", "validation", "test"]:

    for diagnosis in range(5):

        folder = OUTPUT_DIR / split / str(diagnosis)

        folder.mkdir(
            parents=True,
            exist_ok=True
        )

# ------------------------------------------------------------
# 6. Remove .gitkeep files
# ------------------------------------------------------------

for gitkeep in OUTPUT_DIR.rglob(".gitkeep"):

    gitkeep.unlink()

# ------------------------------------------------------------
# 7. MOVE images
# ------------------------------------------------------------

def move_images(dataframe, split_name):

    print(f"\nMoving {split_name} images...")

    total = len(dataframe)

    for index, (_, row) in enumerate(
        dataframe.iterrows(),
        start=1
    ):

        source = Path(row["path"])

        diagnosis = int(row["diagnosis"])

        destination = (
            OUTPUT_DIR /
            split_name /
            str(diagnosis) /
            source.name
        )

        shutil.move(
            str(source),
            str(destination)
        )

        if index % 100 == 0 or index == total:

            print(
                f"  {index}/{total}"
            )


move_images(train_df, "train")

move_images(validation_df, "validation")

move_images(test_df, "test")

# ------------------------------------------------------------
# 8. Save label CSV files
# ------------------------------------------------------------

train_df[
    ["id_code", "diagnosis"]
].to_csv(
    OUTPUT_DIR / "train_labels.csv",
    index=False
)

validation_df[
    ["id_code", "diagnosis"]
].to_csv(
    OUTPUT_DIR / "validation_labels.csv",
    index=False
)

test_df[
    ["id_code", "diagnosis"]
].to_csv(
    OUTPUT_DIR / "test_labels.csv",
    index=False
)

# ------------------------------------------------------------
# 9. Final verification
# ------------------------------------------------------------

print("\n==========================================")
print("      EYERAKSHA DATASET READY")
print("==========================================")

for split in ["train", "validation", "test"]:

    print(f"\n{split.upper()}")

    for diagnosis in range(5):

        folder = (
            OUTPUT_DIR /
            split /
            str(diagnosis)
        )

        count = len(
            list(folder.glob("*"))
        )

        print(
            f"  Class {diagnosis}: {count}"
        )

=======
from pathlib import Path
import pandas as pd
import shutil
from sklearn.model_selection import train_test_split

# ============================================================
# EyeRaksha - APTOS 2019 Dataset Preparation
# ============================================================

ROOT = Path(__file__).resolve().parent

RAW_DIR = ROOT / "dataset_raw"
IMAGE_DIR = RAW_DIR / "train_images"
CSV_FILE = RAW_DIR / "train.csv"
OUTPUT_DIR = ROOT / "dataset"

# ------------------------------------------------------------
# 1. Load CSV
# ------------------------------------------------------------

print("\nLoading APTOS labels...")

df = pd.read_csv(CSV_FILE)

df["diagnosis"] = df["diagnosis"].astype(int)

print(f"CSV records: {len(df)}")

# ------------------------------------------------------------
# 2. Verify images
# ------------------------------------------------------------

print("\nChecking images...")

records = []

for _, row in df.iterrows():

    image_id = str(row["id_code"])
    diagnosis = int(row["diagnosis"])

    image_path = IMAGE_DIR / f"{image_id}.png"

    if image_path.exists():

        records.append({
            "id_code": image_id,
            "diagnosis": diagnosis,
            "path": image_path
        })

    else:

        print(f"WARNING: Missing image: {image_id}")

df = pd.DataFrame(records)

print(f"Images found: {len(df)}")

if len(df) != 3662:
    print("\nWARNING: Expected 3662 images.")

# ------------------------------------------------------------
# 3. Show class distribution
# ------------------------------------------------------------

print("\nOriginal class distribution:")

print(
    df["diagnosis"]
    .value_counts()
    .sort_index()
)

# ------------------------------------------------------------
# 4. Stratified split
# ------------------------------------------------------------

print("\nCreating stratified split...")

train_df, temp_df = train_test_split(
    df,
    test_size=0.20,
    stratify=df["diagnosis"],
    random_state=42
)

validation_df, test_df = train_test_split(
    temp_df,
    test_size=0.50,
    stratify=temp_df["diagnosis"],
    random_state=42
)

print("\nDataset split:")

print(f"Train:      {len(train_df)}")
print(f"Validation: {len(validation_df)}")
print(f"Test:       {len(test_df)}")

# ------------------------------------------------------------
# 5. Create directories
# ------------------------------------------------------------

for split in ["train", "validation", "test"]:

    for diagnosis in range(5):

        folder = OUTPUT_DIR / split / str(diagnosis)

        folder.mkdir(
            parents=True,
            exist_ok=True
        )

# ------------------------------------------------------------
# 6. Remove .gitkeep files
# ------------------------------------------------------------

for gitkeep in OUTPUT_DIR.rglob(".gitkeep"):

    gitkeep.unlink()

# ------------------------------------------------------------
# 7. MOVE images
# ------------------------------------------------------------

def move_images(dataframe, split_name):

    print(f"\nMoving {split_name} images...")

    total = len(dataframe)

    for index, (_, row) in enumerate(
        dataframe.iterrows(),
        start=1
    ):

        source = Path(row["path"])

        diagnosis = int(row["diagnosis"])

        destination = (
            OUTPUT_DIR /
            split_name /
            str(diagnosis) /
            source.name
        )

        shutil.move(
            str(source),
            str(destination)
        )

        if index % 100 == 0 or index == total:

            print(
                f"  {index}/{total}"
            )


move_images(train_df, "train")

move_images(validation_df, "validation")

move_images(test_df, "test")

# ------------------------------------------------------------
# 8. Save label CSV files
# ------------------------------------------------------------

train_df[
    ["id_code", "diagnosis"]
].to_csv(
    OUTPUT_DIR / "train_labels.csv",
    index=False
)

validation_df[
    ["id_code", "diagnosis"]
].to_csv(
    OUTPUT_DIR / "validation_labels.csv",
    index=False
)

test_df[
    ["id_code", "diagnosis"]
].to_csv(
    OUTPUT_DIR / "test_labels.csv",
    index=False
)

# ------------------------------------------------------------
# 9. Final verification
# ------------------------------------------------------------

print("\n==========================================")
print("      EYERAKSHA DATASET READY")
print("==========================================")

for split in ["train", "validation", "test"]:

    print(f"\n{split.upper()}")

    for diagnosis in range(5):

        folder = (
            OUTPUT_DIR /
            split /
            str(diagnosis)
        )

        count = len(
            list(folder.glob("*"))
        )

        print(
            f"  Class {diagnosis}: {count}"
        )

>>>>>>> 2dc8921 (final)
print("\nDataset preparation complete!")