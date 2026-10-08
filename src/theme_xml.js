// pptxgenjs не умеет записывать цвета темы: после writeFile() подставляем свою палитру
// в ppt/theme/theme1.xml, чтобы цвета темы в PowerPoint совпадали со слайдами.
const fs = require("fs");
const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));

const SLOTS = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function applyThemeColors(file, name, colors) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const part = "ppt/theme/theme1.xml";
  let xml = await zip.file(part).async("string");
  const scheme = `<a:clrScheme name="${esc(name)}">` +
    SLOTS.map((k) => `<a:${k}><a:srgbClr val="${colors[k]}"/></a:${k}>`).join("") +
    "</a:clrScheme>";
  xml = xml.replace(/<a:clrScheme[\s\S]*?<\/a:clrScheme>/, scheme)
    .replace(/(<a:theme\b[^>]*\bname=")[^"]*"/, `$1${esc(name)}"`);
  zip.file(part, xml);
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

module.exports = { applyThemeColors };
