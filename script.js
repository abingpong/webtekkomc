// ==========================================
// 1. INISIALISASI FIREBASE CLOUD FIRESTORE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// ===============================
// CEK TOKEN LOGIN
// ===============================

const token = localStorage.getItem("token");

if(!token){
    window.location.replace("login.html");
}
// VERIFIKASI TOKEN KE BACKEND
fetch("http://localhost:5000/verify",{
method:"GET",
headers:{
"Authorization":"Bearer "+token
}
})
.then(res=>{
if(!res.ok){
localStorage.clear();
window.location.replace("login.html");
}
})
.catch(()=>{
localStorage.clear();
window.location.replace("login.html");
});

const userRole = localStorage.getItem("user_role");
const userName = localStorage.getItem("user_name") || "Mahasiswa";
const userNRP = localStorage.getItem("user_nrp") || "";

document.addEventListener("DOMContentLoaded",()=>{
document.body.classList.add("page-enter");
});

const firebaseConfig = {
  apiKey: "AIzaSyCi-GxzTWwJW7OonGUHO-AQsZ-uccE4iYw",
  authDomain: "tekkom-c.firebaseapp.com",
  projectId: "tekkom-c",
  storageBucket: "tekkom-c.firebasestorage.app",
  messagingSenderId: "812943944024",
  appId: "1:812943944024:web:5a4ce35160854dd3941d2d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const portalDocRef = doc(db, "portal_kelas", "1_tkc_str_v3");

// ==========================================
// 2. VARIABEL PENYIMPANAN DATA (STATE)
// ==========================================
let moduleDatabase = {};
let feedbackDatabase = [];
let taskDatabase = {};
let kasHistory = [];
let calendarEvents = [];
let activityLogs = [];
let dataKas = {};
let kasHeaders = [];
let dataKasMingguan = [];
let currentActiveCourse = ''; 

let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

const courseMeta = {
    'Agama': { info: '2 SKS • Semester Genap 2026', pj: 'Bpk. Imamul Arifin', jadwal: 'Senin, 11:20 - 13:10 WIB (Ruang SAW-04.08)', kodePJ: 'pj-agama' },
    'Pemrograman Dasar 2': { info: '3 SKS • Semester Genap 2026', pj: 'Bpk. Sigit Wasista', jadwal: 'Selasa, 12:30 - 13:50 WIB (Ruang B 303)', kodePJ: 'pj-pemdas' },
    'Prakt. Pemrograman Dasar 2': { info: '3 SKS • Semester Genap 2026', pj: 'Bpk. Sigit Wasista', jadwal: 'Senin, 13:10 - 14:30 WIB (Ruang HI-204)', kodePJ: 'pj-prakpemdas' },
    'Matematika-2': { info: '2 SKS • Semester Genap 2026', pj: 'Bpk. Tri Harsono', jadwal: 'Selasa, 10:00 - 11:20 WIB (Ruang B 203)', kodePJ: 'pj-matdas2' },
    'Rangkaian Elektronika 2': { info: '2 SKS • Semester Genap 2026', pj: 'Bpk. Bayu Sandi Marta', jadwal: 'Selasa, 08:00 - 09:20 WIB (Ruang B 304)', kodePJ: 'pj-re2' },
    'Prakt. Rangkaian Elektronika 2': { info: '2 SKS • Semester Genap 2026', pj: 'Bpk. Fernando Ardilla', jadwal: 'Rabu, 10:40 - 12:00 WIB (Ruang HI-303)', kodePJ: 'pj-prakre2' },
    'Rangkaian Logika 2': { info: '2 SKS • Semester Genap 2026', pj: 'Bpk. Fernando Ardilla', jadwal: 'Rabu, 08:40 - 10:00 WIB (Ruang SAW-04.08)', kodePJ: 'pj-rl2' },
    'Prakt. Rangkaian Logika 2': { info: '2 SKS • Semester Genap 2026', pj: 'Bpk. Fernando Ardilla', jadwal: 'Kamis, 08:00 - 09:20 WIB (Ruang HI-304)', kodePJ: 'pj-prakrl2' },
    'Workshop Basis Data': { info: '3 SKS • Semester Genap 2026', pj: 'Bpk. Dwi Kurnia Basuki', jadwal: 'Kamis, 09:20 - 11:20 WIB (Ruang HI-202)', kodePJ: 'pj-basdat' },
    'Workshop Instrumentasi & Telemetri': { info: '2 SKS • Semester Genap 2026', pj: 'Ibu Dewi Mutiara Sari', jadwal: 'Kamis, 12:30 - 14:30 WIB (Ruang HI-304)', kodePJ: 'pj-instrumen' }
};

// ==========================================
// 3. SINKRONISASI CLOUD & AUTO-BILLING
// ==========================================
onSnapshot(portalDocRef, async (docSnap) => {
    if (docSnap.exists()) {
        const cloudData = docSnap.data();
        moduleDatabase = cloudData.modules || {};
        taskDatabase = cloudData.tasks || {}; // <--- SINKRONISASI TUGAS
        calendarEvents = cloudData.events || [];

        moduleDatabase = cloudData.modules || {};
        taskDatabase = cloudData.tasks || {}; 
        calendarEvents = cloudData.events || [];
        
        // ========================================================
        // MESIN OTOMATIS: SUNTIK LIBUR NASIONAL 2026 KE DATABASE
        // ========================================================
        if (!cloudData.libur_tersinkron) {
            const liburNasional2026 = [
                { date: "2026-01-01", title: "Tahun Baru Masehi", type: "wajib" },
                { date: "2026-01-16", title: "Isra Mikraj", type: "wajib" },
                { date: "2026-02-16", title: "Cuti Bersama Imlek", type: "opsional" },
                { date: "2026-02-17", title: "Tahun Baru Imlek", type: "wajib" },
                { date: "2026-03-18", title: "Cuti Bersama Nyepi", type: "opsional" },
                { date: "2026-03-19", title: "Hari Suci Nyepi", type: "wajib" },
                { date: "2026-03-20", title: "Cuti Bersama Lebaran", type: "opsional" },
                { date: "2026-03-21", title: "Idul Fitri", type: "wajib" },
                { date: "2026-03-22", title: "Idul Fitri", type: "wajib" },
                { date: "2026-03-23", title: "Cuti Bersama Lebaran", type: "opsional" },
                { date: "2026-03-24", title: "Cuti Bersama Lebaran", type: "opsional" },
                { date: "2026-04-03", title: "Wafat Yesus Kristus", type: "wajib" },
                { date: "2026-04-05", title: "Paskah", type: "wajib" },
                { date: "2026-05-01", title: "Hari Buruh", type: "wajib" },
                { date: "2026-05-14", title: "Kenaikan Yesus", type: "wajib" },
                { date: "2026-05-15", title: "Cuti Bersama Kenaikan", type: "opsional" },
                { date: "2026-05-27", title: "Idul Adha", type: "wajib" },
                { date: "2026-05-28", title: "Cuti Bersama Idul Adha", type: "opsional" },
                { date: "2026-05-31", title: "Hari Raya Waisak", type: "wajib" },
                { date: "2026-06-01", title: "Hari Lahir Pancasila", type: "wajib" },
                { date: "2026-06-16", title: "Tahun Baru Islam", type: "wajib" },
                { date: "2026-08-17", title: "HUT RI ke-81", type: "wajib" },
                { date: "2026-08-25", title: "Maulid Nabi", type: "wajib" },
                { date: "2026-12-24", title: "Cuti Bersama Natal", type: "opsional" },
                { date: "2026-12-25", title: "Hari Raya Natal", type: "wajib" }
            ];
            
            // Masukkan semua libur ke dalam jadwal
            calendarEvents.push(...liburNasional2026);
            
            // Simpan ke database dan beri gembok 'libur_tersinkron' agar tidak dobel
            updateDoc(portalDocRef, { events: calendarEvents, libur_tersinkron: true });
            
            // Hentikan fungsi sejenak agar browser memuat ulang dari database baru
            return; 
        }
        // ========================================================

        activityLogs = cloudData.logs || [];
        activityLogs = cloudData.logs || [];
        dataKas = cloudData.kas_summary || {};
        kasHeaders = cloudData.kas_headers || [];
        dataKasMingguan = cloudData.kas_students || [];
        feedbackDatabase = cloudData.feedbacks || [];
        if (typeof renderFeedbacks === 'function') renderFeedbacks();
        // TAMBAHKAN BLOK INI UNTUK RIWAYAT KAS
        kasHistory = cloudData.kas_history;
        if (!kasHistory) {
            // Jika database kosong, masukkan data lama (dummy) agar tidak hilang
            kasHistory = [
                { title: "Photobooth (Meiko & Nadira)", desc: "Desember 2025 • Ada Nota", amount: 65000, icon: "bx-camera" },
                { title: "Sampul Abu-abu (Zaka)", desc: "Oktober 2025 • Ada Nota", amount: 36000, icon: "bx-book-bookmark" },
                { title: "Kabel Jumper, Kertas & Cover", desc: "September 2025 • Rizal, Bima, dll", amount: 37000, icon: "bx-plug" }
            ];
            updateDoc(portalDocRef, { kas_history: kasHistory });
        }

        const baseDate = new Date(2026, 1, 16); 
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
        const billsToGenerate = diffDays >= 0 ? Math.floor(diffDays / 14) : 0; 
        const expectedHeaderCount = 7 + billsToGenerate; 

        if (kasHeaders.length < expectedHeaderCount) {
            let needsUpdate = false;
            for (let i = kasHeaders.length; i < expectedHeaderCount; i++) {
                let billDate = new Date(baseDate.getTime() + ((i - 7 + 1) * 14 * 24 * 60 * 60 * 1000));
                let bulanSingkat = billDate.toLocaleDateString('id-ID', { month: 'short' }).replace('.', '');
                let bCode = (i % 2 === 1) ? 'B1' : 'B2'; 
                kasHeaders.push(`${bulanSingkat} ${bCode}`);
                dataKasMingguan.forEach(siswa => siswa.status.push(0)); 
                needsUpdate = true;
            }
            if (needsUpdate) {
                await updateDoc(portalDocRef, { kas_headers: kasHeaders, kas_students: dataKasMingguan });
                return; 
            }
        }

        if (currentActiveCourse) {
            renderModules();
            renderTasks(); // <--- RENDER TUGAS
        }
        renderActivityLog();
        renderCalendar();
        renderKasHistory();
        renderKas();
        renderTabelMingguan();
        renderDashboardWidgets();
        if (typeof renderNotifications === 'function') renderNotifications();
        
        if (document.getElementById('kas-anda') && document.getElementById('kas-anda').style.display === 'block') {
            window.renderKasAnda();
        }
    } else {
        inisialisasiDatabaseCloud();
    }
});

async function inisialisasiDatabaseCloud() {
    const defaultData = {
        modules: { 'Agama': [], 'Pemrograman Dasar 2': [], 'Prakt. Pemrograman Dasar 2': [], 'Matematika-2': [], 'Rangkaian Elektronika 2': [], 'Prakt. Rangkaian Elektronika 2': [], 'Rangkaian Logika 2': [], 'Prakt. Rangkaian Logika 2': [], 'Workshop Basis Data': [], 'Workshop Instrumentasi & Telemetri': [] },
        tasks: { 'Agama': [], 'Pemrograman Dasar 2': [], 'Prakt. Pemrograman Dasar 2': [], 'Matematika-2': [], 'Rangkaian Elektronika 2': [], 'Prakt. Rangkaian Elektronika 2': [], 'Rangkaian Logika 2': [], 'Prakt. Rangkaian Logika 2': [], 'Workshop Basis Data': [], 'Workshop Instrumentasi & Telemetri': [] },
        events: [],
        logs: [{ message: 'Database Kas V3 Berhasil Dibuat', user: 'Sistem', time: 'Sekarang' }],
        kas_summary: { terkumpul: 518000, saldo: 380000, tunggakan: 156000, pengeluaran: 138000, lunas: 0, menunggak: 0, jumat: 6, pending: 0, progress: 0 },
        kas_headers: ['Sep B1', 'Okt B1', 'Okt B2', 'Nov B1', 'Nov B2', 'LIBUR SMT', 'Feb B2'],
        kas_students: [
            { nama: "Fernando Brillian Arisando", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Dzaka Zidane Atha'Ariq Sasmita", status: [1, 1, 1, 1, 1, "libur", 1] }, { nama: "Mishbahul Ayubi", status: [1, 1, 1, 0, 0, "libur", 0] }, { nama: "Meyco Neyla Pristya Ramadhani", status: [1, 1, 1, 1, 1, "libur", 1] }, { nama: "Muhammad Adhitya Ramadhani", status: [1, 1, 1, 0, 0, "libur", 0] }, { nama: "Risnan Ahmad Januar", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Varel Bambang Mirzandi", status: [1, 1, 1, 1, 1, "libur", 1] }, { nama: "Aqil Nawawi", status: [1, 1, 1, 1, 0, "libur", 0] }, { nama: "Rizko Prima Arfianto", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Muhammad Ihsan Rijadin", status: [1, 1, 1, 0, 0, "libur", 0] }, { nama: "Bima Aji Ramadhan Bayu Susanto", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Moh. Rizaldy Firmansyah", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Muhamad Izzat Zaidan", status: [1, 1, 1, 0, 0, "libur", 0] }, { nama: "Adrian Dwi Firmansyah", status: [1, 1, 0, 0, 0, "libur", 0] }, { nama: "Nafis Ubaidillah", status: [1, 1, 1, 1, 1, "libur", 1] }, { nama: "Khairu Farhan Ramadhan", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "M. Amir Aisy Wijaya", status: [1, 1, 1, 0, 0, "libur", 0] }, { nama: "Mohammad Pujangga Gunawan", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Muhammad Nabil Syah Putra", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Aditya Wahyu Anggara", status: [1, 1, 1, 0, 0, "libur", 0] }, { nama: "Nadira Farah Parawansa", status: [1, 1, 1, 1, 0, "libur", 0] }, { nama: "Tasya Aulia Nabila", status: [1, 1, 1, 1, 1, "libur", 1] }, { nama: "Ridho Trifianto Putra", status: [1, 1, 1, 0, 0, "libur", 0] }, { nama: "Dimas Dharma Wijaya", status: [1, 1, 0, 0, 0, "libur", 0] }, { nama: "Faizar Ariq Setyawan", status: [1, 0, 0, 0, 0, "libur", 0] }, { nama: "Hafidz Abdurrahman Assiddiqie", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Mohammad Rafi Raissandi", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Dhiaz Nabihan Mahran", status: [1, 1, 1, 0, 0, "libur", 0] }
        ]
    };
    await setDoc(portalDocRef, defaultData);
}

// ==========================================
// 4. AKSES LOKAL & AUTENTIKASI
// ==========================================

const nameEl = document.getElementById('userNameDisplay');
if(nameEl) nameEl.innerText = userName;

const roleEl = document.getElementById('userRoleDisplay');
if(roleEl) roleEl.innerText = userNRP;

const avatarEl = document.querySelector('.avatar');
if(avatarEl && userName) avatarEl.innerText = userName.charAt(0).toUpperCase();

// ==========================================
// KODE SAPAAN (FULL NAME):
// ==========================================
const welcomeGreetingEl = document.getElementById('welcomeGreeting');
if (welcomeGreetingEl && userName !== 'Tamu') {
    // Langsung panggil variabel userName tanpa dipotong
    welcomeGreetingEl.innerHTML = `Hai, ${userName}! 👋`;
}

if (userRole === 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'inline-block');
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {

localStorage.clear();

window.location.replace("login.html");

});
}

const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
if (themeToggleBtn && themeIcon) {
    if (localStorage.getItem('kelas_theme') === 'dark') { document.body.classList.add('dark-mode'); themeIcon.className = 'bx bx-moon'; }
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('kelas_theme', isDark ? 'dark' : 'light');
        themeIcon.className = isDark ? 'bx bx-moon' : 'bx bx-cloud';
    });
}

const menuToggleBtn = document.getElementById('menuToggleBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
if(menuToggleBtn) menuToggleBtn.addEventListener('click', () => { sidebar.classList.add('active'); sidebarOverlay.classList.add('active'); });
const closeSidebar = () => { if(sidebar) sidebar.classList.remove('active'); if(sidebarOverlay) sidebarOverlay.classList.remove('active'); };
if(closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
if(sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);


window.switchView = (viewId, btnElement) => {
    // 1. Matikan semua view dan tombol nav
    document.querySelectorAll('.view-section, .nav-btn').forEach(el => el.classList.remove('active'));
    
    // 2. Aktifkan view yang dituju
    const targetView = document.getElementById(viewId);
    if(targetView) targetView.classList.add('active');
    
    if(btnElement) btnElement.classList.add('active');
    
    // 3. Khusus menu Modul, reset ke daftar list awal
    if (viewId === 'modul') { 
        document.getElementById('course-list-view').style.display = 'block'; 
        document.getElementById('course-detail-view').style.display = 'none'; 
    }
    
    // 4. TUTUP SIDEBAR & OVERLAY SECARA PAKSA (Ini obat blurnya!)
    closeSidebar(); 
};

window.openCourseFromSidebar = (courseName, btnElement) => {
    document.querySelectorAll('.view-section, .nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('modul').classList.add('active');
    btnElement.classList.add('active');
    window.openCourse(courseName);
    if (window.innerWidth <= 768) closeSidebar();
};

// Fungsi Mengganti Tab Matkul & Tombol Header
window.switchCourseTab = (tabId, btnElement) => { 
    document.querySelectorAll('.course-tab-content, .course-tab-btn').forEach(el => el.classList.remove('active')); 
    document.getElementById('tab-' + tabId).classList.add('active'); 
    btnElement.classList.add('active'); 

const role = localStorage.getItem("user_role");
const hasAccess = (role === "admin" || role === "pj");

    const btnModul = document.getElementById('btnUploadModul');
    const btnTugas = document.getElementById('btnUploadTugas');

    if (btnModul) btnModul.style.display = 'none'; 
    if (btnTugas) btnTugas.style.display = 'none'; 

    if (hasAccess) {
        if (tabId === 'materi' && btnModul) btnModul.style.display = 'inline-flex';
        if (tabId === 'tugas' && btnTugas) btnTugas.style.display = 'inline-flex';
    }
};

window.openCourse = (courseName) => {
    currentActiveCourse = courseName;
    document.getElementById('course-list-view').style.display = 'none';
    document.getElementById('course-detail-view').style.display = 'block';
    document.getElementById('detailCourseTitle').innerText = courseName;
    document.getElementById('detailCourseInfo').innerText = courseMeta[courseName] ? courseMeta[courseName].info : '2 SKS • Semester Genap';
    document.getElementById('detailCoursePJ').innerText = courseMeta[courseName] ? courseMeta[courseName].pj : 'Belum Ditentukan';
    
    let infoJadwal = courseMeta[courseName] ? courseMeta[courseName].jadwal : 'Cek jadwal akademik pusat.';
    document.getElementById('jadwal-info-container').innerHTML = `<h4 style="font-size: 16px; margin-bottom: 8px;">Jadwal Rutin</h4><p style="color: var(--text-muted); font-size: 14px; display: flex; align-items: center; gap: 8px;"><i class='bx bx-calendar-event' style="color: var(--primary); font-size: 18px;"></i> ${infoJadwal}</p>`;

    const isPJ = localStorage.getItem(`akses_pj_${courseName}`) === 'terbuka';
    const isAdmin = localStorage.getItem('user_role') === 'admin';
    const btnPJ = document.getElementById('btnAksesPJ');
    if (btnPJ) {
        btnPJ.style.display = (isPJ || isAdmin) ? 'none' : 'inline-flex';
    }

    const firstTabBtn = document.querySelectorAll('.course-tab-btn')[0];
    if (firstTabBtn) window.switchCourseTab('materi', firstTabBtn);
    renderModules(); 
    renderTasks();
};

window.closeCourse = () => { document.getElementById('course-list-view').style.display = 'block'; document.getElementById('course-detail-view').style.display = 'none'; currentActiveCourse = ''; };


// Fungsi Pembuka/Penutup Modal yang Aman
window.openAddModulModal = () => { closeSidebar(); document.getElementById('addModulModal').classList.add('active'); };
window.closeAddModulModal = () => { document.getElementById('addModulModal').classList.remove('active'); document.getElementById('addModulForm').reset(); };

window.openAddTugasModal = () => { closeSidebar(); document.getElementById('addTugasModal').classList.add('active'); };
window.closeAddTugasModal = () => { document.getElementById('addTugasModal').classList.remove('active'); document.getElementById('addTugasForm').reset(); };

window.changeMonth = (dir) => { currentMonth += dir; if(currentMonth > 11) { currentMonth = 0; currentYear++; } if(currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(); };

window.openAddEventModal = () => { closeSidebar(); document.getElementById('addEventModal').classList.add('active'); };
window.closeAddEventModal = () => { document.getElementById('addEventModal').classList.remove('active'); document.getElementById('addEventForm').reset(); };
// Fungsi Hapus Acara Kalender
window.hapusEventKalender = async (index) => {
    const isAdmin = localStorage.getItem('user_role') === 'admin';
    if (!isAdmin) {
        alert("❌ Hanya Admin/Dosen yang dapat menghapus acara kalender!");
        return;
    }
    
    // Konfirmasi sebelum menghapus
    if(confirm(`Yakin ingin menghapus acara "${calendarEvents[index].title}"?`)) {
        const judulTerhapus = calendarEvents[index].title;
        calendarEvents.splice(index, 1); // Hapus dari array
        
        // Simpan ke Firebase
        await updateCloudData('events', calendarEvents, `Acara Dihapus: ${judulTerhapus}`);
    }
};

window.switchKasTab = (tabId, btnElement) => { 
    document.querySelectorAll('.kas-tab-content').forEach(el => el.style.display = 'none'); 
    document.querySelectorAll('.kas-tab-btn').forEach(el => el.classList.remove('active')); 
    document.getElementById('kas-' + tabId).style.display = 'block'; 
    btnElement.classList.add('active'); 
    if (tabId === 'anda') window.renderKasAnda(); 
};
 

window.toggleKasStatus = async (studentIndex, weekIndex) => {
    const roleSekarang = localStorage.getItem('user_role');

if (roleSekarang !== 'admin' && roleSekarang !== 'bendahara') {
alert("❌ Hanya Admin dan Bendahara yang dapat mengubah status kas.");
return;
}
    if(dataKasMingguan[studentIndex].status[weekIndex] === 1) {
        dataKasMingguan[studentIndex].status[weekIndex] = 0; 
    } else {
        dataKasMingguan[studentIndex].status[weekIndex] = 1; 
    }
    await updateDoc(portalDocRef, { kas_students: dataKasMingguan });
};

window.openGeneralQrisModal = () => {
    const infoText = document.getElementById('qrisTextInfo');
    if(infoText) infoText.innerHTML = `Silakan <em>scan</em> QRIS di bawah ini untuk membayar atau menyetor kas kelas. Nominal bebas sesuai dengan kebutuhan Anda.`;
    const namaSekarang = localStorage.getItem('user_name') || 'Anggota Kelas';
    const waPesan = `Halo Bendahara, saya ${namaSekarang} ingin konfirmasi pembayaran/setoran kas kelas. Berikut saya lampirkan bukti transfernya ya.`;
    const nomorWaBendahara = "6282338734024"; 
    const linkWa = `https://wa.me/${nomorWaBendahara}?text=${encodeURIComponent(waPesan)}`;
    const btnWa = document.getElementById('btnWaKonfirmasi');
    if(btnWa) btnWa.href = linkWa;
    document.getElementById('qrisModal').classList.add('active');
};

window.openQrisModal = (nominalText, pesanWa) => {
    const infoText = document.getElementById('qrisTextInfo');
    if(infoText) infoText.innerHTML = `Silakan <em>scan</em> QRIS di bawah ini untuk melunasi tagihan Anda sebesar <strong style="color: #f43f5e;">${nominalText}</strong>.`;
    const nomorWaBendahara = "6282338734024"; 
    const linkWa = `https://wa.me/${nomorWaBendahara}?text=${encodeURIComponent(pesanWa)}`;
    const btnWa = document.getElementById('btnWaKonfirmasi');
    if(btnWa) btnWa.href = linkWa;
    document.getElementById('qrisModal').classList.add('active');
};
window.closeQrisModal = () => document.getElementById('qrisModal').classList.remove('active');

// FUNGSI UNTUK MENGHAPUS MODUL & FILE DI GDRIVE
window.deleteModule = async (courseName, index) => {
    const roleSekarang = localStorage.getItem('user_role');
    const pjAktif = localStorage.getItem('akses_pj') === 'terbuka';
    
    if (roleSekarang !== 'admin' && !pjAktif) {
        alert("🔒 Hanya Admin dan PJ Mata Kuliah yang bisa menghapus materi!");
        return;
    }

    const yakin = confirm("Yakin ingin menghapus materi ini? File asli di Google Drive juga akan ikut terhapus.");
    if (!yakin) return;

    try {
        const targetModule = moduleDatabase[courseName][index];
        
        // Cek apakah ini file yang diupload ke Google Drive
        if (targetModule.type === 'file' && targetModule.link.includes('drive.google.com')) {
            
            // --- PASTE URL WEB APP DARI GOOGLE APPS SCRIPT DI SINI ---
            const scriptURL = "https://script.google.com/macros/s/AKfycbzKKbWhg3UHAmGulxU98a_GAQNu84L0IZQThX-EknPo0DP3MSBlOlUcwKMXLT78q3VEpg/exec"; 

            // Ekstrak ID File dari URL GDrive yang panjang
            // Contoh URL: https://drive.google.com/file/d/1abcXYZ/preview -> ID-nya: 1abcXYZ
            const match = targetModule.link.match(/\/d\/(.*?)\//);
            
            if (match && match[1]) {
                const fileId = match[1];
                
                // Kirim perintah HAPUS ke Google Script
                await fetch(scriptURL, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "delete",
                        fileId: fileId
                    })
                });
                console.log("Sistem: File di Drive berhasil ditaruh ke tempat sampah.");
            }
        }

        // 1. Hapus dari database web (Firestore)
        moduleDatabase[courseName].splice(index, 1);
        await updateCloudData('modules', moduleDatabase, "Materi dihapus");

        // 2. Refresh tampilan layar
        if (typeof renderModules === 'function') renderModules();
        
        alert("✅ Materi dan file asli berhasil dihapus bersih!");
    } catch (err) {
        console.error("Gagal menghapus modul:", err);
        alert("❌ Terjadi kesalahan saat menghapus data.");
    }
};

// ==========================================
// 6. UPDATE CLOUD & EVENT LISTENER
// ==========================================
async function updateCloudData(fieldStr, newData, logMessage) {
    try {
        await updateDoc(portalDocRef, { [fieldStr]: newData });
        if(logMessage) await pushLogToCloud(logMessage);
    } catch (e) { console.error("Gagal update cloud", e); }
}

async function pushLogToCloud(messageText) {
    const roleSekarang = localStorage.getItem('user_role');
    const bendaharaAktif = localStorage.getItem('user_role') === 'bendahara';
    const currentUser = roleSekarang === 'admin' ? 'Dosen / PIC' : (bendaharaAktif ? 'Bendahara Kelas' : 'Mahasiswa');
    const now = new Date();
    const timeStr = `${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
    activityLogs.unshift({ message: messageText, user: currentUser, time: timeStr });
    if(activityLogs.length > 5) activityLogs.pop();
    await updateDoc(portalDocRef, { logs: activityLogs });
}

const addModulForm = document.getElementById('addModulForm');
if(addModulForm) {
    addModulForm.addEventListener('submit', async function(e) {
        e.preventDefault(); 
        
        const title = document.getElementById('modulTitle').value;
        const fileInput = document.getElementById('modulFile');
        const linkInput = document.getElementById('modulLink').value;
        
        let fileUrl = linkInput; 
        let fileNameData = linkInput ? linkInput : '';
        let fileType = linkInput ? 'link' : 'file';
        let fileSize = 'Eksternal';

        const btnSubmit = e.target.querySelector('button[type="submit"]');
        const originalBtnText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Mengirim ke Google Drive...";
        btnSubmit.disabled = true;

        try {
            // JIKA ADA FILE YANG DIPILIH DARI LAPTOP/HP
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                fileNameData = file.name;
                fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';
                
                // --- PASTE URL WEB APP DARI GOOGLE APPS SCRIPT DI SINI ---
                const scriptURL = "https://script.google.com/macros/s/AKfycbzKKbWhg3UHAmGulxU98a_GAQNu84L0IZQThX-EknPo0DP3MSBlOlUcwKMXLT78q3VEpg/exec"; 

                // Ubah file menjadi format Base64 agar bisa meluncur ke Google Script
                const base64Data = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.readAsDataURL(file);
                });

                // Kirim lewat jalur belakang ke GDrive
                const response = await fetch(scriptURL, {
                    method: "POST",
                    body: JSON.stringify({
                        fileName: file.name,
                        mimeType: file.type,
                        base64: base64Data
                    })
                });

                const result = await response.json();

                if (result.status === "success") {
                    fileUrl = result.url; // Ini adalah link sakti /preview dari GDrive
                } else {
                    throw new Error(result.message);
                }
            }

            if(!fileUrl) {
                alert("⚠️ Masukkan file atau link terlebih dahulu!");
                btnSubmit.innerHTML = originalBtnText;
                btnSubmit.disabled = false;
                return;
            }

            // SIMPAN LINK GDRIVE TERSEBUT KE BUKU CATATAN FIREBASE FIRESTORE
            if (!moduleDatabase[currentActiveCourse]) moduleDatabase[currentActiveCourse] = [];
            
            moduleDatabase[currentActiveCourse].push({ 
                title: title, 
                fileName: fileNameData,
                type: fileType,
                link: fileUrl, 
                size: fileSize,
                createdAt: new Date().toISOString()
            });
            
            window.closeAddModulModal(); 
            addModulForm.reset(); 
            await updateCloudData('modules', moduleDatabase, `Materi Baru: ${title}`);
            
            if (typeof renderModules === 'function') renderModules();

        } catch (err) {
            console.error("Error upload:", err);
            alert("❌ Gagal upload: " + err.message);
        } finally {
            btnSubmit.innerHTML = originalBtnText;
            btnSubmit.disabled = false;
        }
    });
}

// Event Submit Form Tambah Tugas
// Event Submit Form Tambah Tugas
const addTugasForm = document.getElementById('addTugasForm');
if(addTugasForm) {
    addTugasForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Ambil semua nilai dari form
        const newTask = {
            title: document.getElementById('tugasTitle').value,
            jenis: document.getElementById('tugasJenis').value, // <--- Data Baru
            bentuk: document.getElementById('tugasBentuk').value,
            pengerjaan: document.getElementById('tugasPengerjaan').value,
            format: document.getElementById('tugasFormat').value,
            kumpul: document.getElementById('tugasKumpul').value,
            deadline: document.getElementById('tugasDeadline').value,
            desc: document.getElementById('tugasDesc').value
        };
        
        if (!taskDatabase[currentActiveCourse]) taskDatabase[currentActiveCourse] = [];
        taskDatabase[currentActiveCourse].push(newTask);
        
        window.closeAddTugasModal(); 
        await updateCloudData('tasks', taskDatabase, `Tugas Baru: ${newTask.title}`);
    });
}

const addEventForm = document.getElementById('addEventForm');
if(addEventForm) {
    addEventForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('eventName').value;
        const date = document.getElementById('eventDate').value;
        const type = document.getElementById('eventAttendance').value;
        calendarEvents.push({ title: name, date: date, type: type });
        window.closeAddEventModal(); 
        await updateCloudData('events', calendarEvents, `Tambah Agenda: ${name}`);
    });
}


function renderModules() {
    const container = document.getElementById('module-items-container');
    if(!container) return;
    container.innerHTML = ''; 
    const modules = moduleDatabase[currentActiveCourse] || [];
    
    if (modules.length === 0) { 
        container.innerHTML = '<div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted); border: 2px dashed var(--border); border-radius: 16px;"><i class=\'bx bx-folder-open\' style="font-size: 48px; opacity: 0.5; margin-bottom: 12px;"></i><br>Belum ada materi atau modul yang diunggah.</div>'; 
        return; 
    }
    
    // Perhatikan ada tambahan 'index' di dalam kurung forEach
    modules.forEach((mod, index) => { 
        const isPdf = mod.fileName && mod.fileName.toLowerCase().endsWith('.pdf');
        const iconType = isPdf ? 'bxs-file-pdf' : 'bx-link-external';
        const colorIcon = isPdf ? '#f43f5e' : '#3b82f6';

        let actionBtn = `
            <a href="${mod.link}" target="_blank" class="btn btn-outline" style="width:100%; display:flex; justify-content:center; text-decoration:none; color: var(--text-main); font-weight: 700; border-color: var(--primary); color: var(--primary);">
                <i class='bx bx-book-open'></i> Buka & Baca Materi
            </a>`;

        // Tombol Delete (Merah) di pojok kanan
        let deleteBtn = `
            <button onclick="deleteModule('${currentActiveCourse}', ${index})" style="background: transparent; border: none; color: #f43f5e; font-size: 18px; cursor: pointer; padding: 4px; border-radius: 6px; transition: 0.2s;" title="Hapus Materi">
                <i class='bx bx-trash'></i>
            </button>`;

        container.innerHTML += `
        <div class="card-box" style="margin-bottom: 0; border-top: 4px solid ${colorIcon}; position: relative;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-size:10px; padding:4px 8px; background:rgba(99, 102, 241, 0.1); color:var(--primary); border-radius:6px; font-weight:800; letter-spacing: 0.5px;">
                    ${isPdf ? 'PDF DOCUMENT' : 'EXTERNAL LINK'}
                </span>
                ${deleteBtn}
            </div>
            <h3 style="font-size: 15px; margin-bottom: 16px; font-weight: 800; color: var(--text-main); line-height: 1.4;">${mod.title}</h3>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px; display: flex; align-items: center; gap: 6px; word-break: break-all;">
                <i class='bx ${iconType}' style="color: ${colorIcon}; font-size: 18px; min-width: 18px;"></i> 
                ${mod.fileName}
            </p>
            ${actionBtn}
        </div>`; 
    });
}

function renderTasks() {
    const container = document.getElementById('task-items-container');
    if(!container) return;
    container.innerHTML = ''; 
    
    let tasks = taskDatabase[currentActiveCourse] || [];
    const now = new Date();
    let isDatabaseChanged = false; 

    // FILTER AUTO-DELETE TUGAS KADALUARSA
    const validTasks = tasks.filter(tsk => {
        const deadlineDate = new Date(tsk.deadline);
        if (now > deadlineDate) {
            isDatabaseChanged = true; 
            return false; 
        }
        return true; 
    });

    if (isDatabaseChanged) {
        taskDatabase[currentActiveCourse] = validTasks;
        updateCloudData('tasks', taskDatabase); 
        tasks = validTasks; 
    }

    // TAMPILKAN KE LAYAR
    if (tasks.length === 0) { 
        container.innerHTML = '<div class="card-box" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; border: 2px dashed var(--border); background: transparent;"><i class=\'bx bx-task\' style="font-size: 56px; color: var(--text-muted); opacity: 0.5; margin-bottom: 16px;"></i><h4 style="font-size: 18px; margin-bottom: 8px; color: var(--text-main);">Belum Ada Tugas Aktif</h4><p style="color: var(--text-muted);">Hore! Tidak ada tugas yang menunggu atau semua tugas sudah melewati batas deadline.</p></div>'; 
        return; 
    }

    tasks.forEach(tsk => { 
        let tglMerapikan = tsk.deadline.replace('T', ' Jam ');
        let descHTML = tsk.desc ? `<p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px; line-height: 1.5; background: var(--bg-color); padding: 10px; border-radius: 6px;">${tsk.desc}</p>` : '';
        
        // Logika Lencana Individu/Kelompok (Biru Terang)
        let iconJenis = (tsk.jenis === 'Kelompok') ? 'bx-group' : 'bx-user';
        let jenisHTML = `<span style="font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); color: var(--primary);"><i class='bx ${iconJenis}'></i> Tugas ${tsk.jenis || 'Individu'}</span>`;
        
        container.innerHTML += `
        <div class="card-box" style="margin-bottom: 0; border-left: 4px solid #f59e0b; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap: wrap; gap: 8px;">
                    <h3 style="font-size: 16px; color: var(--text-main); font-weight: 800; margin: 0;">${tsk.title}</h3>
                    <span style="font-size:11px; padding:4px 8px; background:rgba(245, 158, 11, 0.1); color:#f59e0b; border-radius:6px; font-weight:700; white-space: nowrap;">
                        <i class='bx bx-timer'></i> ${tglMerapikan}
                    </span>
                </div>
                
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
                    ${jenisHTML}
                    <span style="font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px; background: var(--bg-color); border: 1px solid var(--border); color: var(--text-main);"><i class='bx bx-file'></i> ${tsk.bentuk || 'Softfile'}</span>
                    <span style="font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px; background: var(--bg-color); border: 1px solid var(--border); color: var(--text-main);"><i class='bx bx-pencil'></i> ${tsk.pengerjaan || 'Ketik'}</span>
                    <span style="font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px; background: var(--bg-color); border: 1px solid var(--border); color: var(--text-main);"><i class='bx bx-extension'></i> Format: ${tsk.format || 'Bebas'}</span>
                </div>

                ${descHTML}
            </div>
            
            <button class="btn btn-outline" style="width:100%; color:#f59e0b; border-color:#f59e0b; font-weight: 700;" onclick="alert('Instruksi Pengumpulan:\\nKumpulkan di: ${tsk.kumpul || 'Ethol'}')">
                <i class='bx bx-upload'></i> Kumpulkan (${tsk.kumpul || 'Ethol'})
            </button>
        </div>`; 
    });
}

function renderActivityLog() {
    const container = document.getElementById('activity-log-container');
    if (!container) return;
    container.innerHTML = '';
    if (activityLogs.length === 0) { container.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">Belum ada aktivitas.</p>'; return; }
    activityLogs.forEach(log => { container.innerHTML += `<div class="timeline-item"><div class="tl-dot" style="background-color: var(--primary);"></div><div class="tl-content" style="background: transparent; border: none; padding: 0;"><h5 style="font-size: 13px; margin-bottom: 2px;">${log.message}</h5><p style="font-size: 12px; margin-bottom: 6px;">Oleh: ${log.user}</p><small style="background: rgba(99, 102, 241, 0.1); color: var(--primary); padding: 2px 6px; border-radius: 4px; font-weight: 600;">${log.time}</small></div></div>`; });
}

function renderCalendar() {
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const textEl = document.getElementById('calendarMonthYear');
    if(textEl) textEl.innerText = `${monthNames[currentMonth]} ${currentYear}`;
    const grid = document.getElementById('calendarGrid');
    if(!grid) return;
    
    const headers = Array.from(grid.querySelectorAll('.cal-day-name'));
    grid.innerHTML = ''; 
    headers.forEach(h => grid.appendChild(h));
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for(let i = 0; i < firstDay; i++) grid.innerHTML += `<div class="cal-cell empty"></div>`;
    
    const today = new Date();
    const isAdmin = localStorage.getItem('user_role') === 'admin';

    for(let i = 1; i <= daysInMonth; i++) {
        let isToday = (i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) ? 'today' : '';
        let m = (currentMonth + 1).toString().padStart(2, '0'); 
        let d = i.toString().padStart(2, '0'); 
        let dateStr = `${currentYear}-${m}-${d}`;
        
        let dayEvents = calendarEvents.map((ev, idx) => ({...ev, indexAsli: idx})).filter(ev => ev.date === dateStr); 
        
        let eventsHtml = '';
        dayEvents.forEach(ev => { 
            let badgeClass = ev.type === 'wajib' ? 'event-wajib' : 'event-opsional'; 
            
            // Tombol X khusus admin
            let deleteBtn = isAdmin ? `<i class='bx bx-x' style="cursor: pointer; background: rgba(0,0,0,0.1); border-radius: 50%; padding: 2px; flex-shrink: 0;" onclick="hapusEventKalender(${ev.indexAsli}); event.stopPropagation();" title="Hapus Acara"></i>` : '';
            
            // Perhatikan style flex: 1 dan min-width: 0 di bawah ini agar kotak tidak rusak/melar!
            eventsHtml += `
            <div class="event-badge ${badgeClass}" style="display: flex; justify-content: space-between; align-items: center; gap: 4px; margin-bottom: 2px;">
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;">${ev.title}</span>
                ${deleteBtn}
            </div>`; 
        });
        
        grid.innerHTML += `<div class="cal-cell ${isToday}"><div class="cal-date">${i}</div>${eventsHtml}</div>`;
    }
}

window.renderKas = () => {
    if(!document.getElementById('kas-terkumpul')) return; 
    let totalLunasSemua = 0, totalNunggakSemua = 0, siswaLunas = 0, siswaNunggak = 0, listMenunggakHTML = '';
    
    dataKasMingguan.forEach(siswa => {
        let lunasSiswa = 0, nunggakSiswa = 0;
        siswa.status.forEach((st, idx) => {
            if (kasHeaders[idx] !== 'LIBUR SMT') {
                if (st === 1) lunasSiswa++; else if (st === 0) nunggakSiswa++;
            }
        });
        totalLunasSemua += lunasSiswa;
        totalNunggakSemua += nunggakSiswa;
        
        if (nunggakSiswa > 0) {
            siswaNunggak++;
            let utang = nunggakSiswa * 5000;
            let utangStr = `Rp ${utang.toLocaleString('id-ID')}`;
            let inisial = siswa.nama.charAt(0).toUpperCase();
            
            listMenunggakHTML += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--border);"><div style="display: flex; align-items: center; gap: 12px;"><div class="avatar" style="width: 40px; height: 40px; background: rgba(244, 63, 94, 0.1); color: #f43f5e; box-shadow: none;">${inisial}</div><div><h5 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">${siswa.nama}</h5><small style="color: var(--text-muted); font-weight: 500;">Nunggak ${nunggakSiswa} Kali</small></div></div><div style="text-align: right;"><h5 style="font-size: 14px; font-weight: 800; color: #f43f5e;">${utangStr}</h5></div></div>`;
        } else {
            siswaLunas++;
        }
    });

    const biayaPerPembayaran = 5000;
    let totalTerkumpul = totalLunasSemua * biayaPerPembayaran;
    let totalTunggakan = totalNunggakSemua * biayaPerPembayaran;
    let pengeluaranTetap = 0;
    if (kasHistory && kasHistory.length > 0) {
        pengeluaranTetap = kasHistory.reduce((sum, item) => sum + parseInt(item.amount), 0);
    }
    let saldoBersih = totalTerkumpul - pengeluaranTetap;
    
    let totalTargetKolom = kasHeaders.filter(h => h !== 'LIBUR SMT').length;
    let totalTargetKeseluruhan = dataKasMingguan.length * totalTargetKolom;
    let progress = totalTargetKeseluruhan === 0 ? 0 : Math.round((totalLunasSemua / totalTargetKeseluruhan) * 100);

    const formatRp = (angka) => "Rp " + parseInt(angka).toLocaleString('id-ID'); 
    document.getElementById('kas-terkumpul').innerText = formatRp(totalTerkumpul);
    document.getElementById('kas-saldo').innerText = formatRp(saldoBersih);
    document.getElementById('kas-tunggakan').innerText = formatRp(totalTunggakan);
    document.getElementById('kas-pengeluaran').innerText = formatRp(pengeluaranTetap);
    document.getElementById('kas-lunas').innerText = siswaLunas;
    document.getElementById('kas-menunggak').innerText = siswaNunggak;
    document.getElementById('kas-badge-menunggak').innerText = siswaNunggak; 
    document.getElementById('kas-minggu-aktif').innerText = totalTargetKolom;
    document.getElementById('kas-progress-text').innerText = progress + '%';
    document.getElementById('kas-progress-bar').style.width = progress + '%';
    
    const listContainer = document.getElementById('kas-list-menunggak');
    if (listContainer) {
        if (siswaNunggak === 0) listContainer.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-weight: 600;"><i class='bx bx-party' style="font-size: 24px; color: #10b981; margin-bottom: 8px; display: block;"></i> Lunas semua! Hebat! 🎉</div>`;
        else listContainer.innerHTML = listMenunggakHTML;
    }

    const baseDate = new Date(2026, 1, 16); 
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    const nextBillMultiplier = diffDays >= 0 ? Math.floor(diffDays / 14) + 1 : 1;
    const nextDate = new Date(baseDate.getTime() + (nextBillMultiplier * 14 * 24 * 60 * 60 * 1000));
    let tglTagihan = nextDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if(document.getElementById('kas-next-date')) document.getElementById('kas-next-date').innerText = tglTagihan;
};

window.renderTabelMingguan = () => {
    const thead = document.getElementById('table-kas-minggu-head');
    const tbody = document.getElementById('table-kas-minggu-body');
    if(!thead || !tbody) return; 

    const nrpMap = {
        "Fernando Brillian Arisando": "3225600061", "Dzaka Zidane Atha'Ariq Sasmita": "3225600062", "Mishbahul Ayubi": "3225600063", "Meyco Neyla Pristya Ramadhani": "3225600064", "Muhammad Adhitya Ramadhani": "3225600065", "Risnan Ahmad Januar": "3225600066", "Varel Bambang Mirzandi": "3225600067", "Aqil Nawawi": "3225600068", "Rizko Prima Arfianto": "3225600069", "Muhammad Ihsan Rijadin": "3225600070", "Bima Aji Ramadhan Bayu Susanto": "3225600071", "Moh. Rizaldy Firmansyah": "3225600072", "Muhamad Izzat Zaidan": "3225600073", "Adrian Dwi Firmansyah": "3225600074", "Nafis Ubaidillah": "3225600075", "Khairu Farhan Ramadhan": "3225600076", "M. Amir Aisy Wijaya": "3225600078", "Mohammad Pujangga Gunawan": "3225600079", "Muhammad Nabil Syah Putra": "3225600080", "Aditya Wahyu Anggara": "3225600081", "Nadira Farah Parawansa": "3225600082", "Tasya Aulia Nabila": "3225600084", "Ridho Trifianto Putra": "3225600085", "Dimas Dharma Wijaya": "3225600086", "Faizar Ariq Setyawan": "3225600087", "Hafidz Abdurrahman Assiddiqie": "3225600088", "Mohammad Rafi Raissandi": "3225600089", "Dhiaz Nabihan Mahran": "3225600090"
    };
    
    let theadHTML = `<tr style="background: var(--surface-hover); color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;"><th style="padding: 16px; text-align: left; position: sticky; left: 0; background: var(--surface-hover); z-index: 11; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border);">Nama & NRP</th>`;
    
    kasHeaders.forEach(hdr => {
        if(hdr === 'LIBUR SMT') {
            theadHTML += `<th style="padding: 12px 8px; border-bottom: 1px solid var(--border); background: rgba(148, 163, 184, 0.05); color: var(--text-muted); min-width: 100px;">Des - Jan<br><small style="font-weight: 600; color: #94a3b8;">Libur Semester</small></th>`;
        } else {
            let splitHdr = hdr.split(' '); let bulan = splitHdr[0]; let kode = splitHdr[1] || ''; 
            let teksMinggu = kode === 'B1' ? 'Mg 1-2' : (kode === 'B2' ? 'Mg 3-4' : kode);
            theadHTML += `<th style="padding: 12px 8px; border-bottom: 1px solid var(--border); min-width: 70px;">${bulan}<br><small style="font-weight: 600; color: var(--primary);">${teksMinggu}</small></th>`;
        }
    });
    theadHTML += `<th style="padding: 12px 16px; color: #10b981; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); background: var(--surface-hover);">Lunas</th><th style="padding: 12px 16px; color: #f43f5e; border-bottom: 1px solid var(--border); background: var(--surface-hover);">Nunggak</th></tr>`;
    thead.innerHTML = theadHTML;

    tbody.innerHTML = '';
    
    let roleSekarang = localStorage.getItem('user_role');
let canEdit = (roleSekarang === 'admin' || roleSekarang === 'bendahara');

    dataKasMingguan.forEach((anggota, sIdx) => {
        let lunas = 0, nunggak = 0, cellHTML = '';
        anggota.status.forEach((st, wIdx) => {
            let isLibur = (kasHeaders[wIdx] === 'LIBUR SMT');
            if (isLibur) {
                cellHTML += `<td style="padding: 12px 8px; border-bottom: 1px solid var(--border); background: rgba(148, 163, 184, 0.05); font-weight: 700; color: var(--border);">-</td>`;
            } else {
                let icon = st === 1 ? `<i class='bx bx-check' style="color: #10b981; font-size: 20px; font-weight: bold;" title="Lunas"></i>` : `<i class='bx bx-x' style="color: #f43f5e; font-size: 20px; font-weight: bold;" title="Nunggak"></i>`;
                if (st === 1) lunas++; else nunggak++;
                let cursorStyle = canEdit ? 'cursor: pointer; background: var(--surface);' : 'cursor: default;';
                let onClickAction = canEdit ? `onclick="toggleKasStatus(${sIdx}, ${wIdx})"` : ``; 
                cellHTML += `<td style="padding: 12px 8px; border-bottom: 1px solid var(--border); ${cursorStyle} transition: 0.2s;" ${onClickAction}>${icon}</td>`;
            }
        });
        let nrp = nrpMap[anggota.nama] || '-';
        tbody.innerHTML += `<tr style="transition: background 0.2s;" onmouseover="this.style.backgroundColor='var(--surface-hover)'" onmouseout="this.style.backgroundColor='transparent'"><td style="padding: 14px 16px; text-align: left; position: sticky; left: 0; background: var(--surface); z-index: 1; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); box-shadow: 2px 0 5px rgba(0,0,0,0.02);"><div style="font-weight: 700; color: var(--text-main); font-size: 13px; margin-bottom: 4px;">${anggota.nama}</div><div style="font-size: 11px; font-weight: 600; color: var(--text-muted); padding: 2px 6px; background: var(--bg-color); display: inline-block; border-radius: 4px; border: 1px solid var(--border);">${nrp}</div></td>${cellHTML}<td style="padding: 12px 16px; font-weight: 800; color: #10b981; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); background: var(--surface);">${lunas} Kali</td><td style="padding: 12px 16px; font-weight: 800; color: #f43f5e; border-bottom: 1px solid var(--border); background: var(--surface);">${nunggak} Kali</td></tr>`;
    });
};

window.renderKasAnda = () => {
    const elNama = document.getElementById('kas-anda-nama');
    if (!elNama) return;

    const roleSekarang = localStorage.getItem('user_role');
    const namaSekarang = localStorage.getItem('user_name');

    if (roleSekarang === 'admin') { elNama.innerText = "Mode Admin Akses (Tidak ada tagihan)"; return; }
    if (!namaSekarang || namaSekarang === 'Tamu') { elNama.innerText = "Silakan Logout dan Login ulang dengan NRP Anda."; return; }

    elNama.innerText = namaSekarang;
    const myData = dataKasMingguan.find(siswa => siswa.nama === namaSekarang);

    if (myData) {
        let lunas = 0, nunggak = 0, mingguAktif = 0;
        myData.status.forEach((st, idx) => {
            if (kasHeaders[idx] !== 'LIBUR SMT') {
                if (st === 1) { lunas++; mingguAktif++; } else if (st === 0) { nunggak++; mingguAktif++; }
            }
        });

        const biayaPerPembayaran = 5000; 
        let terbayar = lunas * biayaPerPembayaran;
        let kurang = nunggak * biayaPerPembayaran;
        let progress = mingguAktif === 0 ? 0 : Math.round((lunas / mingguAktif) * 100);

        const formatRp = (angka) => "Rp " + parseInt(angka).toLocaleString('id-ID');

        document.getElementById('kas-anda-dibayar').innerText = formatRp(terbayar);
        document.getElementById('kas-anda-kurang').innerText = formatRp(kurang);
        document.getElementById('kas-anda-lunas').innerHTML = `${lunas} <span style="font-size: 14px; color: var(--text-muted); font-weight: 600;">Kali</span>`;
        document.getElementById('kas-anda-nunggak').innerHTML = `${nunggak} <span style="font-size: 14px; color: var(--text-muted); font-weight: 600;">Kali</span>`;
        document.getElementById('kas-anda-progress-text').innerText = progress + "%";
        
        const pBar = document.getElementById('kas-anda-progress-bar');
        pBar.style.width = progress + "%";
        if(progress < 50) pBar.style.background = "linear-gradient(90deg, #f43f5e, #fb923c)";
        else pBar.style.background = "linear-gradient(90deg, #10b981, #3b82f6)";

        const btnBayar = document.getElementById('btnBayarKasAnda');
        if (btnBayar) {
            if (kurang > 0) {
                btnBayar.style.display = 'block';
                let utangStr = formatRp(kurang);
                let waPesan = `Halo Bendahara, saya ${namaSekarang} ingin konfirmasi pembayaran tunggakan kas sebesar ${utangStr}. Berikut lampiran bukti transfernya ya.`;
                btnBayar.onclick = () => window.openQrisModal(utangStr, waPesan);
            } else {
                btnBayar.style.display = 'none';
            }
        }
    } else {
        elNama.innerText = namaSekarang + " (Data tidak ditemukan di buku kas)";
    }
};

window.renderDashboardWidgets = () => {
    const widgetTugas = document.getElementById('widget-tugas-container');
    if (widgetTugas) {
        let allTasks = [];
        const now = new Date();
        for (const courseName in taskDatabase) {
            if (taskDatabase[courseName]) {
                taskDatabase[courseName].forEach(tsk => {
                    const dlDate = new Date(tsk.deadline);
                    if (dlDate >= now) { allTasks.push({ ...tsk, courseName: courseName, dlDateObj: dlDate }); }
                });
            }
        }
        allTasks.sort((a, b) => a.dlDateObj - b.dlDateObj);
        if (allTasks.length > 0) {
            const nearest = allTasks[0];
            let tglMerapikan = nearest.deadline.replace('T', ' Jam ');
            widgetTugas.innerHTML = `
                <div style="background: var(--surface); padding: 16px; border-radius: 12px; border: 1px solid var(--border); border-left: 4px solid #f59e0b; transition: 0.2s;">
                    <h4 style="margin-bottom: 6px; color: var(--text-main); font-size: 15px; font-weight: 800;">${nearest.title}</h4>
                    <p style="font-size: 13px; color: #f59e0b; font-weight: 800; margin-bottom: 12px;"><i class='bx bx-timer bx-tada'></i> ${tglMerapikan}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted); border-top: 1px dashed var(--border); padding-top: 12px;">
                        <span style="font-weight: 700; color: var(--text-main);"><i class='bx bx-book-bookmark' style="color: var(--primary);"></i> ${nearest.courseName}</span>
                        <span style="background: rgba(99, 102, 241, 0.1); color: var(--primary); padding: 4px 8px; border-radius: 6px; font-weight: 800;"><i class='bx ${nearest.jenis === 'Kelompok' ? 'bx-group' : 'bx-user'}'></i> ${nearest.jenis || 'Individu'}</span>
                    </div>
                </div>`;
        } else {
            widgetTugas.innerHTML = `<div style="text-align: center; padding: 24px 20px; border: 2px dashed var(--border); border-radius: 12px; background: transparent;"><i class='bx bx-party' style="font-size: 36px; color: #10b981; margin-bottom: 12px;"></i><p style="color: var(--text-muted); font-size: 14px; font-weight: 700;">Hore! Kelas Aman.</p><p style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">Tidak ada tugas yang menunggu saat ini.</p></div>`;
        }
    }

// 2. ACARA TERDEKAT (KALENDER) - Versi Cerdas & Ramping
    const widgetEvent = document.getElementById('widget-event-container');
    if (widgetEvent) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        
        let upcomingEvents = calendarEvents.filter(ev => { return new Date(ev.date) >= today; });
        upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Ambil maksimal 3 acara
        let top3Events = upcomingEvents.slice(0, 3);
        
        if (top3Events.length > 0) {
            let htmlContent = '<div style="display: flex; flex-direction: column;">';
            
            top3Events.forEach((nextEvent, index) => {
                const evDate = new Date(nextEvent.date);
                const tgl = evDate.getDate();
                const bln = evDate.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
                
                // Kata kunci untuk mendeteksi Libur Nasional
                const keywordLibur = ["Tahun Baru", "Isra", "Cuti", "Nyepi", "Idul", "Wafat", "Paskah", "Buruh", "Kenaikan", "Waisak", "Pancasila", "HUT", "Maulid", "Natal"];
                let isLibur = keywordLibur.some(kw => nextEvent.title.includes(kw));
                
                let badgeText, badgeBg, badgeTextCol;
                
                // Jika itu hari libur, ganti labelnya
                if (isLibur) {
                    let isCuti = nextEvent.title.includes("Cuti");
                    badgeText = isCuti ? "CUTI BERSAMA" : "LIBUR NASIONAL";
                    badgeBg = isCuti ? 'rgba(245, 158, 11, 0.1)' : 'rgba(244, 63, 94, 0.1)';
                    badgeTextCol = isCuti ? '#f59e0b' : '#f43f5e';
                } else {
                    // Jika agenda biasa, pakai wajib/opsional
                    let isWajib = nextEvent.type === 'wajib';
                    badgeText = "ACARA " + (nextEvent.type ? nextEvent.type.toUpperCase() : "WAJIB");
                    badgeBg = isWajib ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)';
                    badgeTextCol = isWajib ? '#f43f5e' : '#10b981';
                }
                
                let borderStyle = index < top3Events.length - 1 ? 'border-bottom: 1px dashed var(--border);' : '';
                
                htmlContent += `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 10px 0; ${borderStyle}">
                        <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border-radius: 8px; text-align: center; width: 42px; height: 42px; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3); flex-shrink: 0;">
                            <span style="display: block; font-size: 15px; font-weight: 900; line-height: 1;">${tgl}</span>
                            <span style="font-size: 9px; font-weight: 700; display: block; margin-top: 3px; line-height: 1;">${bln}</span>
                        </div>
                        
                        <div style="flex: 1; min-width: 0;">
                            <h4 style="font-size: 13px; color: var(--text-main); margin-bottom: 4px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${nextEvent.title}">${nextEvent.title}</h4>
                            <span style="font-size: 9px; font-weight: 800; padding: 3px 6px; border-radius: 4px; display: inline-block; background: ${badgeBg}; color: ${badgeTextCol}; line-height: 1;">
                                ${badgeText}
                            </span>
                        </div>
                    </div>`;
            });
            
            htmlContent += '</div>';
            widgetEvent.innerHTML = htmlContent;
            
        } else {
            widgetEvent.innerHTML = `<div style="text-align: center; padding: 24px 20px; border: 2px dashed var(--border); border-radius: 12px; background: transparent;"><i class='bx bx-calendar-x' style="font-size: 36px; color: var(--border); margin-bottom: 12px;"></i><p style="color: var(--text-muted); font-size: 14px; font-weight: 700;">Jadwal Kosong</p></div>`;
        }
    }
};

// ==========================================
// 7. SISTEM NOTIFIKASI PINTAR & FILTER (REAL-TIME)
// ==========================================
let lastNotifCount = 0;
let isNotifCleared = false;
let isNotifRead = false;
let currentNotifFilter = 'all'; // Default tab filter

window.renderNotifications = () => {
    const notifList = document.getElementById('notifList');
    const notifBadge = document.getElementById('notifBadge');
    const emptyNotif = document.getElementById('emptyNotif');
    if (!notifList || !notifBadge || !emptyNotif) return;

    let notifications = [];
    const now = new Date();
    
    // Bikin string tanggal besok
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // 1. Cek Tugas H-1
    for (const courseName in taskDatabase) {
        (taskDatabase[courseName] || []).forEach(tsk => {
            if (tsk.deadline && tsk.deadline.startsWith(tomorrowStr)) {
                notifications.push({
                    type: 'tugas',
                    title: `Besok Deadline Tugas! <span style="font-size: 10px; background: #f43f5e; color: white; padding: 2px 6px; border-radius: 4px; margin-left: 4px; vertical-align: middle;">H-1</span>`,
                    desc: `Tugas <strong>"${tsk.title}"</strong> (${courseName}) harus dikumpulkan besok.`,
                    time: tsk.deadline.split('T')[1] + ' WIB',
                    icon: 'bx-alarm-exclamation', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)'
                });
            }
        });
    }

    // 2. Cek Acara Kalender Besok
    calendarEvents.forEach(ev => {
        if (ev.date === tomorrowStr) {
            notifications.push({
                type: 'acara',
                title: `Acara Kelas Besok`,
                desc: `Ada agenda <strong>"${ev.title}"</strong> besok hari.`,
                time: 'Cek Kalender',
                icon: 'bx-calendar-star', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)'
            });
        }
    });

    // 3. Cek Materi Baru
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    for (const courseName in moduleDatabase) {
        (moduleDatabase[courseName] || []).forEach(mod => {
            if (mod.createdAt) {
                const modDate = new Date(mod.createdAt);
                if (modDate > twentyFourHoursAgo) {
                    notifications.push({
                        type: 'materi',
                        title: `Materi Baru Diunggah`,
                        desc: `Materi <strong>"${mod.title}"</strong> pada matkul ${courseName}.`,
                        time: 'Baru saja',
                        icon: 'bx-book-add', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)'
                    });
                }
            }
        });
    }

    // Atur logic Badge Merah (Dihitung dari total semua notif, BUKAN yang terfilter)
    if (notifications.length !== lastNotifCount) {
        isNotifCleared = false;
        isNotifRead = false;
        lastNotifCount = notifications.length;
    }

    if (notifications.length > 0 && !isNotifCleared && !isNotifRead) {
        notifBadge.style.display = 'flex';
        notifBadge.innerText = notifications.length;
    } else {
        notifBadge.style.display = 'none';
    }

    // TERAPKAN FILTER SEBELUM RENDER
    let filteredNotifications = notifications;
    if (currentNotifFilter !== 'all') {
        filteredNotifications = notifications.filter(n => n.type === currentNotifFilter);
    }

    // Render HTML Notifikasi
    if (filteredNotifications.length > 0 && !isNotifCleared) {
        notifList.innerHTML = '';
        filteredNotifications.forEach(notif => {
            let readBg = isNotifRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)';
            notifList.innerHTML += `
            <div class="notif-item" style="display: flex; gap: 12px; padding: 16px; border-bottom: 1px solid var(--border); cursor: pointer; background: ${readBg};">
                <div style="width: 40px; height: 40px; border-radius: 12px; background: ${notif.bg}; color: ${notif.color}; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;"><i class='bx ${notif.icon}'></i></div>
                <div>
                    <h5 style="font-size: 14px; font-weight: 700; margin-bottom: 4px; color: var(--text-main);">${notif.title}</h5>
                    <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px; line-height: 1.5;">${notif.desc}</p>
                    <small style="font-size: 11px; color: #3b82f6; font-weight: 600;">${notif.time}</small>
                </div>
            </div>`;
        });
        notifList.style.display = 'block';
        emptyNotif.style.display = 'none';
        
    } else {
        notifList.innerHTML = '';
        notifList.style.display = 'none';
        emptyNotif.style.display = 'block';
        
        // Ubah teks peringatan jika filter kosong vs kalau memang tidak ada notif sama sekali
        if (notifications.length > 0 && !isNotifCleared) {
            emptyNotif.querySelector('h5').innerText = "Tidak ada notifikasi di sini";
            emptyNotif.querySelector('p').innerText = "Pilih kategori filter lain di atas.";
        } else {
            emptyNotif.querySelector('h5').innerText = "Tidak ada notifikasi";
            emptyNotif.querySelector('p').innerText = "Semua info terbaru akan muncul di sini.";
        }
    }
};

// ==========================================
// 8. EVENT LISTENER UI NOTIFIKASI
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const notifToggleBtn = document.getElementById('notifToggleBtn');
    const notifDropdown = document.getElementById('notifDropdown');
    const notifWrapper = document.getElementById('notifWrapper');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const clearNotifBtn = document.getElementById('clearNotifBtn');
    const filterBtns = document.querySelectorAll('.notif-filter-btn');

    // Buka/Tutup Modal Notifikasi
    if (notifToggleBtn) {
        notifToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.style.display = (notifDropdown.style.display === 'none' || notifDropdown.style.display === '') ? 'block' : 'none';
        });
    }

    // Tutup saat klik luar
    document.addEventListener('click', (e) => {
        if (notifWrapper && !notifWrapper.contains(e.target)) {
            if (notifDropdown) notifDropdown.style.display = 'none';
        }
    });

    // Tandai Dibaca
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isNotifRead = true;
            window.renderNotifications();
        });
    }

    // Hapus Semua
    if (clearNotifBtn) {
        clearNotifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isNotifCleared = true;
            window.renderNotifications();
        });
    }

    // Fungsi Klik Filter
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Biar dropdown tidak tertutup saat pindah tab
            
            // Reset gaya semua tombol filter
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = 'var(--text-muted)';
                b.style.borderColor = 'var(--border)';
            });
            
            // Beri gaya aktif pada tombol yang ditekan
            btn.classList.add('active');
            btn.style.background = 'var(--primary)';
            btn.style.color = 'white';
            btn.style.borderColor = 'var(--primary)';
            
            // Terapkan filter dan render ulang
            currentNotifFilter = btn.getAttribute('data-filter');
            window.renderNotifications();
        });
    });
});

// ==========================================
// 9. FITUR PENCARIAN PINTAR (GLOBAL SEARCH)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('globalSearchInput');
    const searchDropdown = document.getElementById('searchDropdown');

    if (searchInput && searchDropdown) {
        searchInput.addEventListener('input', function() {
            const keyword = this.value.toLowerCase().trim();
            
            // Sembunyikan jika ketikan kurang dari 2 huruf
            if (keyword.length < 2) {
                searchDropdown.style.display = 'none';
                return;
            }

            let results = [];

            // A. Cari Materi / Modul Baru
            for (const courseName in moduleDatabase) {
                (moduleDatabase[courseName] || []).forEach(mod => {
                    if (mod.title.toLowerCase().includes(keyword) || (mod.fileName && mod.fileName.toLowerCase().includes(keyword))) {
                        results.push({
                            type: 'Materi', icon: 'bx-book-open', color: '#10b981',
                            title: mod.title, subtitle: courseName,
                            action: () => {
                                document.getElementById('nav-modul').click();
                                openCourse(courseName);
                                const btnTab = document.querySelector('button[onclick*="materi"]');
                                if(btnTab) switchCourseTab('materi', btnTab);
                            }
                        });
                    }
                });
            }

            // B. Cari Tugas
            for (const courseName in taskDatabase) {
                (taskDatabase[courseName] || []).forEach(tsk => {
                    if (tsk.title.toLowerCase().includes(keyword) || (tsk.desc && tsk.desc.toLowerCase().includes(keyword))) {
                        results.push({
                            type: 'Tugas', icon: 'bx-task', color: '#f59e0b',
                            title: tsk.title, subtitle: courseName,
                            action: () => {
                                document.getElementById('nav-modul').click();
                                openCourse(courseName);
                                const btnTab = document.querySelector('button[onclick*="tugas"]');
                                if(btnTab) switchCourseTab('tugas', btnTab);
                            }
                        });
                    }
                });
            }

            // C. Cari Jadwal Matkul & Ruangan
            for (const courseName in courseMeta) {
                const jadwalStr = courseMeta[courseName].jadwal;
                if (jadwalStr.toLowerCase().includes(keyword) || courseName.toLowerCase().includes(keyword)) {
                    results.push({
                        type: 'Jadwal', icon: 'bx-time-five', color: '#8b5cf6',
                        title: courseName, subtitle: jadwalStr,
                        action: () => {
                            document.getElementById('nav-jadwal').click();
                        }
                    });
                }
            }

            // D. Cari Acara Kalender & Hari Libur
            calendarEvents.forEach(ev => {
                const d = new Date(ev.date);
                const dateStrFormatted = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                if (ev.title.toLowerCase().includes(keyword) || dateStrFormatted.toLowerCase().includes(keyword)) {
                    results.push({
                        type: 'Acara Kalender', icon: 'bx-calendar-star', color: '#3b82f6',
                        title: ev.title, subtitle: dateStrFormatted,
                        action: () => {
                            document.getElementById('nav-kalender').click();
                            // Otomatis ubah halaman kalender ke bulan acara tersebut
                            currentMonth = d.getMonth();
                            currentYear = d.getFullYear();
                            renderCalendar();
                        }
                    });
                }
            });

            // Tampilkan ke layar
            if (results.length > 0) {
                searchDropdown.innerHTML = '';
                // Batasi hanya menampilkan 8 hasil teratas agar tidak kepanjangan
                results.slice(0, 8).forEach(res => {
                    const item = document.createElement('div');
                    item.style.cssText = `display: flex; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s; align-items: center;`;
                    item.innerHTML = `
                        <div style="width: 36px; height: 36px; border-radius: 10px; background: ${res.color}15; color: ${res.color}; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;"><i class='bx ${res.icon}'></i></div>
                        <div style="flex: 1; min-width: 0;">
                            <h5 style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${res.title}</h5>
                            <small style="font-size: 11px; font-weight: 600; color: var(--text-muted); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${res.type} • ${res.subtitle}</small>
                        </div>
                    `;
                    // Efek Hover
                    item.addEventListener('mouseenter', () => item.style.background = 'var(--surface-hover)');
                    item.addEventListener('mouseleave', () => item.style.background = 'transparent');
                    
                    // Aksi saat diklik
                    item.addEventListener('click', () => {
                        searchDropdown.style.display = 'none';
                        searchInput.value = ''; // Bersihkan input
                        res.action(); // Panggil fungsi navigasi
                    });
                    
                    searchDropdown.appendChild(item);
                });
                searchDropdown.style.display = 'block';
            } else {
                searchDropdown.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px; font-weight: 600;"><i class='bx bx-search-alt' style="font-size: 32px; opacity: 0.5; display: block; margin-bottom: 8px;"></i>Tidak ada hasil untuk "${this.value}"</div>`;
                searchDropdown.style.display = 'block';
            }
        });

        // Sembunyikan Dropdown jika user klik area kosong di luar kotak pencarian
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.header-search')) {
                searchDropdown.style.display = 'none';
            }
        });
    }
});

// ==========================================
// 10. FITUR PENGELUARAN KAS
// ==========================================
window.openAddExpenseModal = () => document.getElementById('addExpenseModal').classList.add('active');
window.closeAddExpenseModal = () => {
    document.getElementById('addExpenseModal').classList.remove('active');
    document.getElementById('addExpenseForm').reset();
};

window.renderKasHistory = () => {
    const listContainer = document.getElementById('kas-history-list');
    const badge = document.getElementById('totalPengeluaranBadge');
    if (!listContainer || !badge) return;

    let html = '';
    let totalPengeluaran = 0;

    kasHistory.forEach(item => {
        totalPengeluaran += parseInt(item.amount);
        const amountStr = "Rp " + parseInt(item.amount).toLocaleString('id-ID');
        
        // Buat inisial ikon fallback jika tidak ada ikon khusus
        const iconHTML = item.icon 
            ? `<i class='bx ${item.icon}'></i>` 
            : `<i class='bx bx-cart'></i>`;

        html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--border);">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="avatar" style="width: 40px; height: 40px; background: rgba(244, 63, 94, 0.1); color: #f43f5e; box-shadow: none; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                    ${iconHTML}
                </div>
                <div>
                    <h5 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">${item.title}</h5>
                    <small style="color: var(--text-muted); font-weight: 500;">${item.desc}</small>
                </div>
            </div>
            <div style="text-align: right;">
                <h5 style="font-size: 14px; font-weight: 800; color: #f43f5e;">- ${amountStr}</h5>
            </div>
        </div>`;
    });

    if (kasHistory.length === 0) {
        html = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px; font-weight: 600;">Belum ada catatan pengeluaran.</div>`;
    }

    listContainer.innerHTML = html;
    badge.innerText = "Total: Rp " + totalPengeluaran.toLocaleString('id-ID');

    // Tampilkan / Sembunyikan Tombol Tambah Pengeluaran berdasarkan Role
    const btnAdd = document.getElementById('btnTambahPengeluaran');
    const roleSekarang = localStorage.getItem('user_role');
    const bendaharaAktif = localStorage.getItem('user_role') === 'bendahara';
    if (btnAdd) {
        btnAdd.style.display = (roleSekarang === 'admin' || bendaharaAktif) ? 'inline-flex' : 'none';
    }
};

// Event Simpan Pengeluaran
const addExpenseForm = document.getElementById('addExpenseForm');
if (addExpenseForm) {
    addExpenseForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const jenis = document.getElementById('expJenis').value;
        const pic = document.getElementById('expPIC').value;
        const total = parseInt(document.getElementById('expTotal').value);

        const now = new Date();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        const bulanTahun = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

        const newItem = {
            title: jenis,
            desc: `${bulanTahun} • PIC: ${pic}`,
            amount: total,
            icon: 'bx-cart' // Ikon keranjang otomatis
        };

        // Memasukkan pengeluaran baru di urutan paling atas (terbaru)
        kasHistory.unshift(newItem); 

        window.closeAddExpenseModal();
        await updateCloudData('kas_history', kasHistory, `Pengeluaran Kas: ${jenis} (-Rp ${total.toLocaleString('id-ID')})`);
    });
}

// ==========================================
// 11. SISTEM SUARA MAHASISWA & TANGGAPAN
// ==========================================

// Render Tampilan List Feedback
window.renderFeedbacks = () => {
    const container = document.getElementById('feedbackListContainer');
    if (!container) return;

    if (feedbackDatabase.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><i class='bx bx-message-rounded-check' style="font-size: 48px; opacity: 0.5; margin-bottom: 12px; display: block;"></i><h4 style="font-size: 15px; font-weight: 700;">Belum ada laporan</h4><p style="font-size: 13px;">Jadilah yang pertama memberikan masukan!</p></div>`;
        return;
    }

    let html = '';
    const isAdmin = localStorage.getItem('user_role') === 'admin';

    // Looping dari belakang agar yang terbaru di atas
    [...feedbackDatabase].reverse().forEach(fb => {
        let badgeBg, badgeCol;
        if (fb.kategori === 'Bug') { badgeBg = 'rgba(244,63,94,0.1)'; badgeCol = '#f43f5e'; }
        else if (fb.kategori === 'Fitur') { badgeBg = 'rgba(16,185,129,0.1)'; badgeCol = '#10b981'; }
        else { badgeBg = 'rgba(59,130,246,0.1)'; badgeCol = '#3b82f6'; }

        let statusBadge = fb.reply 
            ? `<span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: #10b981; color: white;"><i class='bx bx-check-double'></i> Ditanggapi</span>`
            : `<span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: #f59e0b; color: white;"><i class='bx bx-time-five'></i> Menunggu</span>`;

        let adminReplyBlock = '';
        if (fb.reply) {
            // Blok jika sudah dibalas oleh admin (warna agak indigo)
            adminReplyBlock = `
            <div style="margin-top: 12px; padding: 12px; background: rgba(99, 102, 241, 0.08); border-left: 3px solid var(--primary); border-radius: 0 8px 8px 0;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                    <i class='bx bxs-badge-check' style="color: var(--primary); font-size: 16px;"></i>
                    <span style="font-size: 12px; font-weight: 800; color: var(--primary);">Developer (Abing)</span>
                </div>
                <p style="font-size: 13px; color: var(--text-main); line-height: 1.5; white-space: pre-wrap;">${fb.reply}</p>
            </div>`;
        }

        let adminActionBtn = '';
        if (isAdmin) {
            let btnText = fb.reply ? 'Edit Balasan' : 'Balas Laporan';
            adminActionBtn = `
            <div style="margin-top: 12px; border-top: 1px dashed var(--border); padding-top: 12px; text-align: right;">
                <button class="btn btn-outline" style="font-size: 11px; padding: 6px 12px;" onclick="balasFeedback('${fb.id}')">
                    <i class='bx bx-reply'></i> ${btnText}
                </button>
            </div>`;
        }

        html += `
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--bg-color); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--text-main);">${fb.sender.charAt(0).toUpperCase()}</div>
                    <div>
                        <h4 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">${fb.sender}</h4>
                        <small style="font-size: 11px; color: var(--text-muted);">${fb.waktu}</small>
                    </div>
                </div>
                <div style="display: flex; gap: 6px; align-items: center;">
                    <span style="font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; background: ${badgeBg}; color: ${badgeCol};">${fb.kategori}</span>
                    ${statusBadge}
                </div>
            </div>
            
            <p style="font-size: 13px; color: var(--text-main); line-height: 1.6; white-space: pre-wrap; background: var(--bg-color); padding: 12px; border-radius: 8px;">${fb.pesan}</p>
            
            ${adminReplyBlock}
            ${adminActionBtn}
        </div>`;
    });

    container.innerHTML = html;
};

// Event Submit Form Laporan Mahasiswa
const formFeedback = document.getElementById('formFeedback');
if (formFeedback) {
    formFeedback.addEventListener('submit', async function(e) {
        e.preventDefault();
        const kategori = document.getElementById('fbKategori').value;
        const pesan = document.getElementById('fbPesan').value;
        
        const namaSekarang = localStorage.getItem('user_name') || 'Anggota Kelas';
        const now = new Date();
        const waktuStr = `${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

        const newFeedback = {
            id: 'FB' + Date.now(), // Bikin ID unik
            sender: namaSekarang,
            kategori: kategori,
            pesan: pesan,
            waktu: waktuStr,
            reply: null // Belum ada balasan admin
        };

        feedbackDatabase.push(newFeedback);
        
        document.getElementById('formFeedback').reset();
        await updateCloudData('feedbacks', feedbackDatabase, `Laporan Baru: ${kategori} oleh ${namaSekarang}`);
        alert("Terima kasih! Laporan kamu sudah masuk ke sistem dan akan segera dibaca oleh Developer.");
    });
}

// Fungsi Admin untuk Membalas Laporan
window.balasFeedback = async (id) => {
    const index = feedbackDatabase.findIndex(f => f.id === id);
    if (index > -1) {
        let balasanLama = feedbackDatabase[index].reply || "";
        let balasanBaru = prompt(`Tulis balasan untuk laporan dari ${feedbackDatabase[index].sender}:`, balasanLama);
        
        if (balasanBaru !== null && balasanBaru.trim() !== "") {
            feedbackDatabase[index].reply = balasanBaru;
            await updateCloudData('feedbacks', feedbackDatabase, "Developer (Abing) menanggapi laporan.");
        }
    }
};