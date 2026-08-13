@echo off
set "PATH=%USERPROFILE%\.local\git\cmd;%PATH%"
echo We are about to push your project to GitHub!
echo A window will appear asking you to sign in to GitHub.
git push -u origin main
echo.
pause
