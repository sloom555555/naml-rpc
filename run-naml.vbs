Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "X:\dqdq\sentry-rpc"
WshShell.Run "cmd.exe /c npm start", 0, False
