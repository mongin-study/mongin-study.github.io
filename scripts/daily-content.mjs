#!/usr/bin/env node
// Keep each day's English "Tap what you hear" wired to the listen bank.
// Existing questions stay first; the generator fills the rest of the session.
//
//   node scripts/daily-content.mjs 2026-11-05
import fs from "fs";

const date = process.argv[2] || new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error("Use YYYY-MM-DD");
  process.exit(1);
}
const path = new URL("../content/daily/" + date + ".json", import.meta.url);
let doc = { date: date, exercises: [] };
if (fs.existsSync(path)) doc = JSON.parse(fs.readFileSync(path, "utf8"));
if (!Array.isArray(doc.exercises)) doc.exercises = [];

function upsert(child) {
  let ex = doc.exercises.find(function (item) {
    return item.child === child && item.subject === "english" && item.category === "listen";
  });
  if (!ex) {
    ex = {
      id: "daily-" + date + "-" + child + "-en-listen",
      child: child,
      subject: "english",
      category: "listen",
      title: "Tap what you hear",
      subtitle: child === "gin" ? "Colors, animals, heroes" : "a red apple",
      icon: "🎧",
      questions: []
    };
    if (child === "mon") ex.level = 1;
    doc.exercises.push(ex);
  }
  ex.generator = "enListen";
  ex.config = {
    set: child === "mon" ? "mon" : "gin",
    count: child === "gin" ? 16 : 18,
    seed: date,
    choices: child === "mon" ? 4 : 3,
    gradual: child !== "mon"
  };
}

upsert("gin");
upsert("mon");
fs.writeFileSync(path, JSON.stringify(doc, null, 2) + "\n");
console.log("updated", date, "listen exercises", doc.exercises.filter(function (ex) {
  return ex.category === "listen" && ex.subject === "english";
}).map(function (ex) { return ex.id; }).join(", "));
