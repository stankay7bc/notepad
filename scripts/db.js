var ts = Date.now();

const NOTES = [
  {
    timestamp:ts+1,
    body:"My note 1",
    update:ts+1
  },
  {
    timestamp:ts+2,
    body:"My note 2",
    update:ts+2
  },
];

var request = indexedDB.open("notes");
request.onsuccess = function(event) {
  let db = event.target.result;
  getNotes(db,initView);
}

request.onupgradeneeded = function(event) {
  let db = event.target.result;
  let objStore = db.createObjectStore(ts, { keyPath: "timestamp" });
  objStore.createIndex("update","update",{ unique: true })
  objStore.transaction.oncomplete = function(event) {
    let noteObjStore = db.transaction(ts,"readwrite").objectStore(ts);
    NOTES.forEach(note=>{
      var request = noteObjStore.add(note);
    }); 
  }
}

function deleteVal(ts,callback) {
  var request = indexedDB.open("notes");
  request.onsuccess = event => {
    let db = event.target.result;
    var requestDel = db.transaction(db.objectStoreNames[0],"readwrite")
      .objectStore(db.objectStoreNames[0])
      .delete(ts);
    requestDel.onsuccess = event => {
      console.log(`note ${ts} deleted`);
      callback();
    };
  }
}

const notesRecords = [];

function getNotes(db,callback) {
  var objectStore = db.transaction(db.objectStoreNames[0]).objectStore(db.objectStoreNames[0]);
  let index = objectStore.index("update");
  //!!!
  let cursorCallback = event => {
    var cursor = event.target.result;
    if (cursor) {
      //console.log(cursor.key,cursor.value);
      notesRecords.push(cursor.value);
      cursor.continue();
    }
    else {
      console.log("No more entries!");
      callback();
    }
  }
  /*objectStore.openCursor().onsuccess = cursorCallback*/
  index.openCursor(undefined,"prev").onsuccess = cursorCallback;
}