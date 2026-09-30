# Held-out model evaluation

Evaluate only after training a real model and keeping `dataset/test` unseen during design and training.

```matlab
cd("C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha")
addpath(genpath(fullfile(pwd,"matlab")))
metrics = evaluateDRModel("models/dr_model.mat", "dataset", "evaluation_results")
```

The evaluation saves a timestamped MAT file, per-class CSV, confusion-matrix CSV, and a PNG confusion-matrix figure when graphics export is available. It reports measured test-set accuracy, balanced accuracy, per-class precision/recall/specificity/F1, and referable-DR (level ≥2) sensitivity, specificity, PPV, NPV, and F1.

ROC-AUC is calculated only when both referable and non-referable classes are present and `perfcurve` is installed. Otherwise it is `NaN` and `rocAvailable` is false; this is not replaced with an estimated value.

Do not present results as clinical validation without an appropriate independently collected/external test set, a documented protocol, and expert review. The saved `calibrationStatus` remains `uncalibrated` until a separate calibration analysis is performed.
