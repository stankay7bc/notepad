var ts = Date.now();

const NOTES = [ // Array<Note>
  {
    timestamp:ts+1,
    body:"My local note 1", // <- a Note 
    update:ts+1
  },
  {
    timestamp:ts+2,
    body:"My local note 2",
    update:ts+2
  },
];

const apiUrl = "https://api.github.com/gists";
const id = "5a805f4cee576a9b0e3827153cf651d0";
const url = `${apiUrl}/${id}`;

/**
 * @param {timestamp} ts 
 */
function deleteVal(ts) {
    let db = this;
    let transaction = db.transaction(db.objectStoreNames[0],"readwrite");
    let objectStore = transaction.objectStore(db.objectStoreNames[0]);
    let request = objectStore.get(ts);
    request.onsuccess = event => {
      let data = event.target.result;
      data.body = null;
      data.update = Date.now();
      let update = objectStore.put(data);
      update.onsuccess = () => {};
    };
    transaction.oncomplete = () => {
      window.location.reload();
    };
}

/**
 * @param {IDBDatabase} db 
 * @param {Array<Note> -> Void} callback 
 */
function getNotes(db,callback) {

  const notesRecords = [];  
  let transaction = db.transaction(db.objectStoreNames[0]);
  let objectStore = transaction.objectStore(db.objectStoreNames[0]);
  let index = objectStore.index("update");

  let cursorCallback = event => {
    let cursor = event.target.result;
    if (cursor) {
      notesRecords.push(cursor.value);
      cursor.continue();
    } else {
      console.log("No more entries!");
    }
  }

  transaction.oncomplete = () => {
    callback(notesRecords);
  };

  index.openCursor(undefined,"prev").onsuccess = cursorCallback;
}

/**
 * @param {Array<Note>} notes 
 * @returns Gist
 */
function prepUpdate(notes) {
  let result = notes.reduce((obj,note)=>{
    let filename = `${note.timestamp}.json`; 
    obj.files[filename] = (note.body===null) ? null : {
      content: JSON.stringify(note),
      filename: filename,
    };
    return obj;
  },{
    description: "My Notes",
    files:{},
  });
  //console.log(result);
  return result;
}

/**
 * @param {IDBDatabase} db 
 * @param {Gist} data 
 */
function updateGist(db,data) {
  fetch(url, {
      method: 'PATCH', 
      body: JSON.stringify(data), 
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization':`Basic ${btoa(`stankay7bc:${localStorage.getItem("token")}`)}`
      })
  }).then(function(response) {
      return response.json();
  }).then(function(json){
      //console.log(json);
      populateDB(db,json.files);
  });
}

/**
 * @param {IDBDatabase} db 
 * @param {Object} records 
 */
function populateDB(db,records) {
  let transaction = db.transaction(db.objectStoreNames[0],"readwrite"); 
  let noteObjStore = transaction.objectStore(db.objectStoreNames[0]);
  let request = noteObjStore.clear();
  request.onsuccess = () => {
    for (val in records) {
      var request = noteObjStore.add(
        JSON.parse(records[val].content));
    }
  }
  transaction.oncomplete = (event) => {
    window.location.reload();
  };
}

(function() {
 
  if(localStorage.getItem("token")===null) {
    location.href += 'config.html';
  }

  var request = indexedDB.open("notes");

  request.onupgradeneeded = function(event) {

    let db = event.target.result;
    let objStore = db.createObjectStore(ts, { keyPath: "timestamp" });
    objStore.createIndex("update","update",{ unique: true })
    objStore.transaction.oncomplete =  function(event) {
      
      /*NOTES.forEach(function(note) {
        var request = noteObjStore.add(note);
      }); */

      fetch(url, {
            method: 'GET',
      }).then(response=>{ 
        return response.json();
      }).then(json=>{
        populateDB(db,json.files);
      });
    }
  }

  request.onsuccess = function(event) {
    let db = event.target.result;
    getNotes(db,(records)=>{
      initView(records,deleteVal.bind(db));
    });

    document.body.querySelector("#bar button")
      .addEventListener("click",((db)=>{
        return () => {
            getNotes(db,(notes)=>{
            updateGist(db,prepUpdate(notes));
          });
        }
      })(db));
  }
})();