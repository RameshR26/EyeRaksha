# Dataset preparation

EyeRaksha does not include retinal images or labels. Obtain only datasets you are licensed and permitted to use, such as APTOS 2019, EyePACS, Messidor/Messidor-2, DDR, or IDRiD. Follow each dataset's licence, consent, and access terms.

## Required layout

```text
dataset/
  train/0/ ... train/4/
  validation/0/ ... validation/4/
  test/0/ ... test/4/
```

The folders represent the 5-class DR grading convention: `0` No DR, `1` Mild, `2` Moderate, `3` Severe, `4` Proliferative. Keep test images isolated until final evaluation.

## Option A: Place images manually

Copy JPG, JPEG, PNG, TIF, or TIFF images into the appropriate split and class folder. Then, in MATLAB:

```matlab
cd("C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha")
addpath(genpath(fullfile(pwd,"matlab")))
summary = validateDatasetLayout(fullfile(pwd,"dataset"))
```

All 15 class folders must contain at least one image before training can begin.

## Option B: Convert a CSV-labelled dataset

For an APTOS-style CSV with `id_code` and `diagnosis`, with images in a separate folder:

```matlab
options = struct("ImageIdColumn","id_code", "LabelColumn","diagnosis", "Seed",42);
summary = prepareDatasetFromCsv( ...
    "D:\APTOS\train_images", ...
    "D:\APTOS\train.csv", ...
    "C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha\dataset", ...
    options)
```

The utility copies files into the class folders and writes `dataset/dataset_manifest.csv`. It performs a reproducible class-stratified 70% / 15% / 15% split only when no split column is supplied.

If your CSV already has a split column, use it instead:

```matlab
options = struct("ImageIdColumn","image_id", "LabelColumn","grade", "SplitColumn","split");
summary = prepareDatasetFromCsv("D:\images", "D:\labels.csv", fullfile(pwd,"dataset"), options)
```

Allowed split values are `train`, `validation` (or `val`), and `test`.

## Critical split rule

Split at patient level whenever patient identifiers are available. Do not allow two images from the same patient, encounter, or eye to appear in more than one split. The supplied CSV converter cannot infer patient identity unless your CSV already provides a safe split column.

## Privacy and versioning

Do not commit retinal images, labels, manifests containing sensitive paths, or trained models to source control. The repository ignores those files by default. Record dataset source, licence, label protocol, preprocessing version, split seed, and exact image counts in your experiment notes.
