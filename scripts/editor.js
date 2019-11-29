{
  document.querySelector("#goback").addEventListener("click",event=>{
    location.href=location.pathname.slice(0,-"editor.html".length); 
  });

  const container = document.querySelector("#anote");
  const heading = container.querySelector("h1");
  const parag = container.querySelector("p");

  let request = indexedDB.open("notes");

  request.onsuccess = function(event) {
    let db = event.target.result;
    if(location.search.slice(1).split("=")[0]==="note") {
      getNote(db,viewCallback);
    } else {
      viewCallback({timestamp:Date.now(),body:''});
    }
    let saveCallback = (viewCallback) => {
      let objStore = db.transaction([db.objectStoreNames[0]],"readwrite").objectStore(db.objectStoreNames[0]);
      if(location.search.slice(1).split("=")[0]==="note") {
        let request = objStore.get(Number(location.search.split("=")[1]));
        request.onsuccess = event => {
          let data = event.target.result;
          data.body = parag.innerText; 
          data.update = Date.now();
          let req = objStore.put(data);  
          req.onsuccess = function(event) {
            localStorage.setItem("synced",false);
            viewCallback();
            console.log("data updated");
          }
        }
      } else {
        let ts = Date.now();
        let note = {
          timestamp:ts,
          body:container.querySelector("p").textContent,
          update:ts
        };
        let request = objStore.add(note);
        request.onsuccess = event => {
          localStorage.setItem("synced",false);
          viewCallback();
          history.replaceState(null,null,`${location.pathname}?note=${note.timestamp}`);
        }
      }
    };
    SaveFSM(saveCallback);
  }

  function getNote(db,callback) {
    let objStore = db.transaction([db.objectStoreNames[0]]).objectStore(db.objectStoreNames[0]);
    let request = objStore.get(Number(location.search.split("=")[1]));
    request.onsuccess = function(event) {
      callback(event.target.result);
    }
  }

  function viewCallback(note) {
    heading.textContent = (new Date(note.timestamp)).toLocaleString();
    parag.innerText = note.body;
  }
  
  function SaveFSM(dbCallback) {

    let num=0;
    const THRESHOLD=5;
    let timeoutId;
    const viewIdent = document.querySelector("#dbstatus > span:nth-of-type(1)");
    
    let saved = true;
    
    function setView() {
      saved = saved ? false : true;
      if(saved) {
        viewIdent.setAttribute("class","vhidden");
      } else {
        viewIdent.removeAttribute("class");
      }
    }
    
    parag.addEventListener("keyup",event=>{
      
      if(timeoutId) window.clearTimeout(timeoutId);

      // !!! 
      if(event.location===0) {
        if(saved) { setView(); }
        num++;
      }

      if(num===THRESHOLD) { 
        if(dbCallback) {
          dbCallback(setView);
        }
        console.log("input threshold: saving data...")
        num=0; 
      } 

      timeoutId = window.setTimeout(()=>{
        if(num>0) {
          if(dbCallback) dbCallback(setView);
          console.log("inactive: saving data...")  
          num=0; 
        }
      },3000);
    })
  }
}