# Desktop edition (Windows, offline)

Electron wrapper that runs the built web app (`dist/`) from local files, with an NSIS installer that asks for an
installation code, creates a desktop shortcut and carries the name "Nadir".

Build (any OS, no Wine needed):

    cd desktop
    npm install
    (cd .. && npx vite build)        # builds ../dist
    rm -rf web && cp -r ../dist web  # then remove robots.txt/sitemap.xml, empty ads-config.js
    node build-win.cjs               # -> release/*-Setup.exe

The installation code is NOT stored in the repository: `installer.nsh` only holds a derived number.
Note: installer.nsh (contains the derived code number) is git-ignored; generate it with gen_desktop.py.
