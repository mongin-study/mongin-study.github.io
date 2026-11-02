import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  getFirestore,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  serverTimestamp,
  setDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* Public Firebase web config for the Nguyen family study app. */
var firebaseConfig = {
  apiKey: "AIzaSyA-jIFfD1WoIrgBAgA-4-5XhCtRl9UpVjE",
  authDomain: "mongin-study.firebaseapp.com",
  projectId: "mongin-study",
  storageBucket: "mongin-study.firebasestorage.app",
  messagingSenderId: "739534916916",
  appId: "1:739534916916:web:e72591aebeb1aba7856961"
};

var FAMILY = "nguyen";
var app = initializeApp(firebaseConfig);
var auth = getAuth(app);
var db = null;

try {
  db = initializeFirestore(app, { localCache: persistentLocalCache() });
} catch (e) {
  db = getFirestore(app);
}

var HV = globalThis.HV;
var latestEpoch = { mon: 0, gin: 0 };
var latestDays = { mon: null, gin: null };
var kidReady = { mon: false, gin: false };
var daysReady = { mon: false, gin: false };
var seenRemote = { mon: null, gin: null };
var resetting = { mon: false, gin: false };
var lastFp = { mon: "", gin: "" };
var weekTimer = { mon: 0, gin: 0 };
var authed = false;
var rewardsSeeded = false;

function setStatus(state, detail) {
  if (HV.ui && HV.ui.setSync) HV.ui.setSync({ state: state, detail: detail || "" });
}

function plainItem(item) {
  return {
    id: String(item.id || ""),
    title: String(item.title || ""),
    category: String(item.category || ""),
    subject: item.subject === "english" || item.subject === "vietnamese" ? item.subject : "math",
    level: Math.max(0, Math.min(4, Number(item.level) || 0)),
    correct: Number(item.correct) || 0,
    total: Number(item.total) || 0,
    stars: Math.max(0, Math.min(3, Number(item.stars) || 0)),
    at: Number(item.at) || 0,
    nonce: String(item.nonce || "")
  };
}

function itemKey(item) {
  if (item && item.nonce) return "n:" + item.nonce;
  return ["a", item.at || 0, item.id || "", item.correct || 0, item.total || 0, item.stars || 0].join("|");
}

function union(localItems, remoteItems) {
  var map = {};
  (localItems || []).forEach(function (item) { map[itemKey(item)] = plainItem(item); });
  var localOnly = [];
  var remoteKeys = {};
  (remoteItems || []).forEach(function (item) {
    var p = plainItem(item);
    var k = itemKey(p);
    remoteKeys[k] = true;
    map[k] = p;
  });
  Object.keys(map).forEach(function (k) {
    if (!remoteKeys[k]) localOnly.push(map[k]);
  });
  var list = Object.keys(map).map(function (k) { return map[k]; });
  list.sort(function (a, b) { return (a.at || 0) - (b.at || 0); });
  return { list: list, localOnly: localOnly };
}

function kidRef(child) {
  return doc(db, "families", FAMILY, "kids", child);
}
function dayRef(child, date) {
  return doc(db, "families", FAMILY, "kids", child, "days", date);
}
function daysRef(child) {
  return collection(db, "families", FAMILY, "kids", child, "days");
}
function weeksRef(child) {
  return collection(db, "families", FAMILY, "kids", child, "weeks");
}
function weekRef(child, weekStart) {
  return doc(db, "families", FAMILY, "kids", child, "weeks", weekStart);
}
function rewardsRef() {
  return doc(db, "families", FAMILY, "settings", "rewards");
}

function pushItems(child, date, items) {
  if (!db || !authed || !items || !items.length) return Promise.resolve();
  var chunks = [];
  for (var i = 0; i < items.length; i += 20) chunks.push(items.slice(i, i + 20).map(plainItem));
  var chain = Promise.resolve();
  chunks.forEach(function (slice) {
    chain = chain.then(function () {
      return setDoc(dayRef(child, date), {
        items: arrayUnion.apply(null, slice),
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
  });
  return chain.then(function () { scheduleWeek(child); }).catch(function () {
    setStatus("offline", "Sẽ đồng bộ khi có mạng");
  });
}

function scheduleWeek(child) {
  clearTimeout(weekTimer[child]);
  weekTimer[child] = setTimeout(function () { writeWeek(child); }, 350);
}

function writeWeek(child) {
  if (!db || !authed) return;
  var start = HV.util.weekStart(HV.util.todayStr());
  var weeks = {};
  Object.keys(HV.storage.data().kids[child].daily || {}).forEach(function (date) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) weeks[HV.util.weekStart(date)] = true;
  });
  weeks[start] = true;
  Object.keys(weeks).forEach(function (ws) {
    var summary = HV.storage.summarizeWeek(child, ws);
    setDoc(weekRef(child, ws), {
      weekStart: summary.weekStart,
      weekEnd: summary.weekEnd,
      stars: summary.stars,
      correct: summary.correct,
      answered: summary.answered,
      exercisesDone: summary.exercisesDone,
      updatedAt: serverTimestamp()
    }, { merge: true }).catch(function () {});
  });
}

function reconcile(child) {
  if (resetting[child] || !kidReady[child] || !daysReady[child]) return;
  var data = HV.storage.data();
  var kid = data.kids[child];
  if (!kid.daily) kid.daily = {};
  var remoteEpoch = latestEpoch[child] || 0;
  var localEpoch = Number(kid.resetEpoch) || 0;
  if (remoteEpoch > localEpoch) {
    kid.daily = {};
    kid.resetEpoch = remoteEpoch;
  }
  var remoteDays = latestDays[child] || {};
  var first = seenRemote[child] === null;
  var seen = seenRemote[child] || {};
  var toPush = [];
  Object.keys(remoteDays).forEach(function (date) {
    var merged = union(kid.daily[date] && kid.daily[date].items, remoteDays[date]);
    kid.daily[date] = { items: merged.list };
    if (merged.localOnly.length) toPush.push({ date: date, items: merged.localOnly });
  });
  Object.keys(kid.daily).slice().forEach(function (date) {
    if (remoteDays[date]) return;
    if (!first && seen[date]) delete kid.daily[date];
    else if ((kid.daily[date].items || []).length) toPush.push({ date: date, items: kid.daily[date].items });
  });
  var nextSeen = {};
  Object.keys(remoteDays).forEach(function (date) { nextSeen[date] = true; });
  seenRemote[child] = nextSeen;
  var fp = JSON.stringify(kid.daily);
  var changed = fp !== lastFp[child];
  lastFp[child] = fp;
  if (changed) HV.storage.save();
  toPush.forEach(function (entry) { pushItems(child, entry.date, entry.items); });
  if (changed && HV.ui && HV.ui.notify) HV.ui.notify();
  if (changed || toPush.length) scheduleWeek(child);
}

function listenChild(child) {
  onSnapshot(kidRef(child), function (snap) {
    latestEpoch[child] = snap.exists() ? (Number(snap.data().resetEpoch) || 0) : 0;
    kidReady[child] = true;
    reconcile(child);
  }, function () {
    setStatus("error", "Chưa đọc được sổ sao");
  });
  onSnapshot(daysRef(child), function (snap) {
    if (resetting[child]) return;
    var days = {};
    snap.forEach(function (docSnap) {
      var data = docSnap.data() || {};
      days[docSnap.id] = Array.isArray(data.items) ? data.items : [];
    });
    latestDays[child] = days;
    daysReady[child] = true;
    reconcile(child);
  }, function () {
    setStatus("error", "Chưa đọc được nhật ký sao");
  });
}

function listenRewards() {
  onSnapshot(rewardsRef(), function (snap) {
    var local = HV.storage.data().settings.targets;
    if (!snap.exists()) {
      if (!rewardsSeeded) {
        rewardsSeeded = true;
        setDoc(rewardsRef(), {
          mon: local.mon,
          gin: local.gin,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(function () {});
      }
      return;
    }
    var remote = snap.data() || {};
    if (!HV.storage.validTargets(remote.mon) || !HV.storage.validTargets(remote.gin)) return;
    var same = JSON.stringify(remote.mon) === JSON.stringify(local.mon) && JSON.stringify(remote.gin) === JSON.stringify(local.gin);
    if (same) return;
    HV.storage.data().settings.targets.mon = remote.mon.map(Number);
    HV.storage.data().settings.targets.gin = remote.gin.map(Number);
    HV.storage.save();
    if (HV.ui && HV.ui.notify) HV.ui.notify();
  }, function () {
    setStatus("error", "Chưa đọc được mốc thưởng");
  });
}

function pushRewards() {
  if (!db || !authed) return;
  var t = HV.storage.data().settings.targets;
  setDoc(rewardsRef(), {
    mon: t.mon,
    gin: t.gin,
    updatedAt: serverTimestamp()
  }, { merge: true }).catch(function () {
    setStatus("offline", "Mốc thưởng sẽ đồng bộ khi có mạng");
  });
}

async function deleteCollection(colRef) {
  var snap = await getDocs(colRef);
  var docs = snap.docs;
  for (var i = 0; i < docs.length; i += 400) {
    var batch = writeBatch(db);
    docs.slice(i, i + 400).forEach(function (d) { batch.delete(d.ref); });
    await batch.commit();
  }
}

function cloudReset(child, epoch) {
  resetting[child] = true;
  latestDays[child] = {};
  lastFp[child] = "";
  return setDoc(kidRef(child), { resetEpoch: epoch }, { merge: true })
    .then(function () { return deleteCollection(daysRef(child)); })
    .then(function () { return deleteCollection(weeksRef(child)); })
    .then(function () {
      latestEpoch[child] = epoch;
      latestDays[child] = {};
      seenRemote[child] = {};
      resetting[child] = false;
      daysReady[child] = true;
      reconcile(child);
    })
    .catch(function () {
      resetting[child] = false;
      setStatus("error", "Chưa xóa được sổ sao trên mạng");
    });
}

function hookStorage() {
  var origRecord = HV.storage.recordRound;
  HV.storage.recordRound = function (child, round) {
    var result = origRecord(child, round);
    if (result && authed) {
      var items = HV.storage.data().kids[child].daily[result.date].items;
      var last = items[items.length - 1];
      pushItems(child, result.date, [last]);
    }
    return result;
  };
  var origTargets = HV.storage.setTargets;
  HV.storage.setTargets = function (child, arr) {
    var result = origTargets(child, arr);
    if (result.ok) pushRewards();
    return result;
  };
  var origReset = HV.storage.resetChild;
  HV.storage.resetChild = function (child) {
    origReset(child);
    var epoch = (Number(HV.storage.data().kids[child].resetEpoch) || 0) + 1;
    HV.storage.data().kids[child].resetEpoch = epoch;
    HV.storage.save();
    if (authed) cloudReset(child, epoch);
  };
  var origImport = HV.storage.importPayload;
  HV.storage.importPayload = function (obj) {
    origImport(obj);
    if (!authed) return;
    ["mon", "gin"].forEach(function (child) {
      var daily = HV.storage.data().kids[child].daily || {};
      Object.keys(daily).forEach(function (date) {
        pushItems(child, date, daily[date].items || []);
      });
    });
    pushRewards();
  };
}

function startListeners() {
  if (!authed) {
    authed = true;
    setStatus("online", "Đã đồng bộ");
    listenChild("mon");
    listenChild("gin");
    listenRewards();
    window.addEventListener("online", function () { setStatus("online", "Đã đồng bộ"); });
    window.addEventListener("offline", function () { setStatus("offline", "Ngoại tuyến, sẽ đồng bộ sau"); });
  }
}

hookStorage();
setStatus("connecting", "Đang nối sổ sao");

onAuthStateChanged(auth, function (user) {
  if (user) startListeners();
});

signInAnonymously(auth).catch(function () {
  setStatus("error", "Chưa vào được sổ sao mạng. Máy này vẫn lưu tạm.");
});
