import {
    collection,
    addDoc,
    serverTimestamp,
    getDocs,
    query,
    orderBy,
    deleteDoc,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

$(document).ready(function () {

    // ==============================
    // URL DOMAIN CONFIG
    // ==============================
    let url_domain = "http://127.0.0.1:5500/";

    // ==============================
    // MENU TOGGLE
    // ==============================
    $("#menu-toggle").click(function(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");

        const menuIcon = $(this).find('i');
        if ($("#wrapper").hasClass("toggled")) {
            menuIcon.removeClass("ri-menu-fold-fill").addClass("ri-menu-unfold-fill");
        } else {
            menuIcon.removeClass("ri-menu-unfold-fill").addClass("ri-menu-fold-fill");
        }
    });


    // ==============================
    // EDITOR (still fine)
    // ==============================
    tinymce.init({
        selector: '#descInput',
        toolbar: 'bold italic underline | bullist numlist | h1 h2 h3 | hr | alignleft aligncenter alignright alignjustify ',
        menubar: false,
        license_key: 'gpl',
        statusbar: false,
        branding: false,
        height: 200,
        toolbar_mode: 'sliding',
    });


    // ==============================
    // ✅ ADMIN ADD GUEST
    // ==============================

    const ADMIN_KEY = "F4uziGant3n9";

    let allGuests = [];      // Semua data dari Firestore
    let filteredGuests = []; // Data setelah filter search
    let currentPage = 1;
    const perPage = 10;

    $("#qrForm").on("submit", async function (e) {
        e.preventDefault();

        // ✅ Ambil lewat name bukan placeholder/id
        const guestName  = $('[name="guestName"]').val().trim();
        const maxGuests  = Number($('[name="guestCount"]').val());
        const phone      = $('[name="guestPhone"]').val().trim();

        const source     = $('[name="guestSource"]').val();
        const sourceNote = $('[name="guestSourceNote"]').val().trim();

        // ✅ Validasi
        if (!guestName)  return alert("Nama tamu wajib diisi");
        if (!maxGuests || maxGuests < 1) return alert("Jumlah minimal 1");
        if (!phone)      return alert("Nomor HP wajib diisi");

        const payload = {
            name: guestName,
            phone: phone,
            maxGuests: maxGuests,

            source: source || "",
            sourceName: sourceNote || "",

            opened: false,
            openCount: 0,
            rsvpStatus: "",
            rsvpCount: 0,

            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),

            // ✅ HARUS ADA supaya lolos rules
            adminKey: ADMIN_KEY
        };

        try {
            await addDoc(collection(window.db, "guest"), payload);
            Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: "Tamu berhasil dibuat!",
                timer: 1500,
                showConfirmButton: false
            });       

            // ✅ Reset form properly
            $('[name="guestName"]').val("");
            $('[name="guestCount"]').val(1);
            $('[name="guestPhone"]').val("");
            $('[name="guestSource"]').val("");
            $('[name="guestSourceNote"]').val("");

        } catch (err) {
            console.error(err);
            alert("❌ Gagal membuat tamu");
        }
    });

    // Ambil halaman
    function getPagedData() {
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        return filteredGuests.slice(start, end);
    }

    // Render pagination Bootstrap
    function renderPagination() {
        const totalPages = Math.ceil(filteredGuests.length / perPage);
        const pag = $("#paginationGuest");
        pag.empty();

        if (totalPages <= 1) return;

        // Helper
        const li = (disabled, active, page, label) => `
            <li class="page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}">
                <a class="page-link" href="javascript:;" data-page="${page}">${label}</a>
            </li>`;

        // << First Page
        pag.append(li(currentPage === 1, false, 1, "&laquo;"));

        // Dynamic page numbers
        const maxButtons = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxButtons - 1);

        if (end - start < maxButtons - 1) {
            start = Math.max(1, end - maxButtons + 1);
        }

        if (start > 1) {
            pag.append(li(false, false, 1, "1"));
            pag.append(`<li class="page-item disabled"><span class="page-link">...</span></li>`);
        }

        for (let i = start; i <= end; i++) {
            pag.append(li(false, currentPage === i, i, i));
        }

        if (end < totalPages) {
            pag.append(`<li class="page-item disabled"><span class="page-link">...</span></li>`);
            pag.append(li(false, false, totalPages, totalPages));
        }

        // >> Last Page
        pag.append(li(currentPage === totalPages, false, totalPages, "&raquo;"));
    }

    // Helper: Format timestamp
    function formatDate(timestamp) {
        if (!timestamp) return "-";
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return "-";
        }
    }

    // Render tabel
    function renderGuestTable(list) {
        const tbody = $("#guestTableBody");
        tbody.empty();

        if (!list.length) {
            tbody.html(`<tr><td colspan="7" class="text-center text-muted">Tidak ada data.</td></tr>`);
            return;
        }

        list.forEach(doc => {
            const d = doc.data;
            
            // Main row
            tbody.append(`
                <tr class="guest-row" data-id="${doc.id}">
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-secondary toggleDetail" data-id="${doc.id}" title="Lihat Detail">
                            <i class="ri-arrow-down-s-line"></i>
                        </button>
                    </td>
                    <td>${d.name || "-"}</td>
                    <td>${d.maxGuests || 0} Tamu</td>
                    <td>${d.phone || "-"}</td>
                    <td>${d.source || "-"}</td>
                    <td>${d.sourceName || "-"}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-success copyLink" data-id="${doc.id}" title="Copy Link">
                            <i class="ri-link"></i>
                        </button>
                        <button class="btn btn-sm btn-primary editGuest" data-id="${doc.id}">
                            <i class="ri-edit-line"></i>
                        </button>
                        <button class="btn btn-sm btn-danger deleteGuest" data-id="${doc.id}">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </td>
                </tr>
            `);

            // Detail row (hidden by default)
            tbody.append(`
                <tr class="detail-row" id="detail-${doc.id}" style="display: none;">
                    <td colspan="7" class="p-0">
                        <div class="detail-content bg-light p-3">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6 class="mb-3"><i class="ri-information-line"></i> Informasi Dasar</h6>
                                    <table class="table table-sm table-borderless">
                                        <tr>
                                            <td width="40%"><strong>ID Guest:</strong></td>
                                            <td><code>${doc.id}</code></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Nama:</strong></td>
                                            <td>${d.name || "-"}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>No. HP:</strong></td>
                                            <td>${d.phone || "-"}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Max Tamu:</strong></td>
                                            <td>${d.maxGuests || 0} orang</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Sumber:</strong></td>
                                            <td>${d.source || "-"}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Nama Sumber:</strong></td>
                                            <td>${d.sourceName || "-"}</td>
                                        </tr>
                                    </table>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="mb-3"><i class="ri-calendar-check-line"></i> Status & Aktivitas</h6>
                                    <table class="table table-sm table-borderless">
                                        <tr>
                                            <td width="40%"><strong>Status Buka:</strong></td>
                                            <td>
                                                ${d.opened 
                                                    ? '<span class="badge bg-success">Sudah Dibuka</span>' 
                                                    : '<span class="badge bg-secondary">Belum Dibuka</span>'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Jumlah Buka:</strong></td>
                                            <td>${d.openCount || 0}x</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Pertama Dibuka:</strong></td>
                                            <td>${formatDate(d.openedAt)}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Terakhir Dibuka:</strong></td>
                                            <td>${formatDate(d.lastOpenedAt)}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Device Type:</strong></td>
                                            <td>${d.deviceType || "-"}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Status RSVP:</strong></td>
                                            <td>
                                                ${d.rsvpStatus === "yes" 
                                                    ? '<span class="badge bg-success">Hadir</span>' 
                                                    : d.rsvpStatus === "no" 
                                                    ? '<span class="badge bg-danger">Tidak Hadir</span>' 
                                                    : '<span class="badge bg-secondary">Belum Konfirmasi</span>'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Jumlah RSVP:</strong></td>
                                            <td>${d.rsvpCount || 0} orang</td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                            <div class="row mt-2">
                                <div class="col-12">
                                    <h6 class="mb-2"><i class="ri-time-line"></i> Timestamp</h6>
                                    <table class="table table-sm table-borderless">
                                        <tr>
                                            <td width="20%"><strong>Dibuat:</strong></td>
                                            <td>${formatDate(d.createdAt)}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Diupdate:</strong></td>
                                            <td>${formatDate(d.updatedAt)}</td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            `);
        });
    }



    // Load from Firestore
    async function loadGuestList() {
        const tbody = $("#guestTableBody");
        tbody.html(`<tr><td colspan="6" class="text-center text-muted">Loading...</td></tr>`);

        try {
            const q = query(collection(window.db, "guest"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);

            allGuests = [];
            snap.forEach(doc => {
                allGuests.push({ id: doc.id, data: doc.data() });
            });

            filteredGuests = [...allGuests];

            currentPage = 1;

            renderGuestTable(getPagedData());
            renderPagination();
        } catch (err) {
            console.error("❌ Error load guest list:", err);
            tbody.html(`<tr><td colspan="6" class="text-danger text-center">Gagal memuat data.</td></tr>`);
        }
    }


    // Handle click pagination
    $(document).on("click", "#paginationGuest .page-link", function () {
        const page = $(this).data("page");
        if (!page || page < 1) return;

        currentPage = page;

        renderGuestTable(getPagedData());
        renderPagination();
    });

    // Search
    $("#searchGuest").on("input", function () {
        const keyword = $(this).val().toLowerCase();

        filteredGuests = allGuests.filter(d =>
            d.data.name.toLowerCase().includes(keyword)
        );

        currentPage = 1;
        renderGuestTable(getPagedData());
        renderPagination();
    });
        



    // ✅ Panggil saat tab List Undangan dibuka
    $('button[data-bs-target="#listUndangan"]').on("click", function () {
        loadGuestList();
    });

    // ✅ Load pertama kali saat page open
    loadGuestList();


    // ==============================
    // ✅ TOGGLE DETAIL ROW
    // ==============================
    $(document).on("click", ".toggleDetail", function () {
        const id = $(this).data("id");
        const detailRow = $(`#detail-${id}`);
        const icon = $(this).find("i");

        if (detailRow.is(":visible")) {
            detailRow.slideUp(200);
            icon.removeClass("ri-arrow-up-s-line").addClass("ri-arrow-down-s-line");
        } else {
            detailRow.slideDown(200);
            icon.removeClass("ri-arrow-down-s-line").addClass("ri-arrow-up-s-line");
        }
    });


    // ==============================
    // ✅ COPY LINK GUEST
    // ==============================
    $(document).on("click", ".copyLink", function () {
        const id = $(this).data("id");
        const guestLink = `${url_domain}?g=${id}`;

        // Copy to clipboard
        navigator.clipboard.writeText(guestLink).then(() => {
            Swal.fire({
                icon: "success",
                title: "Link Tersalin!",
                text: guestLink,
                timer: 2000,
                showConfirmButton: false
            });
        }).catch(err => {
            console.error("Failed to copy:", err);
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: "Tidak dapat menyalin link."
            });
        });
    });

    $(document).on("click", ".deleteGuest", async function () {
        const id = $(this).data("id");

        Swal.fire({
            title: "Hapus Tamu?",
            text: "Data ini akan hilang permanen.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Hapus",
            cancelButtonText: "Batal"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteDoc(doc(window.db, "guest", id));

                    Swal.fire({
                        icon: "success",
                        title: "Dihapus!",
                        text: "Tamu berhasil dihapus.",
                        timer: 1500,
                        showConfirmButton: false
                    });

                    loadGuestList();
                } catch (err) {
                    console.error(err);
                    Swal.fire({
                        icon: "error",
                        title: "Gagal",
                        text: "Tidak dapat menghapus tamu."
                    });
                }
            }
        });
    });

    $(document).on("click", ".editGuest", function () {
        const id = $(this).data("id");
        const row = $(`tr[data-id="${id}"]`);

        $('input[name="editGuestId"]').val(id);
        $('input[name="editGuestName"]').val(row.find("td").eq(0).text());
        $('input[name="editGuestCount"]').val(parseInt(row.find("td").eq(1).text()));
        $('input[name="editGuestPhone"]').val(row.find("td").eq(2).text());
        $('select[name="editGuestSource"]').val(row.find("td").eq(3).text());
        $('input[name="editGuestSourceNote"]').val(row.find("td").eq(4).text());

        const modal = new bootstrap.Modal(document.getElementById("editGuestModal"));
        modal.show();
    });

    $("#saveEditGuest").on("click", async function () {
        const id = $('input[name="editGuestId"]').val();

        const payload = {
            name: $('input[name="editGuestName"]').val().trim(),
            maxGuests: Number($('input[name="editGuestCount"]').val()),
            phone: $('input[name="editGuestPhone"]').val().trim(),
            source: $('select[name="editGuestSource"]').val(),
            sourceName: $('input[name="editGuestSourceNote"]').val().trim(),
            updatedAt: serverTimestamp(),
            adminKey: ADMIN_KEY
        };

        if (!payload.name || !payload.maxGuests || !payload.phone) {
            Swal.fire({
                icon: "warning",
                title: "Data belum lengkap",
                text: "Mohon lengkapi semua field wajib."
            });
            return;
        }

        try {
            await updateDoc(doc(window.db, "guest", id), payload);

            Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: "Perubahan tamu berhasil disimpan.",
                timer: 1500,
                showConfirmButton: false
            });

            const modalEl = document.getElementById("editGuestModal");
            bootstrap.Modal.getInstance(modalEl).hide();

            loadGuestList();

        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: "Perubahan tidak dapat disimpan."
            });
        }
    });


});
