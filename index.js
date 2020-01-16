const fs = require("fs");
const path = require("path");

const l10n = require("l10n");
const input = require("input");
const ui = require("ui");
const quicklook = require("quicklook");
const clipboard = require("clipboard");
const detector = require("detector");

const git = require("isomorphic-git");

const shared = $jsbox.path.shared;

const dir = path.join(shared, ".tmp");


if (fs.existsSync(dir)) {
  fs.rmdirSync(dir, recursive=true);
}
fs.mkdirSync(dir);



async function gitclone(url) {
  await git.clone({
    fs,
    dir: dir,
    url: url,
    singleBranch: true,
    depth: 10
  });
}

function install(name) {
  $jsbox.run(`
const name = "${name}"
const path = "shared://.tmp"
const zipPath = path + ".zip"
await $archiver.zip({
  directory: path,
  dest: zipPath
})
$addin.save({
  name: name,
  data: $file.read(zipPath)
})
$file.delete(path)
$file.delete(zipPath)
console.log("${l10n("FINISHED")}")
  `)
}

function getRepoName(url) {
  const patt = /^https:\/\/github.com\/[^/]+\/([^/]+)$/
  const found = patt.exec(url)
  if (!found) {
      return
  } else {
    let name = found[1]
    if (name.lastIndexOf(".git") === name.length - 4) {
        name = name.slice(0, -4)
    }
    return name
  }
}


async function prompt() {
  const text = await input.text({
    placeholder: l10n("ENTER_URL"),
    text: detector.link(clipboard.text())
  });

  if (text == undefined) {
    return;
  }

  const link = detector.link(text);
  const name = getRepoName(link);
  if (link && name) {
    gitclone(link).then(()=>install(name));
  } else {
    console.error(l10n("CANNOT_FIND_URL"));
    setTimeout(prompt, 500);
  }
}

prompt()
