@echo off

@REM ##########################################################
@REM #########   Copyright (c) 2016 - 2017 BigSQL    ##########
@REM ##########################################################

set CWD=%~sdp0
set BAM_SERVICE_NAME="bigsql.pgdevops"
set BAM_INSTALL="%CWD%bam.exe"

%BAM_INSTALL% //DS//%BAM_SERVICE_NAME%
