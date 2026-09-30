function result = runDRScreening(imageInput, modelPath)
%RUNDRSCREENING Master real-inference pipeline for a single fundus image.
%   RESULT = RUNDRSCREENING(IMAGEINPUT,"models/dr_model.mat")
% rejects non-gradable images before loading/running model inference.
if nargin < 2 || strlength(string(modelPath)) == 0, modelPath = fullfile("models","dr_model.mat"); end
startTime = tic;
if ischar(imageInput) || isstring(imageInput), I = imread(imageInput); else, I = imageInput; end
quality = qualityCheck(I);
result = struct("status","", "quality",quality, "originalImage",I, "enhancedImage",[], ...
    "prediction",[], "classProbabilities",[], "confidence",[], "referable",false, ...
    "gradcam",[], "gradcamOverlay",[], "messages",strings(0,1), "processingSeconds",0);
if ~quality.gradable
    result.status = "RECAPTURE";
    result.recommendation = "Screening result unavailable because the retinal image is not gradable.";
    result.messages = [quality.reasons quality.recaptureInstructions];
    result.processingSeconds = toc(startTime);
    return
end

model = loadDRModel(modelPath);
[prediction, processed] = predictDR(I, model);
result.status = "success";
result.enhancedImage = processed.enhancedImage;
result.prediction = prediction;
result.classProbabilities = prediction.probabilities;
result.confidence = prediction.confidence;
result.referable = prediction.level >= 2;
result.calibrationStatus = prediction.calibrationStatus;
if result.referable, result.recommendation = "Ophthalmologist review recommended."; else, result.recommendation = "Follow local screening protocol and clinician guidance."; end
try
    [result.gradcam,result.gradcamOverlay] = generateGradCAM(model,I,prediction.level+1);
catch ME
    result.messages(end+1) = "Grad-CAM unavailable: " + string(ME.message);
end
result.processingSeconds = toc(startTime);
end
