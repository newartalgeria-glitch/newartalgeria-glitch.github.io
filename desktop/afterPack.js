// Sets the icon and the Windows "Details" properties (name, publisher) on the .exe without needing Wine.
const fs = require('fs')
const path = require('path')

exports.default = async function (context) {
  const ResEdit = await import('resedit')
  const R = ResEdit.default || ResEdit
  const exeName = context.packager.appInfo.productFilename + '.exe'
  const exe = path.join(context.appOutDir, exeName)
  const data = fs.readFileSync(exe)
  const pe = R.NtExecutable.from(data)
  const res = R.NtExecutableResource.from(pe)
  const ico = R.Data.IconFile.from(fs.readFileSync(path.join(context.packager.projectDir, 'icon.ico')))
  R.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries, 1, 1033, ico.icons.map((i) => i.data))
  const vi = R.Resource.VersionInfo.fromEntries(res.entries)[0]
  const ver = context.packager.appInfo.version.split('.').map(Number)
  vi.setFileVersion(ver[0] || 1, ver[1] || 0, ver[2] || 0, 0, 1033)
  vi.setProductVersion(ver[0] || 1, ver[1] || 0, ver[2] || 0, 0, 1033)
  vi.setStringValues({ lang: 1033, codepage: 1200 }, {
    CompanyName: 'Nadir',
    FileDescription: context.packager.appInfo.productName + ' - Nadir',
    ProductName: context.packager.appInfo.productName,
    LegalCopyright: 'Copyright © 2026 Nadir',
    OriginalFilename: exeName,
    InternalName: context.packager.appInfo.productName,
  })
  vi.outputToResourceEntries(res.entries)
  res.outputResource(pe)
  fs.writeFileSync(exe, Buffer.from(pe.generate()))
}
