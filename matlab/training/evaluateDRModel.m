function metrics = evaluateDRModel(modelFile, dataFolder, resultsFolder)
%EVALUATEDRMODEL Evaluate a saved DR model on the held-out test split.
%   METRICS = EVALUATEDRMODEL("models/dr_model.mat", "dataset")
%   computes only measured test-set metrics. It never substitutes values when
%   a class or outcome is absent from the supplied test data.

if nargin < 1 || strlength(string(modelFile)) == 0, modelFile = fullfile("models","dr_model.mat"); end
if nargin < 2 || strlength(string(dataFolder)) == 0, dataFolder = "dataset"; end
if nargin < 3 || strlength(string(resultsFolder)) == 0, resultsFolder = "evaluation_results"; end
modelFile = string(modelFile); dataFolder = string(dataFolder); resultsFolder = string(resultsFolder);
if ~isfile(modelFile), error("EyeRaksha:Evaluation:ModelMissing", "Model not trained yet: %s", modelFile); end

loaded = load(modelFile, "trainedNet", "classNames", "modelMetadata");
if ~isfield(loaded,"trainedNet") || ~isfield(loaded,"classNames") || ~isfield(loaded,"modelMetadata")
    error("EyeRaksha:Evaluation:InvalidModel", "Model file does not contain the required trained model metadata.");
end
validateDatasetLayout(dataFolder, true);
classNames = categorical(string(loaded.classNames));
inputSize = loaded.modelMetadata.inputSize;
preprocessConfig = loaded.modelMetadata.preprocessConfig;

imdsTest = imageDatastore(fullfile(dataFolder,"test"), IncludeSubfolders=true, LabelSource="foldernames", ...
    FileExtensions={".jpg",".jpeg",".png",".tif",".tiff"});
assertTestClasses(imdsTest.Labels, classNames);
imdsTest.ReadFcn = @(filename) preprocessFundus(filename, inputSize, preprocessConfig).modelInput;
augmentedTest = augmentedImageDatastore(inputSize(1:2), imdsTest);

rawScores = minibatchpredict(loaded.trainedNet, augmentedTest);
scores = normalizeScores(rawScores, numel(imdsTest.Files), numel(classNames));
[~, predictedIndex] = max(scores, [], 2);
predicted = categorical(string(loaded.classNames(predictedIndex)), string(loaded.classNames));
truth = categorical(string(imdsTest.Labels), string(loaded.classNames));

confusion = confusionmat(truth, predicted, "Order", classNames);
[perClass, accuracy, balancedAccuracy] = multiclassMetrics(confusion, string(classNames));
referable = referableMetrics(truth, predicted, scores, string(classNames));

metrics = struct( ...
    "evaluationVersion", "1.0", ...
    "evaluatedAt", datetime("now","TimeZone","UTC"), ...
    "modelFile", modelFile, ...
    "modelCreatedAt", loaded.modelMetadata.createdAt, ...
    "classNames", string(classNames), ...
    "testImageCount", numel(imdsTest.Files), ...
    "accuracy", accuracy, ...
    "balancedAccuracy", balancedAccuracy, ...
    "confusionMatrix", confusion, ...
    "perClass", perClass, ...
    "referableDR", referable, ...
    "calibrationStatus", loaded.modelMetadata.calibrationStatus, ...
    "note", "Metrics are measured only on the supplied held-out test split.");
saveEvaluationArtifacts(metrics, resultsFolder);
end

function assertTestClasses(labels, classNames)
actual = sort(string(categories(labels))); expected = sort(string(classNames));
if ~isequal(actual(:), expected(:))
    error("EyeRaksha:Evaluation:UnexpectedClasses", "Test labels must contain exactly classes 0, 1, 2, 3, and 4.");
end
end

function scores = normalizeScores(rawScores, numberOfImages, numberOfClasses)
if isa(rawScores,"dlarray"), rawScores = extractdata(rawScores); end
scores = gather(rawScores); scores = squeeze(scores);
if isvector(scores), scores = reshape(scores, 1, []); end
if size(scores,1) == numberOfClasses && size(scores,2) == numberOfImages
    scores = scores.';
end
if size(scores,1) ~= numberOfImages || size(scores,2) ~= numberOfClasses
    error("EyeRaksha:Evaluation:UnexpectedScores", "Model output has size [%s], expected %d-by-%d.", num2str(size(scores)), numberOfImages, numberOfClasses);
end
% trainnet crossentropy normally returns normalized scores. Normalize only to
% protect metric calculations if a compatible model returns positive logits.
rowSums = sum(scores,2);
if any(abs(rowSums-1) > 1e-3) || any(scores(:) < 0)
    scores = exp(scores - max(scores,[],2)); scores = scores ./ sum(scores,2);
end
end

function [perClass, accuracy, balancedAccuracy] = multiclassMetrics(confusion, classNames)
total = sum(confusion,"all"); tp = diag(confusion); fp = sum(confusion,1).' - tp; fn = sum(confusion,2) - tp; tn = total - tp - fp - fn;
precision = safeDivide(tp, tp+fp); recall = safeDivide(tp, tp+fn); specificity = safeDivide(tn, tn+fp);
f1 = safeDivide(2*precision.*recall, precision+recall);
support = sum(confusion,2);
perClass = table(classNames(:), support, tp, fp, fn, tn, precision, recall, specificity, f1, ...
    "VariableNames", {"class","support","truePositive","falsePositive","falseNegative","trueNegative","precision","recall","specificity","f1Score"});
accuracy = safeDivide(sum(tp), total);
balancedAccuracy = mean(recall, "omitnan");
end

function out = referableMetrics(truth, predicted, scores, classNames)
numericTruth = str2double(string(truth)); numericPredicted = str2double(string(predicted));
actualPositive = numericTruth >= 2; predictedPositive = numericPredicted >= 2;
tp = sum(actualPositive & predictedPositive); tn = sum(~actualPositive & ~predictedPositive);
fp = sum(~actualPositive & predictedPositive); fn = sum(actualPositive & ~predictedPositive);
positiveColumns = str2double(classNames) >= 2;
positiveScore = sum(scores(:,positiveColumns),2);
out = struct("definition","Level >= 2", "truePositive",tp, "trueNegative",tn, "falsePositive",fp, "falseNegative",fn, ...
    "sensitivity",safeDivide(tp,tp+fn), "specificity",safeDivide(tn,tn+fp), ...
    "ppv",safeDivide(tp,tp+fp), "npv",safeDivide(tn,tn+fn), "f1Score",safeDivide(2*tp,2*tp+fp+fn), ...
    "rocAuc",NaN, "rocAvailable",false);
if numel(unique(actualPositive)) == 2 && exist("perfcurve","file") == 2
    [~,~,~,auc] = perfcurve(actualPositive, positiveScore, true);
    out.rocAuc = auc; out.rocAvailable = true;
end
end

function value = safeDivide(numerator, denominator)
if isscalar(denominator)
    if denominator == 0, value = NaN; else, value = numerator / denominator; end
else
    value = numerator ./ denominator; value(denominator == 0) = NaN;
end
end

function saveEvaluationArtifacts(metrics, resultsFolder)
if ~isfolder(resultsFolder), mkdir(resultsFolder); end
stamp = string(datetime("now","Format","yyyyMMdd_HHmmss"));
save(fullfile(resultsFolder,"evaluation_" + stamp + ".mat"), "metrics", "-v7.3");
writetable(metrics.perClass, fullfile(resultsFolder,"per_class_metrics_" + stamp + ".csv"));
writematrix(metrics.confusionMatrix, fullfile(resultsFolder,"confusion_matrix_" + stamp + ".csv"));
try
    figureHandle = figure("Visible","off","Color","w");
    imagesc(metrics.confusionMatrix); axis image; colorbar;
    title("Held-out test confusion matrix"); xlabel("Predicted DR level"); ylabel("True DR level");
    ticks = 1:numel(metrics.classNames); xticks(ticks); yticks(ticks);
    xticklabels(metrics.classNames); yticklabels(metrics.classNames);
    for row = 1:size(metrics.confusionMatrix,1)
        for column = 1:size(metrics.confusionMatrix,2)
            text(column,row,string(metrics.confusionMatrix(row,column)),"HorizontalAlignment","center","Color","w");
        end
    end
    exportgraphics(figureHandle, fullfile(resultsFolder,"confusion_matrix_" + stamp + ".png"), "Resolution", 160);
    close(figureHandle);
catch ME
    warning("EyeRaksha:Evaluation:ConfusionMatrixFigure", "Could not save confusion-matrix figure: %s", ME.message);
end
end
