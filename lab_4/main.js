const notesKey = 'notepocket_notes';
let notes = [];
let editingId = null;
let checklistDraft = [];

function saveNotes() {
    localStorage.setItem(notesKey, JSON.stringify(notes));
}

function loadNotes() {
    notes = JSON.parse(localStorage.getItem(notesKey) || '[]');
}

function renderNotes(filter = '') {
    const list = document.getElementById('notes-list');
    list.innerHTML = '';
    let filtered = notes;
    if (filter) {
        const q = filter.toLowerCase();
        filtered = notes.filter(note =>
            note.title.toLowerCase().includes(q) ||
            note.content.toLowerCase().includes(q) ||
            (note.tags && note.tags.some(tag => tag.toLowerCase().includes(q))) ||
            (note.checklist && note.checklist.some(item => item.text.toLowerCase().includes(q)))
        );
    }
    // Pinned notes first
    filtered.sort((a, b) => (b.pin - a.pin) || (b.created - a.created));
    for (const note of filtered) {
        const div = document.createElement('div');
        div.className = 'note' + (note.pin ? ' pinned' : '');
        div.style.background = note.color;
        div.innerHTML = `
            <div class="pin" title="Przypnij/odepnij">&#128204;</div>
            <h3>${note.title}</h3>
            <div>${note.content.replace(/\n/g, '<br>')}</div>
            <div class="tags">${note.tags && note.tags.length ? 'Tagi: ' + note.tags.join(', ') : ''}</div>
            <div class="reminder">${note.reminder ? 'Przypomnienie: ' + new Date(note.reminder).toLocaleString() : ''}</div>
            <div>Utworzono: ${new Date(note.created).toLocaleString()}</div>
            <ul class="checklist">
                ${note.checklist.map((item, idx) =>
                    `<li class="${item.done ? 'done' : ''}" data-note="${note.id}" data-idx="${idx}">${item.text}</li>`
                ).join('')}
            </ul>
            <div class="actions">
                <button data-edit="${note.id}">Edytuj</button>
                <button data-delete="${note.id}">Usuń</button>
            </div>
        `;
        list.appendChild(div);
    }
}

function resetForm() {
    document.getElementById('note-form').reset();
    document.getElementById('save-btn').textContent = 'Dodaj notatkę';
    document.getElementById('cancel-edit').style.display = 'none';
    checklistDraft = [];
    renderChecklistPreview();
    editingId = null;
}

function renderChecklistPreview() {
    const ul = document.getElementById('checklist-preview');
    ul.innerHTML = checklistDraft.map((item, idx) =>
        `<li>${item.text} <button data-remove="${idx}">Usuń</button></li>`
    ).join('');
}

function showReminderBanner() {
    const now = Date.now();
    const due = notes.filter(n => n.reminder && !n.reminderShown && new Date(n.reminder).getTime() <= now);
    const banner = document.getElementById('reminder-banner');
    if (due.length) {
        banner.style.display = 'block';
        banner.innerHTML = 'Przypomnienie: ' + due.map(n => `<b>${n.title}</b>`).join(', ');
        due.forEach(n => n.reminderShown = true);
        saveNotes();
    } else {
        banner.style.display = 'none';
    }
}

// --- Event Listeners ---

document.getElementById('add-checklist-item').onclick = () => {
    const input = document.getElementById('checklist-item');
    const text = input.value.trim();
    if (text) {
        checklistDraft.push({ text, done: false });
        input.value = '';
        renderChecklistPreview();
    }
};

document.getElementById('checklist-preview').onclick = (e) => {
    if (e.target.dataset.remove !== undefined) {
        checklistDraft.splice(Number(e.target.dataset.remove), 1);
        renderChecklistPreview();
    }
};

document.getElementById('note-form').onsubmit = function (e) {
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    const color = document.getElementById('color').value;
    const pin = document.getElementById('pin').checked;
    const tags = document.getElementById('tags').value.split(',').map(t => t.trim()).filter(Boolean);
    const reminder = document.getElementById('reminder').value;
    let checklist = checklistDraft.map(item => ({ ...item }));

    if (editingId) {
        const note = notes.find(n => n.id === editingId);
        Object.assign(note, { title, content, color, pin, tags, reminder, checklist });
    } else {
        notes.push({
            id: Date.now().toString(),
            title, content, color, pin, tags, reminder,
            created: Date.now(),
            checklist,
            reminderShown: false
        });
    }
    saveNotes();
    resetForm();
    renderNotes(document.getElementById('search').value);
    showReminderBanner();
};

document.getElementById('cancel-edit').onclick = resetForm;

document.getElementById('notes-list').onclick = function (e) {
    // Pin/unpin
    if (e.target.classList.contains('pin')) {
        const idx = Array.from(this.children).indexOf(e.target.closest('.note'));
        const note = notes[idx];
        note.pin = !note.pin;
        saveNotes();
        renderNotes(document.getElementById('search').value);
        return;
    }
    // Edit
    if (e.target.dataset.edit) {
        const note = notes.find(n => n.id === e.target.dataset.edit);
        editingId = note.id;
        document.getElementById('title').value = note.title;
        document.getElementById('content').value = note.content;
        document.getElementById('color').value = note.color;
        document.getElementById('pin').checked = note.pin;
        document.getElementById('tags').value = (note.tags || []).join(', ');
        document.getElementById('reminder').value = note.reminder || '';
        checklistDraft = note.checklist ? note.checklist.map(i => ({ ...i })) : [];
        renderChecklistPreview();
        document.getElementById('save-btn').textContent = 'Zapisz zmiany';
        document.getElementById('cancel-edit').style.display = '';
        return;
    }
    // Delete
    if (e.target.dataset.delete) {
        notes = notes.filter(n => n.id !== e.target.dataset.delete);
        saveNotes();
        renderNotes(document.getElementById('search').value);
        showReminderBanner();
        return;
    }
    // Checklist toggle
    if (e.target.tagName === 'LI' && e.target.parentElement.classList.contains('checklist')) {
        const noteId = e.target.dataset.note;
        const idx = Number(e.target.dataset.idx);
        const note = notes.find(n => n.id === noteId);
        note.checklist[idx].done = !note.checklist[idx].done;
        saveNotes();
        renderNotes(document.getElementById('search').value);
    }
};

document.getElementById('search').oninput = function () {
    renderNotes(this.value);
};

function periodicReminderCheck() {
    showReminderBanner();
    setTimeout(periodicReminderCheck, 30000);
}

// --- Init ---
loadNotes();
resetForm();
renderNotes();
showReminderBanner();
periodicReminderCheck();