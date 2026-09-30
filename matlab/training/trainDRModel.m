function [trainedNet, trainingInfo, modelMetadata] = trainDRModel(dataFolder, outputFile, config)
%TRAINDRMODEL Train a five-class DR classifier from a real labelled dataset.
%   Uses transfer learning with imagePretrainedNetwork and trainnet. No model
%   is created when the supplied dataset is missing, invalid, or empty.
%
% Example:
%   [net,info,meta] = trainDRModel("dataset","models/dr_model.mat");

if nargin < 1 || strlength(string(dataFolder)) == 0, dataFolder = "dataset"; end
if nargin < 2 || strlength(string(outputFile)) == 0, outputFile = fullfile("models","dr_model.mat"); end
if nargin < 3, config = struct(); end
config = defaultConfig(config);
dataFolder = string(dataFolder); outputFile = string(outputFile);

summary = validateDatasetLayout(dataFolder, true);
oldRng = rng; restoreRng = onCleanup(@() rng(oldRng)); %#ok<NASGU>
rng(config.Seed, "twister");

imdsTrain = labelledDatastore(fullfile(dataFolder,"train"), config);
imdsValidation = labelledDatastore(fullfile(dataFolder,"validation"), config);
classNames = categorical(string(0:4));
assertClasses(imdsTrain.Labels, classNames, "training");
assertClasses(imdsValidation.Labels, classNames, "validation");

% Oversampling duplicates only training-file references; validation and test
% sets remain untouched. This is recorded in model metadata for traceability.
[balancedTrain, classCounts, balancedCounts] = balanceClasses(imdsTrain, classNames);

try
    trainedNet = imagePretrainedNetwork(config.BaseNetwork, NumClasses=numel(classNames));
catch ME
    error("EyeRaksha:Training:PretrainedNetworkUnavailable", ...
        "Could not load '%s'. Install the required support package/toolbox. Original error: %s", config.BaseNetwork, ME.message);
end
inputSize = trainedNet.Layers(1).InputSize;
preprocessConfig = config.PreprocessConfig;
balancedTrain.ReadFcn = @(filename) preprocessFundus(filename, inputSize, preprocessConfig).modelInput;
imdsValidation.ReadFcn = @(filename) preprocessFundus(filename, inputSize, preprocessConfig).modelInput;

augmenter = imageDataAugmenter( ...
    RandRotation=config.Augmentation.RotationDegrees, ...
    RandXReflection=config.Augmentation.HorizontalFlip, ...
    RandXTranslation=config.Augmentation.XTranslationPixels, ...
    RandYTranslation=config.Augmentation.YTranslationPixels, ...
    RandXScale=config.Augmentation.ScaleRange, ...
    RandYScale=config.Augmentation.ScaleRange);
augmentedTrain = augmentedImageDatastore(inputSize(1:2), balancedTrain, DataAugmentation=augmenter);
augmentedValidation = augmentedImageDatastore(inputSize(1:2), imdsValidation);

options = trainingOptions("adam", ...
    InitialLearnRate=config.InitialLearnRate, ...
    MaxEpochs=config.MaxEpochs, ...
    MiniBatchSize=config.MiniBatchSize, ...
    Shuffle="every-epoch", ...
    ValidationData=augmentedValidation, ...
    ValidationFrequency=config.ValidationFrequency, ...
    ValidationPatience=config.ValidationPatience, ...
    Verbose=true, ...
    Plots=config.Plots);

[trainedNet, trainingInfo] = trainnet(augmentedTrain, trainedNet, "crossentropy", options);

modelMetadata = struct( ...
    "formatVersion", "1.0", ...
    "createdAt", datetime("now","TimeZone","UTC"), ...
    "baseNetwork", string(config.BaseNetwork), ...
    "classNames", string(classNames), ...
    "inputSize", inputSize, ...
    "preprocessConfig", preprocessConfig, ...
    "trainingConfig", config, ...
    "classCountsBeforeBalancing", classCounts, ...
    "classCountsAfterBalancing", balancedCounts, ...
    "datasetSummary", summary, ...
    "calibrationStatus", "uncalibrated");

outputFolder = fileparts(outputFile);
if strlength(outputFolder) > 0 && ~isfolder(outputFolder), mkdir(outputFolder); end
save(outputFile, "trainedNet", "classNames", "modelMetadata", "trainingInfo", "-v7.3");
saveTrainingArtifacts(trainingInfo, modelMetadata, config);
end

function imds = labelledDatastore(folder, config)
imds = imageDatastore(folder, IncludeSubfolders=true, LabelSource="foldernames", ...
    FileExtensions=config.AllowedExtensions);
if isempty(imds.Files), error("EyeRaksha:Training:NoImages", "No supported images found in %s", folder); end
end

function assertClasses(labels, expected, splitName)
actual = sort(string(categories(labels)));
if ~isequal(actual(:), sort(string(expected(:))))
    error("EyeRaksha:Training:UnexpectedClasses", "%s labels must contain exactly folders 0, 1, 2, 3, and 4.", splitName);
end
end

function [balanced, originalCounts, balancedCounts] = balanceClasses(imds, classNames)
originalCounts = countEachLabel(imds);
originalCounts = originalCounts.Count;
targetCount = max(originalCounts);
files = strings(0,1); labels = categorical(strings(0,1), string(classNames));
for index = 1:numel(classNames)
    classFiles = imds.Files(imds.Labels == classNames(index));
    repetitions = ceil(targetCount / numel(classFiles));
    selected = repmat(classFiles, repetitions, 1);
    selected = selected(1:targetCount);
    files = [files; string(selected)]; %#ok<AGROW>
    labels = [labels; repmat(classNames(index), targetCount, 1)]; %#ok<AGROW>
end
order = randperm(numel(files));
balanced = imageDatastore(cellstr(files(order)), FileExtensions={".jpg",".jpeg",".png",".tif",".tiff"});
balanced.Labels = labels(order);
balancedCounts = repmat(targetCount, numel(classNames), 1);
end

function saveTrainingArtifacts(trainingInfo, modelMetadata, config)
if ~isfolder(config.TrainingResultsFolder), mkdir(config.TrainingResultsFolder); end
timestamp = string(datetime("now","Format","yyyyMMdd_HHmmss"));
artifactPath = fullfile(config.TrainingResultsFolder, "training_" + timestamp + ".mat");
save(artifactPath, "trainingInfo", "modelMetadata", "-v7.3");
end

function config = defaultConfig(overrides)
config = struct( ...
    "BaseNetwork", "resnet101", ...
    "Seed", 42, ...
    "InitialLearnRate", 1e-4, ...
    "MaxEpochs", 15, ...
    "MiniBatchSize", 16, ...
    "ValidationFrequency", 50, ...
    "ValidationPatience", 5, ...
    "Plots", "training-progress", ...
    "TrainingResultsFolder", "training_results", ...
    "AllowedExtensions", {{".jpg",".jpeg",".png",".tif",".tiff"}}, ...
    "PreprocessConfig", struct(), ...
    "Augmentation", struct("RotationDegrees",[-10 10],"HorizontalFlip",true,"XTranslationPixels",[-8 8],"YTranslationPixels",[-8 8],"ScaleRange",[0.95 1.05]));
names = fieldnames(overrides);
for i = 1:numel(names)
    if isstruct(overrides.(names{i})) && isfield(config,names{i})
        nested = config.(names{i}); nestedNames = fieldnames(overrides.(names{i}));
        for j = 1:numel(nestedNames), nested.(nestedNames{j}) = overrides.(names{i}).(nestedNames{j}); end
        config.(names{i}) = nested;
    else
        config.(names{i}) = overrides.(names{i});
    end
end
end
