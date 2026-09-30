function q = qualityCheck(imageInput, config)
%QUALITYCHECK Measure whether a fundus image is suitable for DR screening.
%   Q = QUALITYCHECK(IMAGEINPUT) accepts an image matrix or image filename.
%   Q = QUALITYCHECK(IMAGEINPUT, CONFIG) overrides configurable thresholds.
%
% This function performs deterministic image measurements; it does not use a
% model or generate clinical predictions. Thresholds are starting values and
% MUST be calibrated and documented using representative capture data before
% any deployment claim is made.

if nargin < 2 || isempty(config)
    config = defaultConfig();
else
    config = mergeConfig(defaultConfig(), config);
end

I = loadAndValidateImage(imageInput);
[height, width, channels] = size(I);
gray = toGray(I);

% Retinal field-of-view: retain non-black, coloured/illuminated pixels, then
% remove isolated noise and fill small holes in the field.
mask = retinalMask(I, gray, config);
coverage = 100 * nnz(mask) / numel(mask);

% Compute measurements only within the visible retinal field. If no reliable
% field is detected, use the full image to keep all metrics well-defined.
measurementMask = mask;
if nnz(measurementMask) < config.minimumMaskPixels
    measurementMask = true(size(gray));
end
pixels = gray(measurementMask);

% Focus: variance of the Laplacian is a standard blur/sharpness indicator.
laplacian = imfilter(gray, fspecial("laplacian", config.laplacianAlpha), "replicate");
laplacianVariance = var(laplacian(measurementMask), 1);
focus = scoreHigherIsBetter(laplacianVariance, config.focusMinimum, config.focusTarget);

% Exposure and contrast from the actual visible field.
meanIntensity = mean(pixels);
intensityStd = std(pixels, 1);
brightness = scoreCentered(meanIntensity, config.targetBrightness, config.brightnessTolerance);
contrast = scoreHigherIsBetter(intensityStd, config.contrastMinimum, config.contrastTarget);
underexposedFraction = mean(pixels <= config.darkPixelThreshold);
overexposedFraction = mean(pixels >= config.brightPixelThreshold);

% Illumination uniformity is measured from coarse local mean intensity.
localMean = imgaussfilt(gray, config.illuminationSigma);
illuminationCv = std(localMean(measurementMask), 1) / max(eps, mean(localMean(measurementMask)));
illumination = scoreLowerIsBetter(illuminationCv, config.illuminationTargetCv, config.illuminationMaximumCv);

resolutionOk = min(height, width) >= config.minimumImageDimension;
resolution = 100 * min(1, min(height, width) / config.targetImageDimension);

% Weighted score has a transparent, deterministic definition. It is an image
% quality score—not an estimate of disease severity or diagnostic accuracy.
score = config.weights.focus * focus + ...
    config.weights.brightness * brightness + ...
    config.weights.contrast * contrast + ...
    config.weights.illumination * illumination + ...
    config.weights.coverage * min(100, coverage) + ...
    config.weights.resolution * resolution;
score = max(0, min(100, score));

[reasons, instructions] = qualityMessages(focus, brightness, contrast, illumination, coverage, ...
    underexposedFraction, overexposedFraction, resolutionOk, config);
gradable = isempty(reasons) && score >= config.acceptanceScore;

if gradable
    status = "GOOD";
elseif score >= config.borderlineScore && coverage >= config.minimumCoverage
    status = "BORDERLINE";
else
    status = "POOR";
end

q = struct( ...
    "status", status, ...
    "gradable", gradable, ...
    "score", score, ...
    "focus", focus, ...
    "brightness", brightness, ...
    "contrast", contrast, ...
    "illumination", illumination, ...
    "retinalArea", coverage, ...
    "resolution", resolution, ...
    "imageHeight", height, ...
    "imageWidth", width, ...
    "channels", channels, ...
    "laplacianVariance", laplacianVariance, ...
    "meanIntensity", meanIntensity, ...
    "intensityStd", intensityStd, ...
    "illuminationCv", illuminationCv, ...
    "underexposedFraction", underexposedFraction, ...
    "overexposedFraction", overexposedFraction, ...
    "reasons", string(reasons), ...
    "recaptureInstructions", string(instructions), ...
    "thresholds", config);
end

function I = loadAndValidateImage(imageInput)
if ischar(imageInput) || isstring(imageInput)
    imagePath = string(imageInput);
    if ~isfile(imagePath), error("EyeRaksha:Quality:FileNotFound", "Image file does not exist: %s", imagePath); end
    try, I = imread(imagePath); catch ME, error("EyeRaksha:Quality:UnreadableImage", "Unable to read image: %s", ME.message); end
else
    I = imageInput;
end
if ~isnumeric(I) || isempty(I) || ndims(I) > 3 || ndims(I) < 2
    error("EyeRaksha:Quality:InvalidImage", "Input must be a non-empty 2-D or 3-D numeric image.");
end
if size(I, 3) ~= 1 && size(I, 3) ~= 3
    error("EyeRaksha:Quality:UnsupportedChannels", "Fundus image must have one or three colour channels.");
end
if any(~isfinite(I(:)))
    error("EyeRaksha:Quality:InvalidPixels", "Image contains non-finite pixel values.");
end
I = im2double(I);
end

function gray = toGray(I)
if size(I, 3) == 3, gray = rgb2gray(I); else, gray = I; end
end

function mask = retinalMask(I, gray, config)
if size(I, 3) == 3
    saturation = rgb2hsv(I); saturation = saturation(:, :, 2);
    mask = (gray > config.backgroundIntensity) & (saturation > config.minimumSaturation | gray > config.brightRetinaIntensity);
else
    mask = gray > config.backgroundIntensity;
end
mask = imopen(mask, strel("disk", config.morphologyRadius, 0));
mask = imclose(mask, strel("disk", config.morphologyRadius, 0));
mask = imfill(mask, "holes");
mask = bwareafilt(mask, 1);
end

function score = scoreHigherIsBetter(value, minimum, target)
score = 100 * (value - minimum) / max(eps, target - minimum);
score = max(0, min(100, score));
end

function score = scoreLowerIsBetter(value, target, maximum)
score = 100 * (maximum - value) / max(eps, maximum - target);
score = max(0, min(100, score));
end

function score = scoreCentered(value, target, tolerance)
score = 100 * (1 - abs(value - target) / max(eps, tolerance));
score = max(0, min(100, score));
end

function [reasons, instructions] = qualityMessages(focus, brightness, contrast, illumination, coverage, underFraction, overFraction, resolutionOk, config)
reasons = {}; instructions = {};
if focus < config.minimumFocusScore
    reasons{end+1} = "Image is too blurry."; instructions{end+1} = "Hold the camera steady and refocus before capturing again."; end
if coverage < config.minimumCoverage
    reasons{end+1} = "Retinal field of view is insufficient."; instructions{end+1} = "Keep the eye centered and capture the complete retinal field."; end
if underFraction > config.maximumUnderexposedFraction || brightness < config.minimumBrightnessScore
    reasons{end+1} = "Image is excessively dark."; instructions{end+1} = "Ensure sufficient illumination and move the camera closer if needed."; end
if overFraction > config.maximumOverexposedFraction
    reasons{end+1} = "Image is overexposed."; instructions{end+1} = "Reduce glare or flash intensity and recapture the image."; end
if illumination < config.minimumIlluminationScore
    reasons{end+1} = "Illumination is uneven."; instructions{end+1} = "Adjust lighting so the retinal field is evenly illuminated."; end
if contrast < config.minimumContrastScore
    reasons{end+1} = "Image contrast is too low."; instructions{end+1} = "Clean the lens and recapture with the eye and camera properly aligned."; end
if ~resolutionOk
    reasons{end+1} = "Image resolution is too low."; instructions{end+1} = "Use the highest available camera resolution for screening."; end
end

function config = defaultConfig()
config = struct();
config.acceptanceScore = 70; config.borderlineScore = 50;
config.minimumImageDimension = 512; config.targetImageDimension = 1024;
config.backgroundIntensity = 0.04; config.minimumSaturation = 0.05; config.brightRetinaIntensity = 0.18;
config.morphologyRadius = 5; config.minimumMaskPixels = 500;
config.laplacianAlpha = 0.2; config.focusMinimum = 2e-4; config.focusTarget = 3e-3; config.minimumFocusScore = 45;
config.targetBrightness = 0.45; config.brightnessTolerance = 0.35; config.minimumBrightnessScore = 40;
config.contrastMinimum = 0.035; config.contrastTarget = 0.16; config.minimumContrastScore = 35;
config.darkPixelThreshold = 0.08; config.brightPixelThreshold = 0.95; config.maximumUnderexposedFraction = 0.45; config.maximumOverexposedFraction = 0.12;
config.illuminationSigma = 24; config.illuminationTargetCv = 0.10; config.illuminationMaximumCv = 0.45; config.minimumIlluminationScore = 40;
config.minimumCoverage = 40;
config.weights = struct("focus", .25, "brightness", .15, "contrast", .15, "illumination", .15, "coverage", .20, "resolution", .10);
end

function merged = mergeConfig(defaults, overrides)
merged = defaults;
fields = fieldnames(overrides);
for i = 1:numel(fields)
    field = fields{i};
    if isstruct(overrides.(field)) && isfield(defaults, field)
        merged.(field) = mergeConfig(defaults.(field), overrides.(field));
    else
        merged.(field) = overrides.(field);
    end
end
end
