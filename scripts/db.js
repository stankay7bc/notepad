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

(function() {
 

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
        console.log(json.files);
        let noteObjStore = db.transaction(ts,"readwrite").objectStore(ts);
        for (val in json.files) {
          var request = noteObjStore.add(
            JSON.parse(json.files[val].content));
          request.onsuccess = event => {
            console.log("data downloaded...");
            getNotes(db,initView);
          }
        }
      });
    }
  }

  request.onsuccess = function(event) {
    let db = event.target.result;
    getNotes(db,initView);
    //getNotes(db,prepUpdate);
  }
})();

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

function getNotes(db,callback) {

  const notesRecords = [];  
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
      callback(notesRecords);
    }
  }
  /*objectStore.openCursor().onsuccess = cursorCallback*/
  index.openCursor(undefined,"prev").onsuccess = cursorCallback;
}

/**
* Array<Note> -> GistObj 
*/
function prepUpdate(notes) {
  let result = notes.reduce((obj,note)=>{
    let filename = `${note.timestamp}.json`; 
    obj.files[filename] = {
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
 * GistObj -> Void
 */
function updateGist(data) {
  fetch(url, {
      method: 'PATCH', // or 'PUT'
      body: JSON.stringify(data), // data can be `string` or {object}!
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization':`Basic ${btoa(`stankay7bc:${token}`)}`
      })
  }).then(function(response) {
      return response.json();
  }).then(function(response){
      console.log(response);
  });
}

function syncToCloud() {
  var request = indexedDB.open("notes");
  request.onsuccess = function(event) {
    let db = event.target.result;
    getNotes(db,(notes)=>{
      updateGist(prepUpdate(notes));
    });
  };
}