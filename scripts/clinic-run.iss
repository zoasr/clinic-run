[Setup]
AppName=Clinic Run
AppVersion=0.1.0
AppPublisher=zoasr
AppPublisherURL=https://github.com/zoasr/clinic-run
AppSupportURL=https://github.com/zoasr/clinic-run/issues
AppUpdatesURL=https://github.com/zoasr/clinic-run/releases
DefaultDirName={autopf}\ClinicRun
DefaultGroupName=Clinic Run
AllowNoIcons=yes
OutputBaseFilename=ClinicRun-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
UninstallDisplayIcon={app}\clinic-run.exe

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop icon"; GroupDescription: "Additional icons:"
Name: "quicklaunchicon"; Description: "Create a &Quick Launch icon"; GroupDescription: "Additional icons:"; Flags: unchecked

[Files]
Source: "dist\clinic-run.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Clinic Run"; Filename: "{app}\clinic-run.exe"
Name: "{group}\Uninstall Clinic Run"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Clinic Run"; Filename: "{app}\clinic-run.exe"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\Clinic Run"; Filename: "{app}\clinic-run.exe"; Tasks: quicklaunchicon

[Run]
Filename: "{app}\clinic-run.exe"; Description: "Launch Clinic Run"; Flags: nowait postinstall skipifsilent

[Registry]
Root: HKLM; Subkey: "SOFTWARE\ClinicRun"; ValueType: string; ValueName: "InstallDir"; ValueData: "{app}"
Root: HKLM; Subkey: "SOFTWARE\ClinicRun"; ValueType: string; ValueName: "Version"; ValueData: "0.1.0"

[UninstallDelete]
Type: filesandordirs; Name: "{userappdata}\ClinicRun"
