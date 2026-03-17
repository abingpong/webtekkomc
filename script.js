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
fetch("/api/verify",{
method:"GET",
headers:{
Authorization:"Bearer "+token
}
});

const userRole = localStorage.getItem("user_role");
const userName = localStorage.getItem("user_name") || "Mahasiswa";
const userNRP = localStorage.getItem("user_nrp") || "Mahasiswa";

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
            { nama: "Fernando Brillian Arisando", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Dzaka Zidane Atha Ariq Sasmita", status: [1, 1, 1, 1, 1, "libur", 1] }, { nama: "Mishbahul Ayubi", status: [1, 1, 1, 0, 0, "libur", 0] }, { nama: "Meyco Neyla Pristya Ramadhani", status: [1, 1, 1, 1, 1, "libur", 1] }, { nama: "Muhammad Adhitya Ramadhani", status: [1, 1, 1, 0, 0, "libur", 0] }, { nama: "Risnan Ahmad Januar", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Varel Bambang Mirzandi", status: [1, 1, 1, 1, 1, "libur", 1] }, { nama: "Aqil Nawawi", status: [1, 1, 1, 1, 0, "libur", 0] }, { nama: "Rizko Prima Arfianto", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Muhammad Ihsan Rijadin", status: [1, 1, 1, 0, 0, "libur", 0] }, { nama: "Bima Aji Ramadhan Bayu Susanto", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Moh. Rizaldy Firmansyah", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Muhamad Izzat Zaidan", status: [1, 1, 1, 0, 0, "libur", 0] }, { nama: "Adrian Dwi Firmansyah", status: [1, 1, 0, 0, 0, "libur", 0] }, { nama: "Nafis Ubaidillah", status: [1, 1, 1, 1, 1, "libur", 1] }, { nama: "Khairu Farhan Ramadhan", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "M. Amir Aisy Wijaya", status: [1, 1, 1, 0, 0, "libur", 0] }, { nama: "Mohammad Pujangga Gunawan", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Muhammad Nabil Syah Putra", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Aditya Wahyu Anggara", status: [1, 1, 1, 0, 0, "libur", 0] }, { nama: "Nadira Farah Parawansa", status: [1, 1, 1, 1, 0, "libur", 0] }, { nama: "Tasya Aulia Nabila", status: [1, 1, 1, 1, 1, "libur", 1] }, { nama: "Ridho Trifianto Putra", status: [1, 1, 1, 0, 0, "libur", 0] }, { nama: "Dimas Dharma Wijaya", status: [1, 1, 0, 0, 0, "libur", 0] }, { nama: "Faizar Ariq Setyawan", status: [1, 0, 0, 0, 0, "libur", 0] }, { nama: "Hafidz Abdurrahman Assiddiqie", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Mohammad Rafi Raissandi", status: [1, 1, 1, 1, 1, "libur", 0] }, { nama: "Dhiaz Nabihan Mahran", status: [1, 1, 1, 0, 0, "libur", 0] }
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
        
        // VALIDASI: pastikan course aktif sebelum menambah tugas (fix untuk kasus push ke key "")
        if (!currentActiveCourse) {
            alert("❌ Pilih mata kuliah terlebih dahulu sebelum menambahkan tugas.");
            // Tutup modal dan reset form agar user memilih course dulu
            window.closeAddTugasModal();
            document.getElementById('addTugasForm').reset();
            return;
        }
        
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
        // Force re-render lokal segera setelah update (mengurangi ketergantungan pada snapshot latency)
        if (typeof renderTasks === 'function') renderTasks();
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
        if (!tsk.deadline) return true; // jika tidak ada deadline, biarkan
        const deadlineDate = new Date(tsk.deadline);
        // pastikan deadline berlaku sampai akhir hari itu (23:59:59.999)
        deadlineDate.setHours(23,59,59,999);
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
        let tglMerapikan = tsk.deadline ? tsk.deadline.replace('T', ' Jam ') : 'Tanpa Deadline';
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

// ... kode lainnya tetap sama (renderCalendar, renderKas, renderTabelMingguan, renderKasAnda, renderDashboardWidgets, renderNotifications, event listeners, dsb)
// (Saya tidak mengubah bagian lain yang tidak error — jika ingin saya sertakan seluruh file tanpa potongan, beri tahu; saat ini saya mempertahankan struktur Anda dan hanya menerapkan perbaikan minimal.)