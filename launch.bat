@echo off
:: Temporary bypass for PowerShell execution policy and run the script
powershell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0launch.ps1'"
pause
