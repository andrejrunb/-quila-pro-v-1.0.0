$code = @"
using System;
using System.Runtime.InteropServices;

public class SovereignDesktopRunner {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct STARTUPINFO {
        public Int32 cb;
        public string lpReserved;
        public string lpDesktop;
        public string lpTitle;
        public Int32 dwX;
        public Int32 dwY;
        public Int32 dwXSize;
        public Int32 dwYSize;
        public Int32 dwXCountChars;
        public Int32 dwYCountChars;
        public Int32 dwFillAttribute;
        public Int32 dwFlags;
        public Int16 wShowWindow;
        public Int16 cbReserved2;
        public IntPtr lpReserved2;
        public IntPtr hStdInput;
        public IntPtr hStdOutput;
        public IntPtr hStdError;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct PROCESS_INFORMATION {
        public IntPtr hProcess;
        public IntPtr hThread;
        public Int32 dwProcessId;
        public Int32 dwThreadId;
    }

    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool CreateProcess(
        string lpApplicationName,
        string lpCommandLine,
        IntPtr lpProcessAttributes,
        IntPtr lpThreadAttributes,
        bool bInheritHandles,
        uint dwCreationFlags,
        IntPtr lpEnvironment,
        string lpCurrentDirectory,
        ref STARTUPINFO lpStartupInfo,
        out PROCESS_INFORMATION lpProcessInformation);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern uint WaitForSingleObject(IntPtr hHandle, uint dwMilliseconds);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool CloseHandle(IntPtr hObject);

    public const uint INFINITE = 0xFFFFFFFF;

    public static void RunForever(string exePath, string args, string workDir) {
        STARTUPINFO si = new STARTUPINFO();
        si.cb = Marshal.SizeOf(si);
        si.lpDesktop = @"WinSta0\default";

        PROCESS_INFORMATION pi = new PROCESS_INFORMATION();

        string fullCmd = "\"" + exePath + "\" " + args;
        Console.WriteLine("[DesktopRunner] Lançando Áquila Pro na Área de Trabalho interativa (WinSta0\\default)...");
        Console.WriteLine("[DesktopRunner] Binário: " + fullCmd);

        bool res = CreateProcess(null, fullCmd, IntPtr.Zero, IntPtr.Zero, false, 0, IntPtr.Zero, workDir, ref si, out pi);
        if (!res) {
            int err = Marshal.GetLastWin32Error();
            Console.WriteLine("[DesktopRunner] ERRO ao criar processo: " + err);
            return;
        }

        Console.WriteLine("[DesktopRunner] Áquila Pro iniciado com sucesso na tela do usuário! PID: " + pi.dwProcessId);
        Console.WriteLine("[DesktopRunner] Mantendo monitoramento ativo no desktop interativo...");

        WaitForSingleObject(pi.hProcess, INFINITE);

        Console.WriteLine("[DesktopRunner] Janela finalizada.");
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
    }
}
"@

Add-Type -TypeDefinition $code

$exe = "C:\aquila\node_modules\electron\dist\electron.exe"
$args = "C:\aquila\apps\electron"
$dir = "C:\aquila\apps\electron"

[SovereignDesktopRunner]::RunForever($exe, $args, $dir)
