function reportPath = generateReport(result, outputFile, patientId)
%GENERATEREPORT Create a text report from an actual runDRScreening result.
if nargin < 2 || strlength(string(outputFile)) == 0, outputFile = fullfile("reports","screening_report.txt"); end
if nargin < 3, patientId = "Not provided"; end
if ~isfield(result,"status"), error("EyeRaksha:Report:InvalidResult", "Result must come from runDRScreening."); end
folder = fileparts(string(outputFile)); if strlength(folder)>0 && ~isfolder(folder), mkdir(folder); end
fid = fopen(outputFile,"w"); if fid < 0, error("EyeRaksha:Report:OpenFailed", "Cannot write report file."); end
cleanup = onCleanup(@() fclose(fid)); %#ok<NASGU>
fprintf(fid,"AI-ASSISTED DIABETIC RETINOPATHY SCREENING REPORT\n\n");
fprintf(fid,"Patient ID: %s\nGenerated: %s UTC\n\n",string(patientId),string(datetime("now","TimeZone","UTC")));
fprintf(fid,"Image quality: %s\nQuality score: %.1f/100\n",result.quality.status,result.quality.score);
if result.status == "RECAPTURE"
    fprintf(fid,"\nScreening result unavailable because the retinal image is not gradable.\n");
    fprintf(fid,"%s\n",join(result.messages,newline)); reportPath = string(outputFile); return
end
p = result.prediction;
fprintf(fid,"\nAI-assisted screening result: %s (Level %d)\n",p.label,p.level);
fprintf(fid,"Model confidence: %.2f%% (%s)\n",100*p.confidence,p.calibrationStatus);
fprintf(fid,"Referable DR (Level >= 2): %s\nRecommendation: %s\n",string(result.referable),result.recommendation);
fprintf(fid,"Class probabilities:\n");
for index = 1:numel(p.classNames), fprintf(fid,"  %s: %.2f%%\n",p.classNames(index),100*p.probabilities(index)); end
fprintf(fid,"\nThis tool provides AI-assisted diabetic retinopathy screening and is not a substitute for examination or diagnosis by a qualified eye-care professional.\n");
reportPath = string(outputFile);
end
