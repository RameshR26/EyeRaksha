function [scoreMap, overlay] = generateGradCAM(modelSource, imageInput, classIndex)
%GENERATEGRADCAM Generate Grad-CAM from the actual loaded classifier.
% The output represents model attention, not a lesion segmentation map.
model = loadDRModel(modelSource);
processed = preprocessFundus(imageInput, model.modelMetadata.inputSize, model.modelMetadata.preprocessConfig);
if nargin < 3 || isempty(classIndex)
    prediction = predictDR(imageInput, model);
    classIndex = prediction.level + 1;
end
if classIndex < 1 || classIndex > numel(model.classNames)
    error("EyeRaksha:XAI:InvalidClass", "Grad-CAM class index must be between 1 and %d.", numel(model.classNames));
end
scoreMap = gradCAM(model.trainedNet, processed.modelInput, classIndex);
scoreMap = rescale(imresize(scoreMap, size(processed.enhancedImage,[1 2])));
heatmap = ind2rgb(gray2ind(scoreMap,256),jet(256));
overlay = 0.55 * im2double(processed.enhancedImage) + 0.45 * heatmap;
overlay = min(1,max(0,overlay));
end
