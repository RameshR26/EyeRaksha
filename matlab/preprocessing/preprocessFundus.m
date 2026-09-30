function output = preprocessFundus(imageInput, inputSize, config)
%PREPROCESSFUNDUS Canonical deterministic preprocessing for DR modelling.
% Use this exact function in training, validation, testing and inference.
if nargin < 2 || isempty(inputSize), inputSize = [224 224 3]; end
if nargin < 3, config = struct(); end
config = defaults(config);
if ischar(imageInput) || isstring(imageInput), I = imread(imageInput); else, I = imageInput; end
if ~isnumeric(I) || isempty(I), error("EyeRaksha:Preprocessing:InvalidImage", "Input must be a non-empty numeric image."); end
I = im2double(I);
if size(I,3) == 1, I = repmat(I,1,1,3); end
if size(I,3) ~= 3, error("EyeRaksha:Preprocessing:UnsupportedChannels", "Expected a grayscale or RGB image."); end

[cropped, mask, boundingBox] = cropRetina(I, config.paddingFraction);
illuminationCorrected = illuminationNormalization(cropped, config.illuminationSigma, config.targetIntensity);
denoised = denoiseFundus(illuminationCorrected, config.denoiseStrength);
enhanced = claheEnhancement(denoised, config.claheTiles, config.claheClipLimit);

output = struct("croppedImage", cropped, "retinalMask", mask, "boundingBox", boundingBox, ...
    "illuminationCorrected", illuminationCorrected, "denoisedImage", denoised, ...
    "enhancedImage", enhanced, "modelInput", resizeNormalize(enhanced, inputSize, config.normalization), ...
    "config", config);
end

function config = defaults(overrides)
config = struct("paddingFraction",0.03,"illuminationSigma",24,"targetIntensity",0.50, ...
    "denoiseStrength",0.6,"claheTiles",[8 8],"claheClipLimit",0.01,"normalization","zeroOne");
fields = fieldnames(overrides);
for i = 1:numel(fields), config.(fields{i}) = overrides.(fields{i}); end
end
