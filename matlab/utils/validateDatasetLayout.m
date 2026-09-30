function summary = validateDatasetLayout(datasetRoot, requireImages)
%VALIDATEDATASETLAYOUT Validate the five-class train/validation/test layout.
if nargin < 2, requireImages = true; end
datasetRoot = string(datasetRoot); splits = ["train" "validation" "test"];
counts = zeros(numel(splits),5);
for splitIndex = 1:numel(splits)
    for grade = 0:4
        folder = fullfile(datasetRoot, splits(splitIndex), string(grade));
        if ~isfolder(folder)
            error("EyeRaksha:Dataset:MissingFolder", "Required folder is missing: %s", folder);
        end
        images = imageDatastore(folder, "FileExtensions", {".jpg",".jpeg",".png",".tif",".tiff"});
        counts(splitIndex,grade+1) = numel(images.Files);
        if requireImages && counts(splitIndex,grade+1) == 0
            error("EyeRaksha:Dataset:EmptyClass", "No images found in %s", folder);
        end
    end
end
summary = struct("splits",splits,"classNames",string(0:4),"counts",counts, ...
    "totalImages",sum(counts,"all"),"isComplete",true);
end
