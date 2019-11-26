/** 
* DATA 
const NB1 = {
  body:"My Notes",
  children: [
    {body:"my first note"},
    {body:"my second note"},
  ]
};
*/

/**
* FUNCTIONS
*/

/**
* Array<Note> -> String
*/
function createListView(records) {
  return `<header><h1>My Notes</h1></header>
${records.reduce(processChild,"")}`;
}

function processChild(result,note,index) {
  return result+
//<div class="panel"><span onclick="deleteNote(${Number(note.timestamp)})">x</span></div>
`<article noteId="${Number(note.timestamp)}">
<header><h1>${(new Date(note.timestamp)).toLocaleString()}</h1></header>
<p onclick="changeLocation(${note.timestamp})">${makePreview(note.body)}</p>
<div class="panel"><span>x</span></div>
</article>`;
}

function changeLocation(noteId) {
  location.href += `editor.html?note=${noteId}`;
}

function deleteNote(ts) {
  if(window.confirm("Delete note?")) {
    deleteVal(ts,()=>{location.reload();});
  }
}

function navigateToNewNote() {
  location.href += 'editor.html';
}

/**
* String -> String
* create a shortened version of a note's body
*/
function makePreview(anote) {
  let NOTE_SIZE_THRESHOLD = 50;
  if(anote.length > NOTE_SIZE_THRESHOLD) {
    return anote.slice(0,NOTE_SIZE_THRESHOLD);
  } else {
    return anote;
  }
}

/**
* TEST
*/

const main = document.querySelector("main");
/**
* Array<Note> -> Void
*/
function initView(records,delCallback) {
  main.innerHTML = createListView(records.filter(note => note.body!=null));
  if(delCallback) {
    document.querySelector("main")
      .addEventListener("click",function (event){
        if(event.target.tagName==="SPAN") {
          //console.log(event.target);
          delCallback(
            Number(event.target
              .parentElement
                .parentElement.getAttribute("noteid")));
        }
      });
  }
}


