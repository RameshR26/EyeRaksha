function J = illuminationNormalization(I, sigma, targetIntensity)
%ILLUMINATIONNORMALIZATION Correct slow-varying fundus illumination changes.
if nargin < 2, sigma = 24; end
if nargin < 3, targetIntensity = 0.50; end
I = im2double(I);
J = zeros(size(I));
for channel = 1:size(I,3)
    background = imgaussfilt(I(:,:,channel), sigma);
    corrected = I(:,:,channel) ./ max(background, 0.02);
    valid = corrected(corrected > 0);
    if isempty(valid), scale = 1; else, scale = targetIntensity / median(valid); end
    J(:,:,channel) = min(1, max(0, corrected * scale));
end
end
