function J = denoiseFundus(I, strength)
%DENOISEFUNDUS Apply a conservative noise-reduction filter.
% Strength defaults to 0.6 pixels. It intentionally avoids aggressive
% smoothing that can erase fine retinal detail.
if nargin < 2, strength = 0.6; end
I = im2double(I);
if exist("imnlmfilt", "file") == 2
    J = zeros(size(I));
    for channel = 1:size(I,3)
        J(:,:,channel) = imnlmfilt(I(:,:,channel), "DegreeOfSmoothing", 0.002);
    end
else
    J = zeros(size(I));
    for channel = 1:size(I,3)
        J(:,:,channel) = imgaussfilt(I(:,:,channel), strength);
    end
end
J = min(1, max(0, J));
end
