function J = enhanceImage(I)
%ENHANCEIMAGE Backward-compatible display wrapper for preprocessFundus.
% Model training and inference must call preprocessFundus directly so resize
% and normalization are applied identically in every environment.
processed = preprocessFundus(I, [224 224 3]);
J = processed.enhancedImage;
end
