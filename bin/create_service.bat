@echo off

@REM ##########################################################
@REM #########   Copyright (c) 2016 - 2017 BigSQL    ##########
@REM ##########################################################

set BAM_SERVICE_NAME="bigsql.pgdevops"
set BAM_SERVICE_DESCRIPTION="BigSQL DevOps Console for Developers &/or Operations"
set BAM_SERVICE_DISPLAY_NAME="pgDevOps By BigSQL"
set CWD=%~sdp0
set PR_BAM_PID_FILE="pgdevops.pid"

REM Startup configuration
set PR_STARTUP=auto
set PR_STARTMODE=EXE
set BAM_STARTPARAM="%CWD%start_crossbar.py;start;--cbdir;%CWD%.;--loglevel;info;--logtofile;--logdir;%CWD%..\..\data\logs\pgdevops"
set PR_ENV="USERNAME=%USERNAME%#PYTHONPATH=%CWD%..\lib#PATH=%CWD%..\..\python2#PYTHONHOME=%CWD%..\..\python2#PGC_HOME=%CWD%..\..#PGC_LOGS=%CWD%..\..\logs\pgcli_log.out"

set BAM_STARTIMAGE=%CWD%..\..\python2\python.exe
set BAM_INSTALL="%CWD%bam.exe"

set PR_LOG_PATH="%CWD%..\logs"
REM Install servic prunsrv.exe //IS//%SERVICE_NAME%


%BAM_INSTALL% //IS//%BAM_SERVICE_NAME% --Description=%BAM_SERVICE_DESCRIPTION% --DisplayName=%BAM_SERVICE_DISPLAY_NAME% --PidFile=%PR_BAM_PID_FILE% ++Environment=%PR_ENV% --Install=%PR_INSTALL% --Startup=%PR_STARTUP% --LogPath="%PR_LOG_PATH%" --StdOutput=auto --StdError=auto --StartMode=%PR_STARTMODE% ++StartParams="%BAM_STARTPARAM%" --StartImage=%BAM_STARTIMAGE%
