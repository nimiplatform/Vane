// Runs shipped dependencies with the shipped Electron Node ABI. This is not App acceptance.
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const { spawnSync } = require('node:child_process');

if (process.argv[2] !== '--packaged') {
  const mac = process.platform === 'darwin' && process.arch === 'arm64';
  assert.ok(mac || (process.platform === 'win32' && process.arch === 'x64'));
  const root = path.resolve(
    __dirname,
    '..',
    'dist-electron-package',
    mac
      ? 'vane-shell-darwin-arm64/vane-shell.app/Contents'
      : 'vane-shell-win32-x64',
  );
  const executable = path.join(
    root,
    mac ? 'MacOS/vane-shell' : 'vane-shell.exe',
  );
  const resources = path.join(root, mac ? 'Resources' : 'resources');
  const result = spawnSync(executable, [__filename, '--packaged', resources], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: 'inherit',
    timeout: 120000,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    0,
    `Packaged dependency check failed: ${result.signal || result.status}`,
  );
} else {
  checkPackagedDependencies().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

async function checkPackagedDependencies() {
  assert.ok(process.versions.electron, 'Must run with packaged Electron');
  const resources = process.argv[3];
  const fromApp = createRequire(
    path.join(resources, 'app.asar', 'package.json'),
  );
  const manifest = fromApp('./package.json');
  assert.equal(manifest.version, require('../package.json').version);
  const fromKit = createRequire(
    fromApp.resolve('@nimiplatform/kit/shell/electron/main'),
  );
  const native =
    process.platform === 'darwin'
      ? require(
          path.join(resources, 'nimi-native', 'protected-local', 'index.cjs'),
        )
      : fromKit('@nimiplatform/kit-protected-local-win32-x64');
  assert.equal(typeof native.localAppSessionStatus, 'function');
  const { createCanvas } = fromApp('@napi-rs/canvas');
  const canvas = createCanvas(16, 16);
  canvas.getContext('2d').fillRect(0, 0, 16, 16);
  assert.ok(canvas.toBuffer('image/png').length > 0);
  const { PDFParse } = fromApp('pdf-parse');
  const { CanvasFactory } = fromApp('pdf-parse/worker');
  const officeParser = fromApp('officeparser');
  const fromOffice = createRequire(fromApp.resolve('officeparser'));
  const { zipSync, strToU8 } = fromOffice('fflate');
  const phrase = 'Nimi parser release check';
  const docx = zipSync({
    '[Content_Types].xml': strToU8(
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    ),
    '_rels/.rels': strToU8(
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    ),
    'word/document.xml': strToU8(
      '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>' +
        phrase +
        '</w:t></w:r></w:p></w:body></w:document>',
    ),
  });
  assert.ok(
    (await officeParser.parseOffice(Buffer.from(docx)))
      .toText()
      .includes(phrase),
  );
  const stream = `BT /F1 18 Tf 50 700 Td (${phrase}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => String(offset).padStart(10, '0') + ' 00000 n ')
    .join(
      '\n',
    )}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const bytes = new Uint8Array(Buffer.from(pdf));
  const parser = new PDFParse({ data: bytes.slice(), CanvasFactory });
  try {
    assert.ok((await parser.getText()).text.includes(phrase));
  } finally {
    await parser.destroy();
  }
  // Vane routes PDF to PDFParse and DOCX to officeParser; preserve both in one Host.
  assert.ok(
    (await officeParser.parseOffice(Buffer.from(docx)))
      .toText()
      .includes(phrase),
  );

  console.log(
    `PASS: packaged Electron ${process.versions.electron} (${process.platform}/${process.arch}), protected native, canvas, DOCX/PDF/DOCX extraction`,
  );
}
