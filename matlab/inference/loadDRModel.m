function model = loadDRModel(modelSource)
%LOADDRMODEL Load and validate a model produced by trainDRModel.
if isstruct(modelSource) && isfield(modelSource,"trainedNet")
    model = modelSource;
    return
end
modelFile = string(modelSource);
if ~isfile(modelFile), error("EyeRaksha:Inference:ModelMissing", "Model not trained yet: %s", modelFile); end
loaded = load(modelFile,"trainedNet","classNames","modelMetadata");
required = ["trainedNet" "classNames" "modelMetadata"];
if any(~isfield(loaded,required)), error("EyeRaksha:Inference:InvalidModel", "Model file is missing required training metadata."); end
if ~isfield(loaded.modelMetadata,"preprocessConfig") || ~isfield(loaded.modelMetadata,"inputSize")
    error("EyeRaksha:Inference:InvalidModel", "Model file is missing canonical preprocessing metadata.");
end
model = loaded;
end
