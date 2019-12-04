(function() {
 
  if(localStorage.getItem("token")===null || 
     localStorage.getItem("gist")===null) {

    location.href += 'config.html';

  } else {

    const url = `${apiUrl}/${localStorage.getItem("gist")}`;

    var request = indexedDB.open("notes");

    request.onupgradeneeded = function(event) {

      let ts = Date.now();
      let db = event.target.result;
      let objStore = db.createObjectStore(ts, { keyPath: "timestamp" });
      objStore.createIndex("update","update",{ unique: true })
      objStore.transaction.oncomplete =  function(event) {
        getGist(url,(data)=>{
          populateDB(db,data);
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
                getGist(url,(gist)=>{
                  let update = notes.reduce((obj,note)=>{ // move to prep update
                    let filename = `${note.timestamp}.json`;
                    if(!gist.hasOwnProperty(filename) ||
                      note.update>JSON.parse(gist[filename].content).update) {
                      obj.files[filename] = (note.body===null) ? null : {
                        content: JSON.stringify(note),
                        filename: filename,
                      }
                    }
                    return obj;
                  },{
                    description: "My Notes",
                    files:{},
                  });
                  //console.log(update);
                  updateGist(db,url,update);
                });
            });
          }
        })(db));
    }
  }
})();