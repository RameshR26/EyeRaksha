function X = resizeNormalize(I, inputSize, normalization)
%RESIZENORMALIZE Resize and convert an enhanced image to network input.
% NORMALIZATION is "zeroOne" (default) or "zscore". For zscore, record and
% reuse the training-set statistics rather than computing them per image.
if nargin < 3, normalization = "zeroOne"; end
if nargin < 2 || isempty(inputSize), inputSize = [224 224 3]; end
if numel(inputSize) < 3, inputSize(3) = 3; end
I = im2double(I);
if size(I,3) == 1 && inputSize(3) == 3, I = repmat(I,1,1,3); end
if size(I,3) == 3 && inputSize(3) == 1, I = rgb2gray(I); end
X = imresize(I, inputSize(1:2), "bicubic");
switch string(normalization)
    case "zeroOne"
        X = single(min(1,max(0,X)));
    otherwise
        error("EyeRaksha:Preprocessing:UnsupportedNormalization", "Unsupported normalization: %s", normalization);
end
end
