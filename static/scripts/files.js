const fileList = document.getElementById('file-pane');
const dropArea = document.getElementById('drop-area');
let selectedFiles = new Set();

document.getElementById('fileElem').addEventListener('change', e => {
    [...e.target.files].forEach(uploadFile);
});

function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    fetch("/upload", {
        method: "POST",
        body: formData
    }).then(() => {
        refreshFiles();
    });
}

// 🟢 Drag-and-drop support
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('drag-hover');
    });
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('drag-hover');
    });
});

dropArea.addEventListener('drop', e => {
    const files = [...e.dataTransfer.files];
    files.forEach(uploadFile);
});

// 🔄 Refresh and animate file squares
function refreshFiles() {
    fetch("/files")
        .then(res => res.json())
        .then(files => {
            const currentSquares = Array.from(document.querySelectorAll('.file-square'));
            const currentNames = currentSquares.map(div => div.querySelector('span')?.textContent);
            const newSet = new Set(files);

            // Animate removal
            currentSquares.forEach(div => {
                const name = div.querySelector('span')?.textContent;
                if (!newSet.has(name)) {
                    div.classList.add('removing');
                    setTimeout(() => div.remove(), 300);
                }
            });

            // Capture positions before DOM changes
            const positions = new Map();
            currentSquares.forEach(div => {
                positions.set(div, div.getBoundingClientRect());
            });

            // Add new files
            files.forEach(file => {
                if (currentNames.includes(file)) return;

                const ext = file.split('.').pop().toUpperCase();
                const div = document.createElement('div');
                div.className = 'file-square';
                div.innerHTML = `
                    <input type="checkbox" class="file-checkbox" title="Select file">
                    <strong>${ext}</strong><br><span>${file}</span>
                `;

                if (selectedFiles.has(file)) {
                    div.classList.add('selected');
                    div.querySelector('.file-checkbox').checked = true;
                }

                div.querySelector('.file-checkbox').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (selectedFiles.has(file)) {
                        selectedFiles.delete(file);
                        div.classList.remove('selected');
                    } else {
                        selectedFiles.add(file);
                        div.classList.add('selected');
                    }
                });

                div.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('file-checkbox')) {
                        window.location.href = `/download/${file}`;
                    }
                });

                fileList.appendChild(div);
            });

            // Animate repositioning
            requestAnimationFrame(() => {
                const allSquares = Array.from(document.querySelectorAll('.file-square'));
                allSquares.forEach(div => {
                    const old = positions.get(div);
                    const newRect = div.getBoundingClientRect();
                    if (old) {
                        const dx = old.left - newRect.left;
                        const dy = old.top - newRect.top;
                        if (dx || dy) {
                            div.style.transform = `translate(${dx}px, ${dy}px)`;
                            div.style.transition = 'transform 0s';
                            requestAnimationFrame(() => {
                                div.style.transform = '';
                                div.style.transition = '';
                            });
                        }
                    }
                });
            });
        });
}

// 🧠 Smart download: selected or all
function downloadSelected() {
    let filesToDownload = Array.from(selectedFiles);

    if (filesToDownload.length === 0) {
        // No selection → download all
        fetch('/files')
            .then(res => res.json())
            .then(allFiles => {
                triggerZipDownload(allFiles);
            });
    } else {
        triggerZipDownload(filesToDownload);
    }
}

function triggerZipDownload(files) {
    fetch('/download_zip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files })
    })
    .then(res => res.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'files.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    });
}

function handleDelete() {
    if (selectedFiles.size > 0) {
        deleteSelected();
    } else {
        deleteAll();
    }
}

function deleteSelected() {
    fetch('/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: Array.from(selectedFiles) })
    }).then(() => {
        selectedFiles.clear();
        refreshFiles();
    });
}

function deleteAll() {
    fetch('/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: 'ALL' })
    }).then(() => {
        selectedFiles.clear();
        refreshFiles();
    });
}

refreshFiles();
setInterval(refreshFiles, 5000);
