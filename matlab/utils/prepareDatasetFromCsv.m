function summary = prepareDatasetFromCsv(imagesFolder, csvPath, datasetRoot, options)
%PREPAREDATASETFROMCSV Convert labelled fundus images into class folders.
%   Source labels must be 0, 1, 2, 3, or 4. This utility copies files into:
%   datasetRoot/train/<label>, datasetRoot/validation/<label>, datasetRoot/test/<label>
%
% Use OPTIONS.SplitColumn when the CSV already defines a split. If omitted,
% a reproducible class-stratified split is created with OPTIONS.Seed. Confirm
% that images from one patient are not distributed across multiple splits.

if nargin < 4, options = struct(); end
options = defaults(options);
imagesFolder = string(imagesFolder); csvPath = string(csvPath); datasetRoot = string(datasetRoot);
if ~isfolder(imagesFolder), error("EyeRaksha:Dataset:ImagesFolderMissing", "Images folder not found: %s", imagesFolder); end
if ~isfile(csvPath), error("EyeRaksha:Dataset:CsvMissing", "CSV file not found: %s", csvPath); end

labels = readtable(csvPath, "TextType", "string");
requireColumn(labels, options.ImageIdColumn); requireColumn(labels, options.LabelColumn);
imageIds = string(labels.(options.ImageIdColumn));
grades = parseGrades(labels.(options.LabelColumn));

if strlength(options.SplitColumn) > 0
    requireColumn(labels, options.SplitColumn);
    splits = normalizeSplits(labels.(options.SplitColumn));
else
    splits = stratifiedSplits(grades, options);
end

for split = ["train" "validation" "test"]
    for grade = 0:4
        folder = fullfile(datasetRoot, split, string(grade));
        if ~isfolder(folder), mkdir(folder); end
    end
end

sourceFile = strings(height(labels),1); destinationFile = strings(height(labels),1); copied = false(height(labels),1);
for row = 1:height(labels)
    sourceFile(row) = findImage(imagesFolder, imageIds(row), options.Extensions);
    if strlength(sourceFile(row)) == 0
        if options.FailOnMissing
            error("EyeRaksha:Dataset:ImageMissing", "No image found for CSV ID '%s'.", imageIds(row));
        end
        continue
    end
    [~, name, extension] = fileparts(sourceFile(row));
    safeName = regexprep(name, "[^A-Za-z0-9_-]", "_");
    destinationFolder = fullfile(datasetRoot, splits(row), string(grades(row)));
    destinationFile(row) = uniqueDestination(destinationFolder, safeName, extension);
    [ok, message] = copyfile(sourceFile(row), destinationFile(row));
    if ~ok, error("EyeRaksha:Dataset:CopyFailed", "Could not copy '%s': %s", sourceFile(row), message); end
    copied(row) = true;
end

manifest = table(imageIds, grades, splits, sourceFile, destinationFile, copied, ...
    "VariableNames", {"imageId","grade","split","sourceFile","destinationFile","copied"});
writetable(manifest, fullfile(datasetRoot,"dataset_manifest.csv"));
summary = validateDatasetLayout(datasetRoot, false);
summary.manifestPath = fullfile(datasetRoot,"dataset_manifest.csv");
summary.copiedFiles = nnz(copied);
summary.missingFiles = nnz(~copied);
end

function options = defaults(overrides)
options = struct("ImageIdColumn","id_code","LabelColumn","diagnosis","SplitColumn","", ...
    "Extensions",[".png" ".jpg" ".jpeg"],"TrainFraction",0.70,"ValidationFraction",0.15, ...
    "TestFraction",0.15,"Seed",42,"FailOnMissing",true);
names = fieldnames(overrides);
for i = 1:numel(names), options.(names{i}) = overrides.(names{i}); end
if abs(options.TrainFraction + options.ValidationFraction + options.TestFraction - 1) > 1e-9
    error("EyeRaksha:Dataset:InvalidFractions", "Train, validation and test fractions must add to 1.");
end
end

function requireColumn(T, name)
if ~ismember(string(name), string(T.Properties.VariableNames))
    error("EyeRaksha:Dataset:MissingColumn", "CSV column '%s' was not found.", name);
end
end

function grades = parseGrades(values)
grades = str2double(string(values));
if any(isnan(grades)) || any(grades ~= floor(grades)) || any(grades < 0 | grades > 4)
    error("EyeRaksha:Dataset:InvalidLabels", "Labels must be integer DR grades from 0 to 4.");
end
end

function splits = normalizeSplits(values)
raw = lower(strtrim(string(values)));
splits = strings(size(raw));
splits(raw == "train") = "train";
splits(raw == "validation" | raw == "val") = "validation";
splits(raw == "test") = "test";
if any(strlength(splits) == 0)
    error("EyeRaksha:Dataset:InvalidSplit", "Split values must be train, validation/val, or test.");
end
end

function splits = stratifiedSplits(grades, options)
oldRng = rng; cleanup = onCleanup(@() rng(oldRng)); %#ok<NASGU>
rng(options.Seed, "twister");
splits = strings(size(grades));
for grade = 0:4
    rows = find(grades == grade); rows = rows(randperm(numel(rows)));
    count = numel(rows); trainEnd = floor(count * options.TrainFraction);
    validationEnd = trainEnd + floor(count * options.ValidationFraction);
    splits(rows(1:trainEnd)) = "train";
    splits(rows(trainEnd+1:validationEnd)) = "validation";
    splits(rows(validationEnd+1:end)) = "test";
end
end

function path = findImage(imagesFolder, imageId, extensions)
candidate = fullfile(imagesFolder, imageId);
if isfile(candidate), path = candidate; return; end
path = "";
for extension = string(extensions)
    candidate = fullfile(imagesFolder, imageId + extension);
    if isfile(candidate), path = candidate; return; end
end
end

function destination = uniqueDestination(folder, name, extension)
destination = fullfile(folder, name + extension); suffix = 1;
while isfile(destination)
    destination = fullfile(folder, name + "_" + string(suffix) + extension);
    suffix = suffix + 1;
end
end
