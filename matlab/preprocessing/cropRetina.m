function [croppedImage, croppedMask, boundingBox] = cropRetina(I, paddingFraction)
%CROPRETINA Remove black background around the retinal field of view.
%   The output is derived from an intensity/saturation mask; no disease
%   information is used. PADDINGFRACTION defaults to 0.03 of the field size.

if nargin < 2, paddingFraction = 0.03; end
I = im2double(I);
if size(I,3) == 3
    gray = rgb2gray(I);
    hsvI = rgb2hsv(I);
    mask = gray > 0.04 & (hsvI(:,:,2) > 0.05 | gray > 0.18);
else
    gray = I;
    mask = gray > 0.04;
end

mask = imopen(mask, strel("disk",5,0));
mask = imclose(mask, strel("disk",5,0));
mask = imfill(mask,"holes");
mask = bwareafilt(mask,1);
[rows, cols] = find(mask);

if isempty(rows)
    croppedImage = I;
    croppedMask = false(size(gray));
    boundingBox = [1 1 size(I,2) size(I,1)];
    return
end

pad = round(max(size(mask)) * paddingFraction);
r1 = max(1, min(rows)-pad); r2 = min(size(I,1), max(rows)+pad);
c1 = max(1, min(cols)-pad); c2 = min(size(I,2), max(cols)+pad);
croppedImage = I(r1:r2,c1:c2,:);
croppedMask = mask(r1:r2,c1:c2);
boundingBox = [c1 r1 c2-c1+1 r2-r1+1];
end
