const addNoteBtn = document.getElementById('add-note-btn');
const searchInput = document.getElementById('search-input');
const notesContainer = document.getElementById('notes-container');
const noteModal = document.getElementById('note-modal');
const modalTitle = document.getElementById('modal-title');
const noteIdInput = document.getElementById('note-id');
const noteTitleInput = document.getElementById('note-title');
const noteContentArea = document.getElementById('note-content-area');
const noteContentInput = document.getElementById('note-content');
const noteChecklistArea = document.getElementById('note-checklist-area');
const checklistItemsContainer = document.getElementById('checklist-items-container');
const newChecklistItemTextInput = document.getElementById('new-checklist-item-text');
const addChecklistItemBtn = document.getElementById('add-checklist-item-btn');
const noteTagsInput = document.getElementById('note-tags');
const noteColorInput = document.getElementById('note-color');
const noteReminderInput = document.getElementById('note-reminder');
const clearReminderBtn = document.getElementById('clear-reminder-btn');
const saveNoteBtn = document.getElementById('save-note-btn');
const cancelNoteBtn = document.getElementById('cancel-note-btn');
const noteTypeRadios = document.querySelectorAll('input[name="note-type"]');
const reminderPopup = document.getElementById('reminder-popup');
const reminderPopupContent = document.getElementById('reminder-popup-content');
const closeReminderPopupBtn = document.getElementById('close-reminder-popup');

let currentChecklistItems = [];
let activeReminders = {};

// zarzadzanie notatkami

const getNotes = () => {
    const notesJson = localStorage.getItem('notes');
    try {
        const notes = notesJson ? JSON.parse(notesJson) : [];
        return notes.map(note => ({
            id: note.id || Date.now().toString(),
            title: note.title || '',
            content: note.content || '',
            pinned: note.pinned || false,
            createdAt: note.createdAt || new Date().toISOString(),
            color: note.color || 'default',
            tags: Array.isArray(note.tags) ? note.tags : [],
            reminderDate: note.reminderDate || null,
            type: note.type || 'text',
            checklist: Array.isArray(note.checklist) ? note.checklist : [],
        })).sort((a, b) => {
            if (a.pinned !== b.pinned) return b.pinned - a.pinned;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    } catch (e) {
        console.error("Błąd podczas przetwarzania notatek z localStorage:", e);
        localStorage.removeItem('notes');
        return [];
    }
};

const saveNotes = (notes) => {
    localStorage.setItem('notes', JSON.stringify(notes));
    checkReminders();
};

const renderNotes = (filter = '') => {
    const notes = getNotes();
    notesContainer.innerHTML = '';
    const searchTerm = filter.toLowerCase().trim();

    const filteredNotes = notes.filter(note => {
        const searchInData = [
            note.title,
            note.type === 'text' ? (note.content || '') : '',
            ...(note.tags || []),
            ...(note.checklist ? note.checklist.map(item => item.text) : [])
        ].join(' ').toLowerCase();
        return searchInData.includes(searchTerm);
    });

    if (filteredNotes.length === 0) {
        notesContainer.innerHTML = `<p class="text-gray-500 col-span-full text-center">${searchTerm ? 'Nie znaleziono notatek.' : 'Brak notatek, dodaj pierwszą!'}</p>`;
        return;
    }

    filteredNotes.forEach(note => {
        if (note && note.id) {
            const noteElement = createNoteElement(note);
            notesContainer.appendChild(noteElement);
        } else {
            console.error("nieprawidlowa notatka:", note);
        }
    });
};

const createNoteElement = (note) => {
    const div = document.createElement('div');
    div.classList.add('note', 'p-4', 'rounded-lg', 'shadow-md', `note-color-${note.color || 'default'}`);
    div.dataset.id = note.id;

    const header = document.createElement('div');
    header.classList.add('flex', 'justify-between', 'items-start', 'mb-2');
    const title = document.createElement('h3');
    title.classList.add('text-lg', 'font-semibold', 'break-words');
    title.textContent = note.title;
    header.appendChild(title);
    const pinButton = createPinButton(note);
    header.appendChild(pinButton);
    div.appendChild(header);

    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('note-content-wrapper');
    if (note.type === 'checklist' && Array.isArray(note.checklist)) {
        renderChecklistInNote(note, contentWrapper);
    } else {
        renderTextContentInNote(note, contentWrapper);
    }
    div.appendChild(contentWrapper);

    const footer = createNoteFooter(note);
    div.appendChild(footer);

    div.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('input[type="checkbox"]')) {
            return;
        }
        openModal(note);
    });

    return div;
};

const createPinButton = (note) => {
    const pinButton = document.createElement('button');
    pinButton.classList.add('text-gray-500', 'hover:text-yellow-500', 'focus:outline-none', 'ml-2', 'flex-shrink-0');
    pinButton.innerHTML = `<i class="fas fa-thumbtack fa-lg ${note.pinned ? 'text-yellow-500' : 'text-gray-400'}"></i>`;
    pinButton.title = note.pinned ? "Odepnij" : "Przypnij";
    pinButton.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePinNote(note.id);
    });
    return pinButton;
};

const renderChecklistInNote = (note, container) => {
    (note.checklist || []).forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('flex', 'items-center', 'mb-2');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = item.done;
        checkbox.classList.add('mr-2', 'h-4', 'w-4', 'text-blue-600', 'border-gray-300', 'rounded', 'focus:ring-blue-500');
        checkbox.addEventListener('change', (e) => {
            toggleChecklistItem(note.id, index);
        });
        itemDiv.appendChild(checkbox);

        const span = document.createElement('span');
        span.textContent = item.text;
        span.classList.add('flex-grow', 'break-words');
        if (item.done) {
            span.classList.add('line-through', 'text-gray-500');
        }
        itemDiv.appendChild(span);

        container.appendChild(itemDiv);
    });
};

const renderTextContentInNote = (note, container) => {
    const content = document.createElement('p');
    content.classList.add('text-gray-700', 'whitespace-pre-wrap');
    content.textContent = note.content || '';
    container.appendChild(content);
};

const createNoteFooter = (note) => {
    const footer = document.createElement('div');
    footer.classList.add('mt-auto', 'pt-2', 'border-t', 'border-gray-200');

    if (Array.isArray(note.tags) && note.tags.length > 0) {
        const tagsDiv = document.createElement('div');
        tagsDiv.classList.add('mb-2');
        note.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.classList.add('tag');
            tagSpan.textContent = tag;
            tagsDiv.appendChild(tagSpan);
        });
        footer.appendChild(tagsDiv);
    }

    const infoDiv = createNoteInfoDiv(note);
    footer.appendChild(infoDiv);

    const controlsDiv = createNoteControls(note);
    footer.appendChild(controlsDiv);

    return footer;
};

const createNoteInfoDiv = (note) => {
    const infoDiv = document.createElement('div');
    infoDiv.classList.add('text-xs', 'text-gray-500', 'mb-2');
    const dateSpan = document.createElement('span');
    try {
        dateSpan.textContent = `Utworzono: ${new Date(note.createdAt).toLocaleString('pl-PL')}`;
    } catch {
        dateSpan.textContent = `Utworzono: (bledna data)`;
    }
    infoDiv.appendChild(dateSpan);

    if (note.reminderDate) {
        const reminderSpan = document.createElement('span');
        reminderSpan.classList.add('block', 'mt-1');
        try {
            const reminderTime = new Date(note.reminderDate);
            reminderSpan.innerHTML = `<i class="fas fa-bell mr-1 text-blue-500"></i> Przyp.: ${reminderTime.toLocaleString('pl-PL')}`;
            if (reminderTime < new Date()) {
                reminderSpan.classList.add('text-red-500', 'font-semibold');
            }
        } catch {
            reminderSpan.innerHTML = `<i class="fas fa-bell mr-1 text-red-500"></i> Przyp.: (błędna data)`;
        }
        infoDiv.appendChild(reminderSpan);
    }
    return infoDiv;
};

const createNoteControls = (note) => {
    const controlsDiv = document.createElement('div');
    controlsDiv.classList.add('flex', 'justify-end', 'space-x-3');

    const editButton = createControlButton('Edytuj', 'fas fa-edit', ['text-gray-500', 'hover:text-blue-500'], (e) => {
        e.stopPropagation();
        openModal(note);
    });

    const deleteButton = createControlButton('Usuń', 'fas fa-trash-alt', ['text-gray-500', 'hover:text-red-500'], (e) => {
        e.stopPropagation();
        const noteIdToDelete = note.id;
        const noteTitleToDelete = note.title;
        if (confirm(`Czy na pewno chcesz usunac  "${noteTitleToDelete}"?`)) {
            deleteNote(noteIdToDelete);
        }
    });

    controlsDiv.appendChild(editButton);
    controlsDiv.appendChild(deleteButton);
    return controlsDiv;
};

const createControlButton = (title, iconClass, classList = [], onClick) => {
    const button = document.createElement('button');
    button.classList.add('focus:outline-none', 'p-1', ...classList);
    button.innerHTML = `<i class="${iconClass} fa-lg"></i>`;
    button.title = title;
    button.addEventListener('click', onClick);
    return button;
};


const addNote = (data) => {
    const notes = getNotes();
    const newNote = {
        id: Date.now().toString(),
        title: data.title,
        content: data.type === 'text' ? data.content : '',
        checklist: data.type === 'checklist' ? data.checklist : [],
        color: data.color,
        tags: data.tags,
        pinned: false,
        createdAt: new Date().toISOString(),
        reminderDate: data.reminderDate,
        type: data.type
    };
    notes.push(newNote);
    saveNotes(notes);
    renderNotes(searchInput.value);
};

const updateNote = (id, data) => {
    const notes = getNotes();
    const noteIndex = notes.findIndex(note => note.id === id);
    if (noteIndex > -1) {
        notes[noteIndex] = {
            ...notes[noteIndex],
            title: data.title,
            content: data.type === 'text' ? data.content : '',
            checklist: data.type === 'checklist' ? data.checklist : [],
            color: data.color,
            tags: data.tags,
            reminderDate: data.reminderDate,
            type: data.type
        };
        saveNotes(notes);
        renderNotes(searchInput.value);
    } else {
        console.error("Nie znaleziono notatki id:", id);
    }
};

const deleteNote = (id) => {
    let notes = getNotes();
    const initialLength = notes.length;
    notes = notes.filter(note => note.id !== id);
    const finalLength = notes.length;

    if (initialLength === finalLength) {
        alert("nie znaleziono takiej notatki");
        return;
    }

    saveNotes(notes);
    renderNotes(searchInput.value);
};

const togglePinNote = (id) => {
    const notes = getNotes();
    const noteIndex = notes.findIndex(note => note.id === id);
    if (noteIndex > -1) {
        notes[noteIndex].pinned = !notes[noteIndex].pinned;
        saveNotes(notes);
        renderNotes(searchInput.value);
    }
};

const toggleChecklistItem = (noteId, itemIndex) => {
    const notes = getNotes();
    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex > -1 && notes[noteIndex].checklist && notes[noteIndex].checklist[itemIndex] !== undefined) {
        notes[noteIndex].checklist[itemIndex].done = !notes[noteIndex].checklist[itemIndex].done;
        saveNotes(notes);
        renderNotes(searchInput.value);
    }
};

// modal

const openModal = (note = null) => {
    resetModalForm();

    if (note) {
        modalTitle.textContent = 'Edytuj notatkę';
        noteIdInput.value = note.id;
        noteTitleInput.value = note.title;
        noteColorInput.value = note.color || 'default';
        noteTagsInput.value = Array.isArray(note.tags) ? note.tags.join(', ') : '';
        noteReminderInput.value = note.reminderDate ? note.reminderDate.substring(0, 16) : '';

        const noteType = note.type === 'checklist' ? 'checklist' : 'text';
        document.querySelector(`input[name="note-type"][value="${noteType}"]`).checked = true;
        updateModalView(noteType);

        if (noteType === 'text') {
            noteContentInput.value = note.content || '';
        } else {
            currentChecklistItems = note.checklist ? JSON.parse(JSON.stringify(note.checklist)) : [];
            renderChecklistInModal();
        }

    } else {
        modalTitle.textContent = 'Dodaj nowa notatkę';
        updateModalView('text');
    }

    noteModal.classList.remove('hidden');
    setTimeout(() => {
        noteModal.classList.remove('opacity-0');
        noteModal.querySelector('.modal-content').classList.remove('scale-95');
    }, 10);
};

const closeModal = () => {
    noteModal.classList.add('opacity-0');
    noteModal.querySelector('.modal-content').classList.add('scale-95');
    setTimeout(() => {
        noteModal.classList.add('hidden');
        resetModalForm();
    }, 300);
};

const resetModalForm = () => {
    noteIdInput.value = '';
    noteTitleInput.value = '';
    noteContentInput.value = '';
    noteColorInput.value = 'default';
    noteTagsInput.value = '';
    noteReminderInput.value = '';
    document.querySelector('input[name="note-type"][value="text"]').checked = true;
    updateModalView('text');
    currentChecklistItems = [];
    renderChecklistInModal();
};

const updateModalView = (type) => {
    if (type === 'checklist') {
        noteContentArea.classList.add('hidden');
        noteChecklistArea.classList.remove('hidden');
    } else {
        noteContentArea.classList.remove('hidden');
        noteChecklistArea.classList.add('hidden');
    }
};

const renderChecklistInModal = () => {
    checklistItemsContainer.innerHTML = '';
    currentChecklistItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('flex', 'items-center', 'mb-2', 'p-1', 'hover:bg-gray-100', 'rounded');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = item.done;
        checkbox.classList.add('mr-2', 'h-4', 'w-4', 'text-blue-600', 'border-gray-300', 'rounded', 'focus:ring-blue-500');
        checkbox.addEventListener('change', () => {
            currentChecklistItems[index].done = checkbox.checked;
            renderChecklistInModal();
        });
        itemDiv.appendChild(checkbox);

        const span = document.createElement('span');
        span.textContent = item.text;
        span.classList.add('flex-grow', 'break-words', 'px-2');
        if (item.done) {
            span.classList.add('line-through', 'text-gray-500');
        }
        itemDiv.appendChild(span);

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = 'Usuń element';
        deleteBtn.classList.add('ml-auto', 'text-red-500', 'hover:text-red-700', 'font-bold', 'flex-shrink-0', 'px-1');
        deleteBtn.type = 'button';
        deleteBtn.onclick = () => {
            currentChecklistItems.splice(index, 1);
            renderChecklistInModal();
        };
        itemDiv.appendChild(deleteBtn);

        checklistItemsContainer.appendChild(itemDiv);
    });
};

// listenery

addNoteBtn.addEventListener('click', () => openModal());
cancelNoteBtn.addEventListener('click', closeModal);
noteModal.addEventListener('click', (e) => {
    if (e.target === noteModal) closeModal();
});

saveNoteBtn.addEventListener('click', () => {
    const id = noteIdInput.value;
    const title = noteTitleInput.value.trim();
    const color = noteColorInput.value;
    const tags = noteTagsInput.value.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');
    const reminderValue = noteReminderInput.value;
    const reminderDate = reminderValue ? new Date(reminderValue).toISOString() : null;
    const type = document.querySelector('input[name="note-type"]:checked').value;

    let content = '';
    let checklist = [];

    if (type === 'text') {
        content = noteContentInput.value.trim();
    } else {
        checklist = currentChecklistItems;
    }

    if (!title) {
        alert("Tytuł notatki nie może być pusty.");
        noteTitleInput.focus(); return;
    }
    if (type === 'text' && !content) {
        alert("Treść notatki nie może być pusta.");
        noteContentInput.focus(); return;
    }
    if (type === 'checklist' && checklist.length === 0) {
        alert("Lista zadań nie może być pusta. Dodaj przynajmniej jeden element.");
        newChecklistItemTextInput.focus(); return;
    }

    const noteData = { title, content, checklist, color, tags, reminderDate, type };

    if (id) {
        updateNote(id, noteData);
    } else {
        addNote(noteData);
    }

    closeModal();
});

searchInput.addEventListener('input', (e) => {
    renderNotes(e.target.value);
});

noteTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        updateModalView(e.target.value);
    });
});

addChecklistItemBtn.addEventListener('click', () => {
    const text = newChecklistItemTextInput.value.trim();
    if (text) {
        currentChecklistItems.push({ text: text, done: false });
        newChecklistItemTextInput.value = '';
        renderChecklistInModal();
        newChecklistItemTextInput.focus();
    }
});

newChecklistItemTextInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addChecklistItemBtn.click();
    }
});

clearReminderBtn.addEventListener('click', () => {
    noteReminderInput.value = '';
});

closeReminderPopupBtn.addEventListener('click', () => {
    reminderPopup.style.display = 'none';
    const noteId = reminderPopup.dataset.noteId;
    if (noteId) {
        delete activeReminders[noteId];
        delete reminderPopup.dataset.noteId;
    }
});

// powiadomienia

let reminderInterval = null;

const checkReminders = () => {
    const notes = getNotes();
    const now = new Date();
    let reminderToShow = null;

    notes.forEach(note => {
        if (note.reminderDate && !activeReminders[note.id]) {
            try {
                const reminderTime = new Date(note.reminderDate);
                if (reminderTime <= now) {
                    if (!reminderToShow || reminderTime < new Date(reminderToShow.reminderDate)) {
                        reminderToShow = note;
                    }
                }
            } catch (e) {
                console.error(`blad daty dla notatki o id: ${note.id}:`, e);
            }
        }
    });

    if (reminderToShow) {
        displayReminderPopup(reminderToShow);
    }
};

const displayReminderPopup = (note) => {
    reminderPopupContent.innerHTML = `
        <p class="font-semibold break-words"><strong>${note.title}</strong></p>
        <p><small>${new Date(note.reminderDate).toLocaleString('pl-PL')}</small></p>
        ${note.content ? `<p class="text-sm break-words">${note.content.substring(0, 70)}${note.content.length > 70 ? '...' : ''}</p>` : ''}
        ${note.type === 'checklist' ? `<p class="text-sm italic">(Lista zadań)</p>` : ''}
    `;
    reminderPopup.dataset.noteId = note.id;
    activeReminders[note.id] = true;
    reminderPopup.style.display = 'block';
};

// start

document.addEventListener('DOMContentLoaded', () => {
    renderNotes();
    checkReminders();
    if (reminderInterval) clearInterval(reminderInterval);
    reminderInterval = setInterval(checkReminders, 30 * 1000);
});
