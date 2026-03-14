

const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
const body = document.body;

if (localStorage.getItem('kelas_theme') === 'dark') {
    body.classList.add('dark-mode');
    if(themeIcon) themeIcon.className = 'bx bx-moon';
} else {
    if(themeIcon) themeIcon.className = 'bx bx-cloud';
}

if(themeToggleBtn){
themeToggleBtn.addEventListener('click', () => {

    body.classList.toggle('dark-mode');

    const isDarkMode = body.classList.contains('dark-mode');

    if (isDarkMode) {
        localStorage.setItem('kelas_theme', 'dark');
        if(themeIcon) themeIcon.className = 'bx bx-moon';
    } else {
        localStorage.setItem('kelas_theme', 'light');
        if(themeIcon) themeIcon.className = 'bx bx-cloud';
    }

});
}


/* =========================================
   LOGIN KE BACKEND
========================================= */

document.getElementById("loginForm").addEventListener("submit", async function(e){

e.preventDefault();

const btn = document.getElementById("loginBtn");
const btnText = document.getElementById("btnText");

btn.classList.add("loading");
btnText.innerText = "Memverifikasi...";

const nrp = document.getElementById("nrpInput").value;
const password = document.getElementById("passwordInput").value;

try{

fetch("/api/login",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
nrp:nrp,
password:password
})
});

const data = await res.json();

if(res.ok){

localStorage.setItem("token",data.token);
localStorage.setItem("user_name",data.name);
localStorage.setItem("user_role",data.role);
localStorage.setItem("user_nrp",data.nrp);

document.body.style.opacity="0";

setTimeout(()=>{
window.location.href="index.html";
},400);

}else{

btn.classList.remove("loading");
btnText.innerText="Masuk Portal";
alert(data.message);

}

}catch(err){

btn.classList.remove("loading");
btnText.innerText="Masuk Portal";
alert("Server tidak terhubung");

}

});
