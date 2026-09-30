function J = claheEnhancement(I, numTiles, clipLimit)
%CLAHEENHANCEMENT Apply CLAHE to luminance while preserving colour.
if nargin < 2, numTiles = [8 8]; end
if nargin < 3, clipLimit = 0.01; end
I = im2double(I);
if size(I,3) == 1
    J = adapthisteq(I, "NumTiles", numTiles, "ClipLimit", clipLimit);
    return
end
lab = rgb2lab(I);
L = lab(:,:,1) / 100;
lab(:,:,1) = 100 * adapthisteq(L, "NumTiles", numTiles, "ClipLimit", clipLimit);
J = min(1, max(0, lab2rgb(lab)));
end
