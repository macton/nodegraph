@echo off
SETLOCAL

set MY_WEB_PAGE=http://dl.dropbox.com/u/1346970/NodeGraphTest6/test.html
set MY_LOG=%CD%\log.txt
set MY_LOG_ENABLE=1
set MY_CMD=C:\Perl64\bin\perl.exe "\\locutus\users\gveltri\Scripts\chrome_with_console.pl" --no-sandbox --show-paint-rects --show-composited-layer-borders -js --harmony -js --trace-opt -js --trace-deopt -js --code-comments "%MY_WEB_PAGE%"

if "%MY_LOG_ENABLE%"=="1" del /F/Q "%MY_LOG%" && %MY_CMD% > "%MY_LOG%"
if not "%MY_LOG_ENABLE%"=="1" %MY_CMD%

ENDLOCAL
