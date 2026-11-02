import fs from "fs";
import vm from "vm";

const context = {
  console,
  Math,
  Number,
  String,
  Array,
  Object,
  JSON,
  Date,
  isFinite,
  document: {
    createElement() { return { style: {}, setAttribute() {}, appendChild() {}, classList: { add() {}, remove() {} } }; },
    createTextNode(t) { return { text: t }; }
  }
};
context.globalThis = context;
vm.createContext(context);
for (const f of ["util.js", "generators.js", "catalog.js"]) {
  vm.runInContext(fs.readFileSync(new URL("../js/" + f, import.meta.url), "utf8"), context, { filename: f });
}
const HV = context.HV;
const lines = new Set();
function add(s) {
  if (s && String(s).trim()) lines.add(String(s).trim());
}

[
  "Đúng rồi!", "Giỏi quá!", "Chính xác!", "Tuyệt lắm!", "Tuyệt!",
  "Chưa đúng", "Thử lại nhé", "Chưa đúng, thử lại nhé",
  "Chưa đúng, mình xem đáp án nhé", "Chưa đủ, thêm nữa nhé",
  "Hơi nhiều rồi, bớt bớt nhé", "Chưa đúng, đếm lại nhé",
  "Chưa đúng thứ tự, thử lại nhé", "Đáp án được tô màu",
  "Thứ tự đúng đang hiện ở trên.", "Cần chọn đúng", "Cần đúng"
].forEach(add);

const daily = JSON.parse(fs.readFileSync(new URL("../content/daily/2026-11-02.json", import.meta.url), "utf8"));
(daily.exercises || []).forEach((ex) => {
  (ex.questions || []).forEach((q) => {
    add(q.speak);
    add(q.explain);
    add(q.prompt);
  });
});

for (const ex of HV.catalog) {
  const gen = HV.generators[ex.generator];
  if (!gen) continue;
  for (let i = 0; i < 30; i++) {
    let list = [];
    try { list = gen(ex.config || {}); } catch (e) { continue; }
    for (const q of list) {
      add(q.speak);
      add(q.explain);
      add(q.prompt);
    }
  }
}
// sequence daily config
for (let i = 0; i < 15; i++) {
  HV.generators.sequence({ count: 4, steps: [2, 5, 10], length: 4, max: 80, input: "choice" }).forEach((q) => {
    add(q.speak);
    add(q.explain);
  });
}

process.stdout.write(JSON.stringify([...lines], null, 2));
