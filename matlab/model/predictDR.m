function [prediction, processed] = predictDR(imageInput, modelSource)
%PREDICTDR Run real model inference using model-bound preprocessing metadata.
%   No fallback prediction is produced if the model cannot be loaded.
model = loadDRModel(modelSource);
processed = preprocessFundus(imageInput, model.modelMetadata.inputSize, model.modelMetadata.preprocessConfig);
scores = minibatchpredict(model.trainedNet, processed.modelInput);
if isa(scores,"dlarray"), scores = extractdata(scores); end
scores = gather(squeeze(scores));
scores = reshape(scores,1,[]);
if numel(scores) ~= numel(model.classNames)
    error("EyeRaksha:Inference:UnexpectedScores", "Model returned %d scores for %d classes.", numel(scores), numel(model.classNames));
end
if any(scores < 0) || abs(sum(scores)-1) > 1e-3
    scores = exp(scores-max(scores)); scores = scores./sum(scores);
end
[confidence,index] = max(scores);
classNames = string(model.classNames);
prediction = struct("label",classNames(index),"level",index-1,"confidence",confidence, ...
    "probabilities",scores,"classNames",classNames,"calibrationStatus",string(model.modelMetadata.calibrationStatus));
end
