function buildRuralSimulation()
%BUILDRURALSIMULATION Build a simple Simulink capacity-flow prototype.
%
% This is intentionally a transparent block-level starting point.
% For final SIH quantitative claims, calibrate arrival distributions,
% service times, network delay and reviewer capacity from your project data.

mdl = "RuralDRScreening";
if bdIsLoaded(mdl), close_system(mdl,0); end
if exist(mdl+".slx","file"), delete(mdl+".slx"); end

new_system(mdl);
open_system(mdl);

add_block("simulink/Sources/Constant", mdl+"/Annual Patients", ...
    Position=[30 80 130 110], Value="100000");

add_block("simulink/Math Operations/Gain", mdl+"/Patients per Day", ...
    Position=[180 80 300 110], Gain="1/365");

add_block("simulink/Math Operations/Gain", mdl+"/AI Capacity Utilization", ...
    Position=[350 80 510 110], Gain="1/420");

add_block("simulink/Sinks/Display", mdl+"/Daily Arrival", ...
    Position=[560 55 650 95]);

add_block("simulink/Sinks/Display", mdl+"/AI Utilization", ...
    Position=[560 105 650 145]);

add_line(mdl,"Annual Patients/1","Patients per Day/1");
add_line(mdl,"Patients per Day/1","Daily Arrival/1");
add_line(mdl,"Patients per Day/1","AI Capacity Utilization/1");
add_line(mdl,"AI Capacity Utilization/1","AI Utilization/1");

set_param(mdl,"SaveOutput","on");
save_system(mdl);
open_system(mdl);
end