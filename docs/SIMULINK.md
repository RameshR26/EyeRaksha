# Simulink capacity model

Run `buildRuralSimulation` in MATLAB after adding the project MATLAB path. It creates `RuralDRScreening.slx`, a transparent starting model for annual-patient arrival, daily arrival, and AI utilization.

The frontend scenario planner is illustrative. Before using its values as findings, calibrate the Simulink model with actual acquisition time, image rejection rate, network delays, inference timing, reviewer service time, working hours, and referral capacity. Queue-length and waiting-time claims require a validated discrete-event model and measured assumptions.

No offline inference is claimed unless a deployed on-device model is separately implemented and verified.
