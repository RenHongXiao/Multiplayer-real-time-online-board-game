@echo off
chcp 65001 >nul
echo Starting MongoDB with data directory: D:\mongodb-data
start /B "" "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath "D:\mongodb-data"
echo MongoDB started on port 27017
pause
