import {
    collection,
    addDoc,
    serverTimestamp,
    getDocs,
    query,
    orderBy,
    deleteDoc,
    doc,
    updateDoc,
    getDoc,
    setDoc
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
    // INVITATION TEMPLATE EDITOR
    // ==============================
    tinymce.init({
        selector: '#invitationTemplate',
        toolbar: 'bold italic underline | bullist numlist | alignleft aligncenter alignright',
        menubar: false,
        license_key: 'gpl',
        statusbar: false,
        branding: false,
        height: 400,
        toolbar_mode: 'sliding',
        content_style: 'body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; }',
        setup: function(editor) {
            editor.on('init', function() {
                loadInvitationTemplate();
            });
        }
    });


    // ==============================
    // ✅ ADMIN ADD GUEST
    // ==============================

    const ADMIN_KEY = "F4uziGant3n9";

    let allGuests = [];      // Semua data dari Firestore
    let filteredGuests = []; // Data setelah filter search
    let currentPage = 1;
    const perPage = 10;

    // ==============================
    // ✅ NORMALIZE PHONE NUMBER
    // ==============================
    function normalizePhoneNumber(phone) {
        if (!phone) return "";

        // 1. Hapus semua karakter non-digit
        let normalized = phone.replace(/\D/g, '');

        // 2. Jika diawali 62, ubah jadi 0
        if (normalized.startsWith('62')) {
            normalized = '0' + normalized.substring(2);
        }

        // 3. Jika tidak diawali 0, tambahkan 0 di depan
        if (!normalized.startsWith('0')) {
            normalized = '0' + normalized;
        }

        console.log(`📱 Phone normalized: "${phone}" → "${normalized}"`);
        return normalized;
    }

    // ==============================
    // ✅ PHONE NUMBER PREVIEW (REAL-TIME)
    // ==============================
    let phonePreviewTimeout;
    
    $('[name="guestPhone"]').on("input", function() {
        const $input = $(this);
        const rawValue = $input.val();
        
        // Clear previous timeout
        clearTimeout(phonePreviewTimeout);
        
        // Show preview after user stops typing (500ms)
        phonePreviewTimeout = setTimeout(() => {
            if (rawValue.trim()) {
                const normalized = normalizePhoneNumber(rawValue);
                
                // Show preview di bawah input (jika berbeda)
                if (rawValue !== normalized) {
                    let $preview = $input.next('.phone-preview');
                    if (!$preview.length) {
                        $input.after('<small class="phone-preview text-muted d-block mt-1"></small>');
                        $preview = $input.next('.phone-preview');
                    }
                    $preview.html(`<i class="ri-information-line"></i> Akan disimpan sebagai: <strong>${normalized}</strong>`);
                } else {
                    $input.next('.phone-preview').remove();
                }
            } else {
                $input.next('.phone-preview').remove();
            }
        }, 500);
    });

    // Same untuk edit modal
    $('[name="editGuestPhone"]').on("input", function() {
        const $input = $(this);
        const rawValue = $input.val();
        
        clearTimeout(phonePreviewTimeout);
        
        phonePreviewTimeout = setTimeout(() => {
            if (rawValue.trim()) {
                const normalized = normalizePhoneNumber(rawValue);
                
                if (rawValue !== normalized) {
                    let $preview = $input.next('.phone-preview');
                    if (!$preview.length) {
                        $input.after('<small class="phone-preview text-muted d-block mt-1"></small>');
                        $preview = $input.next('.phone-preview');
                    }
                    $preview.html(`<i class="ri-information-line"></i> Akan disimpan sebagai: <strong>${normalized}</strong>`);
                } else {
                    $input.next('.phone-preview').remove();
                }
            } else {
                $input.next('.phone-preview').remove();
            }
        }, 500);
    });

    // ==============================
    // ✅ AUTO-CHANGE maxGuests SAAT ADA "&"
    // ==============================
    $('[name="guestName"]').on("input", function() {
        const name = $(this).val();
        const maxGuestsInput = $('[name="guestCount"]');
        const currentMax = Number(maxGuestsInput.val());

        // Jika ada "&" dan maxGuests masih 1, ubah jadi 2
        if (name.includes("&") && currentMax === 1) {
            maxGuestsInput.val(2);
            console.log('✅ Auto-changed maxGuests to 2 (detected "&")');
        }
    });

    // Same untuk edit modal
    $('[name="editGuestName"]').on("input", function() {
        const name = $(this).val();
        const maxGuestsInput = $('[name="editGuestCount"]');
        const currentMax = Number(maxGuestsInput.val());

        // Jika ada "&" dan maxGuests masih 1, ubah jadi 2
        if (name.includes("&") && currentMax === 1) {
            maxGuestsInput.val(2);
            console.log('✅ Auto-changed maxGuests to 2 (detected "&")');
        }
    });

    $("#qrForm").on("submit", async function (e) {
        e.preventDefault();

        // ✅ Ambil lewat name bukan placeholder/id
        const guestName  = $('[name="guestName"]').val().trim();
        const maxGuests  = Number($('[name="guestCount"]').val());
        const phoneRaw   = $('[name="guestPhone"]').val().trim();

        const source     = $('[name="guestSource"]').val();
        const sourceNote = $('[name="guestSourceNote"]').val().trim();
        const isVip      = $('[name="guestVip"]:checked').val() === "true";

        // ✅ Validasi
        if (!guestName)  return alert("Nama tamu wajib diisi");
        if (!maxGuests || maxGuests < 1) return alert("Jumlah minimal 1");
        if (!phoneRaw)   return alert("Nomor HP wajib diisi");

        // ✅ Normalize phone number
        const phone = normalizePhoneNumber(phoneRaw);

        const payload = {
            name: guestName,
            phone: phone,
            maxGuests: maxGuests,

            source: source || "",
            sourceName: sourceNote || "",
            isVip: isVip,

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
            $('[name="guestVip"][value="false"]').prop("checked", true);

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
            tbody.html(`<tr><td colspan="8" class="text-center text-muted">Tidak ada data.</td></tr>`);
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
                    <td>
                        ${d.opened 
                            ? '<span class="badge bg-success"><i class="ri-check-line"></i> Sudah</span>' 
                            : '<span class="badge bg-secondary"><i class="ri-close-line"></i> Belum</span>'}
                    </td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-success sendWhatsAppDirect" 
                                data-id="${doc.id}"
                                data-name="${d.name || ''}"
                                data-phone="${d.phone || ''}"
                                title="Kirim WhatsApp">
                            <i class="ri-whatsapp-line"></i>
                        </button>
                        <button class="btn btn-sm btn-primary copyLink" data-id="${doc.id}" title="Copy Link">
                            <i class="ri-link"></i>
                        </button>
                        <button class="btn btn-sm btn-info editGuest" 
                                data-id="${doc.id}"
                                data-name="${d.name || ''}"
                                data-maxguests="${d.maxGuests || 1}"
                                data-phone="${d.phone || ''}"
                                data-source="${d.source || ''}"
                                data-sourcename="${d.sourceName || ''}"
                                data-isvip="${d.isVip || false}">
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
                    <td colspan="8" class="p-0">
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
                                        <tr>
                                            <td><strong>Status VIP:</strong></td>
                                            <td>
                                                ${d.isVip 
                                                    ? '<span class="badge bg-warning text-dark"><i class="ri-vip-crown-fill"></i> VIP</span>' 
                                                    : '<span class="badge bg-secondary">Regular</span>'}
                                            </td>
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

                                    <h6 class="mb-3 mt-3"><i class="ri-whatsapp-line"></i> Tracking WhatsApp</h6>
                                    <table class="table table-sm table-borderless">
                                        <tr>
                                            <td width="40%"><strong>Terakhir Dikirim:</strong></td>
                                            <td>${formatDate(d.lastSent)}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Jumlah Kirim:</strong></td>
                                            <td>
                                                ${d.sendCount || 0}x
                                                ${d.sendCount > 0 
                                                    ? '<span class="badge bg-info ms-1">Sudah Dikirim</span>' 
                                                    : '<span class="badge bg-secondary ms-1">Belum Dikirim</span>'}
                                            </td>
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
        const $btn = $(this);
        const id = $btn.data("id");
        const name = $btn.data("name");
        const maxGuests = $btn.data("maxguests");
        const phone = $btn.data("phone");
        const source = $btn.data("source");
        const sourceName = $btn.data("sourcename");
        const isVip = $btn.data("isvip");

        // Populate form
        $('input[name="editGuestId"]').val(id);
        $('input[name="editGuestName"]').val(name);
        $('input[name="editGuestCount"]').val(maxGuests);
        $('input[name="editGuestPhone"]').val(phone);
        $('select[name="editGuestSource"]').val(source);
        $('input[name="editGuestSourceNote"]').val(sourceName);
        
        // Set VIP radio button
        if (isVip === true || isVip === "true") {
            $('input[name="editGuestVip"][value="true"]').prop("checked", true);
        } else {
            $('input[name="editGuestVip"][value="false"]').prop("checked", true);
        }

        console.log('📝 Edit guest data:', { id, name, maxGuests, phone, source, sourceName, isVip });

        const modal = new bootstrap.Modal(document.getElementById("editGuestModal"));
        modal.show();
    });

    $("#saveEditGuest").on("click", async function () {
        const id = $('input[name="editGuestId"]').val();

        const phoneRaw = $('input[name="editGuestPhone"]').val().trim();

        const payload = {
            name: $('input[name="editGuestName"]').val().trim(),
            maxGuests: Number($('input[name="editGuestCount"]').val()),
            phone: normalizePhoneNumber(phoneRaw),  // ✅ Normalize phone
            source: $('select[name="editGuestSource"]').val(),
            sourceName: $('input[name="editGuestSourceNote"]').val().trim(),
            isVip: $('input[name="editGuestVip"]:checked').val() === "true",
            updatedAt: serverTimestamp(),
            adminKey: ADMIN_KEY
        };

        if (!payload.name || !payload.maxGuests || !phoneRaw) {
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


    // ==============================
    // ✅ INVITATION TEMPLATE MANAGER
    // ==============================

    const TEMPLATE_DOC_ID = "lw0mWlwUYZW2iJ2hPaw1";
    const DEFAULT_TEMPLATE = `Kepada Yth. [Nama Tamu]

Assalamu'alaikum Warahmatullahi Wabarakatuh

Dengan memohon rahmat dan ridha Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami:

💍 Alfira & Fauzi
📅 Minggu, 23 November 2025

Detail acara dan konfirmasi kehadiran dapat diakses melalui tautan berikut:
🔗 [Link Undangan]

Merupakan kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Wassalamu'alaikum Warahmatullahi Wabarakatuh

Kami yang berbahagia,
Alfira & Fauzi`;

    // Load template dari Firestore
    async function loadInvitationTemplate() {
        try {
            const docRef = doc(window.db, "chatInvitation", TEMPLATE_DOC_ID);
            const docSnap = await getDoc(docRef);

            let template = DEFAULT_TEMPLATE;

            if (docSnap.exists()) {
                template = docSnap.data().template || DEFAULT_TEMPLATE;
                console.log('✅ Template loaded from Firestore');
            } else {
                // Document belum ada, gunakan default template
                console.log('⚠️ Template document belum ada, menggunakan default template');
                console.log('💡 Silakan simpan template untuk membuat document di Firestore');
                template = DEFAULT_TEMPLATE;
            }

            // Set ke TinyMCE
            if (tinymce.get('invitationTemplate')) {
                tinymce.get('invitationTemplate').setContent(template.replace(/\n/g, '<br>'));
            }

        } catch (err) {
            console.error('❌ Error loading template:', err);
            // Fallback ke default template
            if (tinymce.get('invitationTemplate')) {
                tinymce.get('invitationTemplate').setContent(DEFAULT_TEMPLATE.replace(/\n/g, '<br>'));
            }
        }
    }

    // Save template ke Firestore
    $("#invitationForm").on("submit", async function(e) {
        e.preventDefault();

        const editor = tinymce.get('invitationTemplate');
        if (!editor) return;

        // Get content dan convert <br> ke \n
        let template = editor.getContent({ format: 'text' });

        try {
            const docRef = doc(window.db, "chatInvitation", TEMPLATE_DOC_ID);
            await setDoc(docRef, {
                template: template,
                adminKey: ADMIN_KEY,  // ✅ Tambahkan adminKey untuk lolos rules
                updatedAt: serverTimestamp()
            });

            Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: "Template berhasil disimpan!",
                timer: 1500,
                showConfirmButton: false
            });

            console.log('✅ Template saved');
        } catch (err) {
            console.error('❌ Error saving template:', err);
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: "Gagal menyimpan template."
            });
        }
    });

    // Reset template ke default
    $("#resetTemplate").on("click", function() {
        Swal.fire({
            title: "Reset Template?",
            text: "Template akan dikembalikan ke default.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Ya, Reset",
            cancelButtonText: "Batal"
        }).then((result) => {
            if (result.isConfirmed) {
                const editor = tinymce.get('invitationTemplate');
                if (editor) {
                    editor.setContent(DEFAULT_TEMPLATE.replace(/\n/g, '<br>'));
                }
            }
        });
    });

    // Load guest list untuk preview
    async function loadGuestListForInvitation() {
        try {
            const q = query(collection(window.db, "guest"), orderBy("name", "asc"));
            const snap = await getDocs(q);

            const select = $("#previewGuestSelect");
            select.empty();
            select.append('<option value="">-- Pilih Tamu --</option>');

            snap.forEach(doc => {
                const data = doc.data();
                select.append(`<option value="${doc.id}" data-name="${data.name}" data-phone="${data.phone}">${data.name}</option>`);
            });

            console.log('✅ Guest list loaded for invitation');
        } catch (err) {
            console.error('❌ Error loading guest list:', err);
        }
    }

    // Preview message saat pilih tamu
    $("#previewGuestSelect").on("change", async function() {
        const selectedOption = $(this).find("option:selected");
        const guestId = $(this).val();
        const guestName = selectedOption.data("name");
        const guestPhone = selectedOption.data("phone");

        if (!guestId) {
            $("#previewPhone").val("");
            $("#previewMessage").text("Pilih tamu untuk melihat preview pesan...");
            $("#sendWhatsApp").prop("disabled", true);
            return;
        }

        $("#previewPhone").val(guestPhone);

        // Load template
        try {
            const docRef = doc(window.db, "chatInvitation", TEMPLATE_DOC_ID);
            const docSnap = await getDoc(docRef);

            let template = DEFAULT_TEMPLATE;
            if (docSnap.exists()) {
                template = docSnap.data().template || DEFAULT_TEMPLATE;
            }

            // Replace placeholders
            const guestLink = `${url_domain}?g=${guestId}`;
            const message = template
                .replace(/\[Nama Tamu\]/g, guestName)
                .replace(/\[Link Undangan\]/g, guestLink);

            $("#previewMessage").text(message);
            $("#sendWhatsApp").prop("disabled", false);

        } catch (err) {
            console.error('❌ Error loading template for preview:', err);
        }
    });

    // Send via WhatsApp
    $("#sendWhatsApp").on("click", function() {
        const phone = $("#previewPhone").val();
        const message = $("#previewMessage").text();

        if (!phone || !message) {
            Swal.fire({
                icon: "warning",
                title: "Data Tidak Lengkap",
                text: "Pilih tamu terlebih dahulu."
            });
            return;
        }

        // Format phone number (remove leading 0, add 62)
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('62')) {
            formattedPhone = '62' + formattedPhone;
        }

        // Encode message untuk URL
        const encodedMessage = encodeURIComponent(message);

        // Open WhatsApp Web
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');

        console.log('✅ Opening WhatsApp for:', formattedPhone);
    });

    // Load guest list saat tab dibuka
    $('button[data-bs-target="#formInvitation"]').on("click", function() {
        loadGuestListForInvitation();
    });


    // ==============================
    // ✅ SEND WHATSAPP DIRECT FROM LIST
    // ==============================

    // Helper function untuk format phone number
    function formatPhoneNumber(phone) {
        let formatted = phone.replace(/\D/g, '');
        if (formatted.startsWith('0')) {
            formatted = '62' + formatted.substring(1);
        } else if (!formatted.startsWith('62')) {
            formatted = '62' + formatted;
        }
        return formatted;
    }

    // Helper function untuk update send tracking
    async function updateSendTracking(guestId) {
        try {
            const docRef = doc(window.db, "guest", guestId);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                console.error('❌ Guest not found:', guestId);
                return false;
            }

            const currentData = docSnap.data();
            const currentSendCount = currentData.sendCount || 0;

            await updateDoc(docRef, {
                lastSent: serverTimestamp(),
                sendCount: currentSendCount + 1,
                updatedAt: serverTimestamp(),
                adminKey: ADMIN_KEY
            });

            console.log('✅ Send tracking updated:', { guestId, sendCount: currentSendCount + 1 });
            return true;

        } catch (err) {
            console.error('❌ Error updating send tracking:', err);
            return false;
        }
    }

    // Handler untuk tombol WhatsApp di list
    $(document).on("click", ".sendWhatsAppDirect", async function() {
        const $btn = $(this);
        const guestId = $btn.data("id");
        const guestName = $btn.data("name");
        const guestPhone = $btn.data("phone");

        if (!guestPhone) {
            Swal.fire({
                icon: "warning",
                title: "Nomor Tidak Ada",
                text: "Tamu ini belum memiliki nomor WhatsApp."
            });
            return;
        }

        // Disable button sementara
        $btn.prop("disabled", true);

        try {
            // Load template
            const docRef = doc(window.db, "chatInvitation", TEMPLATE_DOC_ID);
            const docSnap = await getDoc(docRef);

            let template = DEFAULT_TEMPLATE;
            if (docSnap.exists()) {
                template = docSnap.data().template || DEFAULT_TEMPLATE;
            }

            // Replace placeholders
            const guestLink = `${url_domain}?g=${guestId}`;
            const message = template
                .replace(/\[Nama Tamu\]/g, guestName)
                .replace(/\[Link Undangan\]/g, guestLink);

            // Format phone number
            const formattedPhone = formatPhoneNumber(guestPhone);

            // Encode message
            const encodedMessage = encodeURIComponent(message);

            // Update tracking
            await updateSendTracking(guestId);

            // Open WhatsApp
            const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
            window.open(whatsappUrl, '_blank');

            // Show success message
            Swal.fire({
                icon: "success",
                title: "WhatsApp Dibuka",
                text: `Pesan untuk ${guestName} siap dikirim!`,
                timer: 2000,
                showConfirmButton: false
            });

            console.log('✅ WhatsApp opened for:', guestName, formattedPhone);

            // Reload list untuk update tracking info
            setTimeout(() => {
                loadGuestList();
            }, 1000);

        } catch (err) {
            console.error('❌ Error sending WhatsApp:', err);
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: "Gagal membuka WhatsApp. Coba lagi."
            });
        } finally {
            // Re-enable button
            $btn.prop("disabled", false);
        }
    });

    // Update sendWhatsApp dari preview untuk juga update tracking
    $("#sendWhatsApp").off("click").on("click", async function() {
        const phone = $("#previewPhone").val();
        const message = $("#previewMessage").text();
        const guestId = $("#previewGuestSelect").val();

        if (!phone || !message || !guestId) {
            Swal.fire({
                icon: "warning",
                title: "Data Tidak Lengkap",
                text: "Pilih tamu terlebih dahulu."
            });
            return;
        }

        // Format phone number
        const formattedPhone = formatPhoneNumber(phone);

        // Encode message
        const encodedMessage = encodeURIComponent(message);

        // Update tracking
        await updateSendTracking(guestId);

        // Open WhatsApp
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');

        Swal.fire({
            icon: "success",
            title: "WhatsApp Dibuka",
            text: "Pesan siap dikirim!",
            timer: 2000,
            showConfirmButton: false
        });

        console.log('✅ WhatsApp opened for:', formattedPhone);
    });


});
