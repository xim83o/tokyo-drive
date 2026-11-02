@echo off
rem Abre Tokyo Drive con un servidor local (necesario para cargar el mapa y los modelos)
title Tokyo Drive - servidor (NO cierres esta ventana mientras juegas)
cd /d "%~dp0"
echo.
echo  TOKYO DRIVE
echo  -----------
echo  En este PC:  http://localhost:8765
echo  En el movil (misma wifi): http://IP-DEL-PC:8765
echo  IP de este PC:
ipconfig | findstr /c:"IPv4"
echo.
echo  Para cerrar el juego, cierra esta ventana.
echo.
start "" "http://localhost:8765"
python -m http.server 8765
echo.
echo  El servidor se ha cerrado o no ha podido arrancar. Lee el mensaje de arriba.
pause
