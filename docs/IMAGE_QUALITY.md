# Fundus image-quality assessment

`matlab/quality/qualityCheck.m` measures image quality before any model inference. It is deterministic: it does not use random values or DR labels.

## Measurements

- Focus / blur: variance of the Laplacian within the detected retinal field.
- Brightness: distance of mean retinal intensity from a target exposure.
- Contrast: standard deviation of visible retinal intensity.
- Illumination: coefficient of variation of a coarse local-mean image.
- Retinal coverage: fraction of the image occupied by the detected retinal field.
- Exposure: fractions of very dark and very bright retinal pixels.
- Resolution: image dimensions against configurable minimum/target sizes.

The score is a weighted sum of those measurements. Default thresholds are engineering starting points, not clinically validated thresholds. Calibrate them on representative images from the actual camera and intended population, then record the final configuration and validation results.

## Run on Windows MATLAB

```matlab
cd("C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha")
addpath(genpath(fullfile(pwd,"matlab")))
q = qualityCheck("C:\path\to\fundus-image.jpg")
```

Expected output is a structure containing `gradable`, `score`, individual measured features, `reasons`, and `recaptureInstructions`.

To test a stricter acceptance threshold without changing source code:

```matlab
q = qualityCheck("C:\path\to\fundus-image.jpg", struct("acceptanceScore",75));
```

If `q.gradable` is false, `runDRScreening` stops before preprocessing or model inference and returns `RECAPTURE` with the measured failure reasons. A `BORDERLINE` status is also not gradable under the default policy.

## Toolbox requirement

This module requires Image Processing Toolbox (`rgb2gray`, `imfilter`, morphology functions, `imgaussfilt`).
