// Builds the Windows installer from Linux/macOS/Windows without Wine.
// (electron-builder normally runs a stub installer under Wine to obtain the uninstaller; here the uninstaller is read directly from the stub instead.)
const mv = require('app-builder-lib/out/util/macosVersion')
mv.isMacOsCatalina = () => true
process.argv = [process.argv[0], 'electron-builder', '--win', 'nsis', '--x64', '--publish', 'never']
require('electron-builder/out/cli/cli.js')
