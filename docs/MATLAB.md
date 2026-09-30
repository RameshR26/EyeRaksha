# MATLAB inference and reports

After real training, run one image with:

```matlab
addpath(genpath("matlab"))
result = runDRScreening("C:\path\to\fundus.jpg", "models\dr_model.mat")
```

`RECAPTURE` means quality failed and the model was not run. `success` contains only model-derived class probabilities, confidence, and (when supported) an actual Grad-CAM output. Missing model files raise `Model not trained yet`.

Create a report only from that result:

```matlab
generateReport(result,"reports\screening_report.txt","PATIENT-001")
```

The model's raw score remains uncalibrated until a separately validated calibration procedure is implemented.
