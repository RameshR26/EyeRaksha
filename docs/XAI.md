# Explainability

`generateGradCAM` calls MATLAB `gradCAM` on the saved trained network and the same canonical preprocessing used by inference. It creates no synthetic heatmap. A Grad-CAM map identifies model-attention regions; it is not a lesion map and must not be labelled as hemorrhage, microaneurysm, or any confirmed pathology without a separately validated lesion model.
