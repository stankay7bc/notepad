(function() {
 
  if(localStorage.getItem("token")===null) {

    location.href += 'config.html';

  } else {

    var request = indexedDB.open("notes");

    request.onupgradeneeded = function(event) {

      let ts = Date.now();
      let db = event.target.result;
      let objStore = db.createObjectStore(ts, { keyPath: "timestamp" });
      objStore.createIndex("update","update",{ unique: true })
      objStore.transaction.oncomplete =  function(event) {
        
        fetch(url, {
              method: 'GET',
        }).then(response=>{ 
          return response.json();
        }).then(json=>{
          populateDB(db,json.files);
        }).catch((error)=>{
          console.log(error);
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
  }
})();