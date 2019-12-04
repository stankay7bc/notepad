const apiUrl = "https://api.github.com/gists";

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
      update.onsuccess = () => {
        localStorage.setItem("synced",false);
      };
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
 * @param {String} url 
 * @param {Gist} data 
 */
function updateGist(db,url,data) {
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
 * 
 * @param {String} url 
 * @param {Object -> Void} callback 
 */
function getGist(url,callback) {
  fetch(url, {
    method: 'GET',
  }).then(response=>{ 
    return response.json();
  }).then(json=>{
    callback(json.files);
  }).catch((error)=>{
    console.log(error);
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
    localStorage.setItem("synced",true);
    window.location.reload();
  };
}