# Model training

`matlab/training/trainDRModel.m` trains a real five-class DR classifier only from the images and labels in `dataset/`. It does not create a model when the dataset is absent or incomplete.

## Requirements

- MATLAB with Deep Learning Toolbox and Image Processing Toolbox.
- A supported pretrained-network support package for ResNet-101, when MATLAB prompts for it.
- Completed `dataset/train`, `dataset/validation`, and `dataset/test` class folders. Follow [DATASET.md](DATASET.md) first.
- A GPU is strongly recommended. CPU training can be very slow.

## Train

```matlab
cd("C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha")
addpath(genpath(fullfile(pwd,"matlab")))
[trainedNet, trainingInfo, metadata] = trainDRModel( ...
    fullfile(pwd,"dataset"), ...
    fullfile(pwd,"models","dr_model.mat"));
```

Expected results:

- MATLAB training-progress window appears.
- `models/dr_model.mat` is created from your actual training run.
- `training_results/training_<timestamp>.mat` contains training metadata.

The saved model includes class names, canonical preprocessing settings, image counts before/after balancing, and `calibrationStatus = "uncalibrated"`. Raw softmax scores must not be described as calibrated confidence until the evaluation/calibration phase is complete.

## Class imbalance handling

The pipeline uses reproducible oversampling of minority *training* classes to the largest training-class count. It never duplicates validation or test samples. This approach is recorded in model metadata. Compare experiments on the untouched test set; do not claim an improvement unless measured there.

## Conservative augmentation

Training uses only small rotations (±10°), horizontal reflection, small translations, and scale changes (0.95–1.05). Preprocessing is applied first through `preprocessFundus`; validation uses the same preprocessing without augmentation.

## Configuration example

```matlab
config = struct("BaseNetwork","resnet101", "MaxEpochs",20, "MiniBatchSize",8, ...
    "Augmentation",struct("RotationDegrees",[-8 8],"HorizontalFlip",true, ...
    "XTranslationPixels",[-5 5],"YTranslationPixels",[-5 5],"ScaleRange",[0.97 1.03]));
[trainedNet, trainingInfo, metadata] = trainDRModel("dataset", "models/dr_model.mat", config);
```

Do not change preprocessing or label mapping after training. Any such change requires retraining and new evaluation.

## MATLAB version note

This implementation uses current APIs: `imagePretrainedNetwork` and `trainnet`. If your MATLAB release does not provide them, upgrade MATLAB/Deep Learning Toolbox rather than silently substituting an incompatible or unverified training path.
