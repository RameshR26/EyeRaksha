# Canonical fundus preprocessing

The following MATLAB modules are in `matlab/preprocessing/`:

- `cropRetina.m` — detects the visible retinal field and removes black borders.
- `illuminationNormalization.m` — corrects low-frequency illumination variation.
- `denoiseFundus.m` — applies conservative denoising.
- `claheEnhancement.m` — applies CLAHE to luminance while preserving RGB colour.
- `resizeNormalize.m` — resizes and converts the result to the network input tensor.
- `preprocessFundus.m` — the only pipeline entry point for training, validation, testing, and inference.

## Verification in MATLAB

```matlab
cd("C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha")
addpath(genpath(fullfile(pwd,"matlab")))
p = preprocessFundus("C:\path\to\fundus-image.jpg", [224 224 3]);
size(p.modelInput)
imshowpair(p.croppedImage, p.enhancedImage, "montage")
```

Expected size is `224   224   3`. The displayed images should show only the crop and enhanced image derived from the supplied fundus photo.

## Consistency rule

Do not independently call `imresize`, CLAHE, or normalization in model training or prediction code. Call `preprocessFundus` with the same saved configuration. If preprocessing parameters change, retrain and re-evaluate the model; do not use an old model with a new preprocessing configuration.
